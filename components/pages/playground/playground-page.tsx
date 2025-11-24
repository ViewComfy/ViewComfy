"use client"

import {
    Settings,
    History,
    Download,
    CircleX
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import PlaygroundForm from "./playground-form";
import { usePostPlayground } from "@/hooks/playground/use-post-playground";
import { ActionType, type IViewComfy, type IViewComfyWorkflow, useViewComfy } from "@/app/providers/view-comfy-provider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { ApiErrorHandler } from "@/lib/api-error-handler";
import type { ResponseError } from "@/app/models/errors";
import BlurFade from "@/components/ui/blur-fade";
import { cn, getComfyUIRandomSeed } from "@/lib/utils";
import WorkflowSwitcher from "@/components/workflow-switchter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewOutputsImageGallery } from "@/components/images-preview"
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { IUsePostPlayground } from "@/hooks/playground/interfaces";
import { HistorySidebar } from "@/components/history-sidebar";
import { Textarea } from "@/components/ui/textarea";
import * as constants from "@/app/constants";
import { useSocket } from "@/app/providers/socket-provider";
import { ISetResults, S3FilesData } from "@/app/models/prompt-result";
import { usePostPlaygroundUser } from "@/hooks/playground/use-post-playground-user";
import { ComparisonButton } from "@/components/comparison/comparison-button";
import { ComparisonDialog } from "@/components/comparison/comparison-dialog";
import { SelectableImage } from "@/components/comparison/selectable-image";
import { ImgComparisonSlider } from "@img-comparison-slider/react";
import { Header } from "@/components/header";
import {
    TransformWrapper,
    TransformComponent,

} from "react-zoom-pan-pinch";
import { IWorkflowHistoryFileModel, IWorkflowHistoryModel, IWorkflowResult } from "@/app/interfaces/workflow-history";
import { useWorkflowData } from "@/app/providers/workflows-data-provider";
import { SettingsService } from "@/app/services/settings-service";

const settingsService = new SettingsService();

export interface IOutput {
    file: File | S3FilesData,
    url: string
}

interface IGeneration {
    status?: string | undefined;
    outputs: IOutput[],
    errorData?: string | undefined;
}


interface IResults {
    [promptId: string]: IGeneration;
}


const apiErrorHandler = new ApiErrorHandler();

// Dynamically import the user content wrapper
const UserContentWrapper = dynamic(
    () => import("@/components/auth/user-content-wrapper"),
    { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlaygroundWithAuth({ userId }: { userId: string | null }) {
    const { setLoading, ...params } = usePostPlaygroundUser();
    const { runningWorkflows, workflowsCompleted } = useWorkflowData();

    return <PlaygroundPageContent {...{ ...params, runningWorkflows, setLoading, workflowsCompleted }} />;
}

function PlaygroundWithoutAuth() {
    const params = usePostPlayground();
    return <PlaygroundPageContent {...{ ...params, runningWorkflows: [], workflowsCompleted: [] }} />;
}

interface IPlaygroundPageContent {
    doPost: (params: IUsePostPlayground) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    runningWorkflows: IWorkflowHistoryModel[];
    workflowsCompleted: IWorkflowResult[];
}

const getOutputFileName = (output: { file: File | S3FilesData, url: string }): string => {
    if ("filename" in output.file) {
        return output.file.filename;
    } else {
        return output.file.name;
    }
}

const getOutputContentType = (output: IOutput): string => {
    if ("contentType" in output.file) {
        return output.file.contentType;
    } else {
        return output.file.type;
    }
}

function PlaygroundPageContent({ doPost, loading, setLoading, runningWorkflows, workflowsCompleted }: IPlaygroundPageContent) {
    const [results, setResults] = useState<IResults>({});
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [errorAlertDialog, setErrorAlertDialog] = useState<{ open: boolean, errorTitle: string | undefined, errorDescription: React.JSX.Element, onClose: () => void }>({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
    const searchParams = useSearchParams();
    const appId = searchParams?.get("appId");
    const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
    const [textOutputEnabled, setTextOutputEnabled] = useState(false);
    const [showOutputFileName, setShowOutputFileName] = useState(false);
    const [permission, setPermission] = useState<"default" | "granted" | "denied">("default");
    const [isRequesting, setIsRequesting] = useState(false);
    const isNotificationAvailable = window && 'Notification' in window;

    const requestPermission = useCallback(async () => {
        if (!isNotificationAvailable) {
            return;
        }
        if (permission === 'default' && !isRequesting) {
            setIsRequesting(true);
            try {
                const result = await Notification.requestPermission();
                setPermission(result);
                setPermission(Notification.permission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                setPermission(Notification.permission);
            } finally {
                setIsRequesting(false);
            }
        }
    }, [permission, isRequesting, isNotificationAvailable]);

    const sendNotification = useCallback(async () => {
        if (!isNotificationAvailable) {
            return;
        }
        if (permission === 'granted') {
            new Notification('ViewComfy Generation Complete!', {
                body: 'Your image generation has finished.',
                icon: '/view_comfy_logo.svg',
            });
        } else if (permission === 'default') {
            await requestPermission();
        }
    }, [permission, requestPermission, isNotificationAvailable]);

    useEffect(() => {

        if (viewMode) {
            const fetchViewComfy = async () => {
                try {
                    const apiUrl = appId ? `/api/playground?appId=${appId}` : "/api/playground";
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        const responseError: ResponseError =
                            await response.json();
                        throw responseError;
                    }
                    const data = await response.json();
                    viewComfyStateDispatcher({ type: ActionType.INIT_VIEW_COMFY, payload: data.viewComfyJSON });

                } catch (error: any) {
                    if (error.errorType) {
                        const responseError =
                            apiErrorHandler.apiErrorToDialog(error);
                        setErrorAlertDialog({
                            open: true,
                            errorTitle: responseError.title,
                            errorDescription: <>{responseError.description}</>,
                            onClose: () => { },
                        });
                    } else {
                        setErrorAlertDialog({
                            open: true,
                            errorTitle: "Error",
                            errorDescription: <>{error.message}</>,
                            onClose: () => { },
                        });
                    }
                }
            };
            fetchViewComfy();
        }
    }, [viewMode, viewComfyStateDispatcher, appId]);

    const onSetResults = useCallback(async (params: ISetResults) => {
        const { promptId, status, errorData } = params;
        const outputs = params.outputs || [];
        const resultOutputs: {
            file: File | S3FilesData | IWorkflowHistoryFileModel,
            url: string
        }[] = [];

        for (const output of outputs) {
            let url;
            if (output instanceof File) {
                try {
                    url = URL.createObjectURL(output);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    console.error("cannot parse output to URL")
                    console.log({ output });
                    url = "";
                }
            } else {
                url = output.filepath;
            }
            // if (output instanceof S3FilesData || output.hasOwnProperty("filepath")) {
            //     url = output.filepath;
            // } else {


            // }
            resultOutputs.push({ file: output, url })
        }

        const newGeneration: IResults = {
            [promptId]: {
                status: status,
                outputs: resultOutputs,
                errorData,
            }
        };

        setResults((prevResults) => {
            if (prevResults[promptId]) {
                return prevResults;
            }
            return {
                ...newGeneration,
                ...prevResults,
            };
        });
        setLoading(false);
        await sendNotification();
    }, [setLoading, sendNotification]);

    useEffect(() => {
        if (workflowsCompleted.length === 0) {
            return;
        }
        const addWorkflows = async () => {
            for (const w of workflowsCompleted) {
                const outputs = w.outputs || [];
                await onSetResults({ promptId: w.promptId, outputs, errorData: w.errorData, status: w.status });
            };
        }
        addWorkflows();

    }, [workflowsCompleted, onSetResults]);


    function onSubmit(data: IViewComfyWorkflow) {
        const inputs: { key: string, value: unknown }[] = [];

        for (const dataInputs of data.inputs) {
            for (const input of dataInputs.inputs) {
                inputs.push({ key: input.key, value: input.value });
            }
        }

        for (const advancedInput of data.advancedInputs) {
            for (const input of advancedInput.inputs) {
                inputs.push({ key: input.key, value: input.value });
            }
        }

        const generationData = {
            inputs: inputs,
            textOutputEnabled: data.textOutputEnabled ?? false
        };

        for (const input of generationData.inputs) {
            if (constants.SEED_LIKE_INPUT_VALUES.some(str => input.key.includes(str)) && input.value === Number.MIN_VALUE) {
                const newSeed = getComfyUIRandomSeed();
                input.value = newSeed;
            }
        };

        setTextOutputEnabled(data.textOutputEnabled ?? false);
        setShowOutputFileName(data.showOutputFileName ?? false);

        const doPostParams = {
            viewComfy: generationData,
            workflow: viewComfyState.currentViewComfy?.workflowApiJSON,
            viewcomfyEndpoint: viewComfyState.currentViewComfy?.viewComfyJSON.viewcomfyEndpoint ?? "",
            onSuccess: (params: { promptId: string, outputs: File[] }) => {
                onSetResults({ ...params });

            }, onError: (error: any) => {
                const errorDialog = apiErrorHandler.apiErrorToDialog(error);
                setErrorAlertDialog({
                    open: true,
                    errorTitle: errorDialog.title,
                    errorDescription: <> {errorDialog.description} </>,
                    onClose: () => {
                        setErrorAlertDialog({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
                    }
                });
            }
        }

        doPost(doPostParams);
    }

    useEffect(() => {
        return () => {
            for (const generation of Object.values(results)) {
                for (const output of generation.outputs) {
                    URL.revokeObjectURL(output.url);
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSelectChange = (data: IViewComfy) => {
        return viewComfyStateDispatcher({
            type: ActionType.UPDATE_CURRENT_VIEW_COMFY,
            payload: { ...data }
        });
    }

    const onShowErrorDialog = (error: string) => {
        setErrorAlertDialog({
            open: true,
            errorTitle: "Error",
            errorDescription: <> {error} </>,
            onClose: () => {
                setErrorAlertDialog({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
            }
        });
    }

    if (!viewComfyState.currentViewComfy) {
        return <>
            <div className="flex flex-col h-screen">
                <ErrorAlertDialog open={errorAlertDialog.open} errorTitle={errorAlertDialog.errorTitle} errorDescription={errorAlertDialog.errorDescription} onClose={errorAlertDialog.onClose} />
            </div>
        </>;
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="md:grid md:grid-cols-2">
                    <div>
                        <Header title={""} />
                    </div>
                    <div className="hidden pr-4 md:flex md:items-center md:justify-end gap-2">
                        <ComparisonButton />
                        <ComparisonDialog />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistorySidebarOpen(value => !value)}
                        >
                            <History className="h-4 w-4" />
                            History
                        </Button>
                    </div>
                </div>
                <div className="md:hidden w-full flex pl-4 gap-x-2">
                    <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden self-bottom w-[85px] gap-1">
                                <Settings className="size-4" />
                                Settings
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh] gap-4 px-4 h-full">
                            <PlaygroundForm viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} onSubmit={onSubmit} loading={loading} />
                        </DrawerContent>
                    </Drawer>
                </div>
                <main className="grid overflow-hidden flex-1 gap-4 p-2 md:grid-cols-2 lg:grid-cols-3">
                    <div className="relative hidden flex-col items-start gap-8 md:flex overflow-hidden pb-12">
                        {viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy && (
                            <div className="px-3 w-full">
                                <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                            </div>
                        )}
                        {viewComfyState.currentViewComfy && <PlaygroundForm viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} onSubmit={onSubmit} loading={loading} />}
                    </div>
                    <div className="relative flex h-full min-h-[50vh] rounded-xl bg-muted/50 p-1 lg:col-span-2">
                        <ScrollArea className="relative flex h-full w-full flex-1 flex-col">
                            {(Object.keys(results).length === 0) && runningWorkflows.length === 0 && !loading && (
                                <>  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                                    <PreviewOutputsImageGallery viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} />
                                </div>
                                    <Badge variant="outline" className="absolute right-3 top-3">
                                        Output preview
                                    </Badge>
                                </>
                            )}
                            {(Object.keys(results).length > 0) && (
                                <div className="absolute right-3 top-3 flex gap-2">
                                    <Badge variant="outline">
                                        Output
                                    </Badge>
                                </div>
                            )}
                            <div className="flex-1 h-full p-4 flex overflow-y-auto">
                                <div className="flex flex-col w-full h-full">
                                    <Generating loading={loading} runningWorkflows={runningWorkflows} />
                                    {Object.entries(results).map(([promptId, generation], index, array) => (
                                        <div className="flex flex-col gap-4 w-full h-full" key={promptId}>
                                            <div className="flex flex-wrap w-full h-full gap-4 pt-4" key={promptId}>
                                                {generation.status && generation.status === "error" &&
                                                    <GenerationError
                                                        generation={generation}
                                                        onShowErrorDialog={onShowErrorDialog}
                                                        promptId={promptId}

                                                    />
                                                }
                                                {!(generation.status && generation.status === "error") && generation.outputs.map((output) => (
                                                    <Fragment key={output.url}>
                                                        <OutputRenderer
                                                            output={output}
                                                            showOutputFileName={showOutputFileName}
                                                            textOutputEnabled={textOutputEnabled}
                                                        />
                                                    </Fragment>
                                                ))}
                                            </div>
                                            <hr className={
                                                `w-full py-4 
                                            ${index !== array.length - 1 ? 'border-gray-300' : 'border-transparent'}
                                            `
                                            }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                        <HistorySidebar open={historySidebarOpen} setOpen={setHistorySidebarOpen} />
                    </div>
                </main>
                <ErrorAlertDialog open={errorAlertDialog.open} errorTitle={errorAlertDialog.errorTitle} errorDescription={errorAlertDialog.errorDescription} onClose={errorAlertDialog.onClose} />
            </div>
        </>
    )
}

export default function PlaygroundPage() {
    const userManagement = settingsService.isUserManagementEnabled();

    const content = !userManagement ? <PlaygroundWithoutAuth /> : (
        <UserContentWrapper>
            {(userId) => <PlaygroundWithAuth userId={userId} />}
        </UserContentWrapper>
    );

    return content;
}

export function ImageDialog({ output, showOutputFileName }: { output: { file: File | S3FilesData, url: string }, showOutputFileName: boolean }) {
    const backgroundColor = "black";
    const scaleUp = false;
    const zoomFactor = 8;

    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);

    const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
    const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);

    const imageScale = useMemo((): number => {
        if (
            containerWidth === 0 ||
            containerHeight === 0 ||
            imageNaturalWidth === 0 ||
            imageNaturalHeight === 0
        )
            return 0;
        const scale = Math.min(
            containerWidth / imageNaturalWidth,
            containerHeight / imageNaturalHeight,
        );
        return scaleUp ? scale : Math.max(scale, 1);
    }, [
        scaleUp,
        containerWidth,
        containerHeight,
        imageNaturalWidth,
        imageNaturalHeight,
    ]);

    const handleResize = useCallback(() => {
        if (container !== null) {
            const rect = container.getBoundingClientRect();
            setContainerWidth(rect.width);
            setContainerHeight(rect.height);
        } else {
            setContainerWidth(0);
            setContainerHeight(0);
        }
    }, [container]);

    useEffect(() => {
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [handleResize]);

    const handleImageOnLoad = (image: HTMLImageElement) => {
        setImageNaturalWidth(image.naturalWidth);
        setImageNaturalHeight(image.naturalHeight);
    };

    useEffect(() => {
        const image = new Image();
        image.onload = () => handleImageOnLoad(image);
        image.src = output.url;
    }, [output]);


    return (
        <Dialog>
            <DialogTrigger asChild>
                <img
                    key={output.url}
                    src={output.url}
                    alt={`${output.url}`}
                    className={cn("w-full h-64 object-cover rounded-md transition-all hover:scale-105 hover:cursor-pointer")}
                />
            </DialogTrigger>
            {showOutputFileName && parseFileName(getOutputFileName(output))}
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor,
                        cursor: "zoom-in"
                    }}
                    ref={(el: HTMLDivElement | null) => {
                        setContainer(el);
                    }}
                >
                    <TransformWrapper
                        key={`${containerWidth}x${containerHeight}`}
                        initialScale={imageScale}
                        minScale={imageScale}
                        maxScale={imageScale * zoomFactor}
                        centerOnInit
                    >
                        <TransformComponent
                            wrapperStyle={{
                                width: "100%",
                                height: "100%",
                            }}
                        >
                            <img key={output.url}
                                src={output.url}
                                alt={`${output.url}`}
                                className="max-h-[85vh] w-auto object-contain rounded-md"
                            />
                        </TransformComponent>
                    </TransformWrapper>
                </div>
                <DialogFooter className="bg-transparent">
                    <Button className="w-full"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = output.url;
                            link.download = `${output.url.split('/').pop()}`;
                            link.click();
                        }}
                    >Download</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function VideoDialog({ output }: { output: IOutput }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <video
                    key={output.url}
                    className="w-full h-64 object-cover rounded-md hover:cursor-pointer"
                    controls
                >
                    <track default kind="captions" srcLang="en" src="SUBTITLE_PATH" />
                    <source src={output.url} />
                </video>
            </DialogTrigger>
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <video
                    key={output.url}
                    className="max-h-[85vh] w-auto object-contain rounded-md"
                    controls
                >
                    <track default kind="captions" srcLang="en" src="SUBTITLE_PATH" />
                    <source src={output.url} />
                </video>
            </DialogContent>
        </Dialog>
    )
}

export function AudioDialog({ output }: { output: IOutput }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <audio src={output.url} controls />
            </DialogTrigger>
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <audio src={output.url} controls />
            </DialogContent>
        </Dialog>
    )
}

export function TextOutput({ output }: { output: IOutput }) {
    const [text, setText] = useState<string>("");

    useEffect(() => {
        if (output.file instanceof File) {
            output.file.text().then(setText);
        } else {
            const fetchText = async () => {
                try {
                    const response = await fetch(`/api/text-proxy?url=${encodeURIComponent(output.url)}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch text: ${response.status}`);
                    }
                    const textData = await response.text();
                    setText(textData);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e: any) {
                    setText("");
                }
            };

            fetchText();
        }
    }, [output.file, output.url]);

    const outputName = getOutputFileName(output);

    return (
        <div className="pt-4 w-full">
            <Textarea id={outputName} value={text} readOnly className="w-full" rows={5} />
        </div>
    )
}

export function FileOutput({ output }: { output: IOutput }) {
    const outputName = getOutputFileName(output);

    return (
        <div
            key={output.url}
            className="flex w-full items-center justify-center"
        >
            <Button onClick={() => {
                const link = document.createElement('a');
                link.href = output.url;
                link.download = outputName;
                link.click();
            }}>
                <Download className="h-4 w-4 mr-2" />
                {outputName}
            </Button>
        </div>
    )
}


function OutputRenderer({
    output,
    textOutputEnabled,
    showOutputFileName }:
    {
        output: IOutput,
        textOutputEnabled: boolean,
        showOutputFileName: boolean,
    }) {


    const getOutputComponent = () => {
        const contentType = getOutputContentType(output);

        if (contentType.startsWith('image/') && contentType !== "image/vnd.adobe.photoshop") {
            return (
                <SelectableImage imageUrl={output.url}>
                    <ImageDialog output={output} showOutputFileName={showOutputFileName} />
                </SelectableImage>
            );
        } else if (contentType.startsWith('video/')) {
            return <VideoDialog output={output} />
        } else if (contentType.startsWith('audio/')) {
            return <AudioDialog output={output} />
        } else if (contentType.startsWith('text/')) {
            return null;
        } else {
            return <FileOutput output={output} />;
        }
    }

    const outputComponent = getOutputComponent();

    return (
        <>
            {outputComponent && (
                <div
                    key={output.url}
                    className="flex items-center justify-center sm:w-[calc(50%-2rem)] lg:w-[calc(33.333%-2rem)]"
                >
                    <BlurFade key={output.url} delay={0.25} inView className="flex items-center justify-center w-full h-full">
                        {outputComponent}
                    </BlurFade>
                </div>
            )}
            {
                ((getOutputContentType(output)).startsWith('text/') && textOutputEnabled) && (
                    <BlurFade key={`${output.url}-text`} delay={0.25} inView className="flex items-center justify-center w-full h-full">
                        <TextOutput output={output} />
                    </BlurFade>
                )
            }
        </>
    )
}


export function ImageCompareDialog({ image1, image2, onClose, isOpen }: { image1: string, image2: string, onClose: () => void, isOpen: boolean }) {
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div className="inline-block">
                    <ImgComparisonSlider>
                        <img slot="first" alt="first image" src={image1} className="max-h-[85vh] w-auto object-contain" />
                        <img slot="second" alt="second image" src={image2} className="max-h-[85vh] w-auto object-contain" />
                    </ImgComparisonSlider>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function parseFileName(filename: string): string {

    if (filename.startsWith("__")) {
        return filename.substring(2,
            filename.lastIndexOf("__")
        );
    } else {
        return filename;
    }
}

const Generating = (props: {
    runningWorkflows: IWorkflowHistoryModel[],
    loading: boolean,
}) => {
    const { currentLog } = useSocket();
    const { runningWorkflows, loading } = props;

    if (runningWorkflows.length > 0) {
        return runningWorkflows.map((w) => (
            (<div key={w.promptId} className="flex flex-col gap-4 w-full">
                <div className="flex flex-wrap w-full gap-4 pt-4">
                    <div key={`loading-placeholder`} className="flex items-center justify-center sm:w-[calc(50%-2rem)] lg:w-[calc(33.333%-2rem)]">
                        <BlurFade delay={0.25} inView className="flex items-center justify-center w-full h-full">
                            <div className="w-full h-64 rounded-md bg-muted animate-pulse flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted-foreground/20 animate-pulse"></div>
                                    <span className="text-sm text-muted-foreground animate-pulse">Generating...</span>
                                </div>
                            </div>
                        </BlurFade>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                        {currentLog && currentLog[w.promptId] && (
                            currentLog[w.promptId]
                        )}
                        {(!currentLog || !currentLog[w.promptId]) && (
                            "Prompt Scheduled"
                        )}
                    </div>
                </div>
                <hr className="w-full py-4 border-gray-300" />
            </div>)
        ))
    } else if (loading) {
        return (<div className="flex flex-col gap-4 w-full">
            <div className="flex flex-wrap w-full gap-4 pt-4">
                <div key={`loading-placeholder`} className="flex items-center justify-center sm:w-[calc(50%-2rem)] lg:w-[calc(33.333%-2rem)]">
                    <BlurFade delay={0.25} inView className="flex items-center justify-center w-full h-full">
                        <div className="w-full h-64 rounded-md bg-muted animate-pulse flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 animate-pulse"></div>
                                <span className="text-sm text-muted-foreground animate-pulse">Generating...</span>
                            </div>
                        </div>
                    </BlurFade>
                </div>
            </div>
            <hr className="w-full py-4 border-gray-300" />
        </div>)
    } else {
        return null
    }
}

const GenerationError = (params: {
    generation: IGeneration,
    promptId: string,
    onShowErrorDialog: (error: string) => void,
}) => {
    const { generation, promptId, onShowErrorDialog } = params;

    const getErrorMessage = (gen: IGeneration): string => {
        return gen.errorData || "Something went wrong running your workflow";
    }

    return (
        <div key={promptId} className="flex flex-col gap-4 w-full">
            <div className="flex flex-wrap w-full gap-4 pt-4">
                <div key={`${promptId}-loading-placeholder`} className="flex items-center justify-center sm:w-[calc(50%-2rem)] lg:w-[calc(33.333%-2rem)]">
                    <BlurFade delay={0.25} inView className="flex items-center justify-center w-full h-full">
                        <div className="w-full h-64 rounded-md bg-muted flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                {/* <div className="w-8 h-8 rounded-full bg-muted-foreground/20"></div> */}
                                <CircleX color="#ff0000" />

                                <span className="text-sm text-muted-foreground">
                                    <Button
                                        variant={"outline"}
                                        onClick={() => onShowErrorDialog(getErrorMessage(generation))}>
                                        Show Error
                                    </Button>
                                </span>
                            </div>
                        </div>
                    </BlurFade>
                </div>
            </div>
            {/* <hr className="w-full py-4 border-gray-300" /> */}
        </div>
    )
}
