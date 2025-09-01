/* eslint-disable @next/next/no-img-element */
import {
    Settings,
    History,
    Download
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Fragment, useEffect, useState, useCallback } from "react";
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
import { S3FilesData } from "@/app/models/prompt-result";
import { usePostPlaygroundUser } from "@/hooks/playground/use-post-playground-user";
import { ImageComparisonProvider } from "@/components/comparison/image-comparison-provider";
import { ComparisonButton } from "@/components/comparison/comparison-button";
import { ComparisonDialog } from "@/components/comparison/comparison-dialog";
import { SelectableImage } from "@/components/comparison/selectable-image";
import { ImgComparisonSlider } from "@img-comparison-slider/react";
import { Header } from "@/components/header";

const apiErrorHandler = new ApiErrorHandler();

// Dynamically import the user content wrapper
const UserContentWrapper = dynamic(
    () => import("@/components/auth/user-content-wrapper"),
    { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlaygroundWithAuth({ userId }: { userId: string | null }) {
    const { doPost, loading, setLoading } = usePostPlaygroundUser();
    return <PlaygroundPageContent doPost={doPost} loading={loading} setLoading={setLoading} />;
}

function PlaygroundWithoutAuth() {
    const { doPost, loading, setLoading } = usePostPlayground();
    return <PlaygroundPageContent doPost={doPost} loading={loading} setLoading={setLoading} />;
}

function PlaygroundPageContent({ doPost, loading, setLoading }: { doPost: (params: IUsePostPlayground) => void, loading: boolean, setLoading: (loading: boolean) => void }) {
    const [results, setResults] = useState<{ [key: string]: { outputs: File | S3FilesData, url: string }[] }>({});
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const { currentLog, setResultCallback, setErrorCallback } = useSocket();
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [errorAlertDialog, setErrorAlertDialog] = useState<{ open: boolean, errorTitle: string | undefined, errorDescription: React.JSX.Element, onClose: () => void }>({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
    const searchParams = useSearchParams();
    const appId = searchParams?.get("appId");
    const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
    const [textOutputEnabled, setTextOutputEnabled] = useState(false);
    const [showOutputFileName, setShowOutputFileName] = useState(false);

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const onSetResults = useCallback((data: S3FilesData[] | File[]) => {
        if (!data) {
            return;
        }

        const timestamp = Date.now();
        const newGeneration: { outputs: File | S3FilesData, url: string }[] = [];

        for (const output of data) {
            if (output instanceof S3FilesData) {
                newGeneration.push({ outputs: output, url: output.filepath });
            } else {
                newGeneration.push({ outputs: output, url: URL.createObjectURL(output) });
            }
        }

        if (newGeneration.length > 0) {
            setResults((prevResults) => ({
                [timestamp]: newGeneration,
                ...prevResults
            }));
        }
        setLoading(false);
    }, [setLoading]);

    const onSocketError = useCallback((error: Error) => {
        if (!error) {
            return;
        }

        setLoading(false);

        const errorMessage = error?.message || error?.toString() || "Unknown socket error occurred";

        setErrorAlertDialog({
            open: true,
            errorTitle: "Execution Error",
            errorDescription: <>{errorMessage}</>,
            onClose: () => {
                setErrorAlertDialog({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
            }
        });
    }, [setLoading]);

    // Register the result and error callbacks with the socket provider
    useEffect(() => {
        setResultCallback(onSetResults);
        setErrorCallback(onSocketError);

        // Clean up callbacks on unmount
        return () => {
            setResultCallback(null);
            setErrorCallback(null);
        };
    }, [setResultCallback, setErrorCallback, onSetResults, onSocketError]);

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
            onSuccess: (data: File[]) => {
                onSetResults(data);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                for (const output of generation) {
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
                    <div className="relative hidden flex-col items-start gap-8 md:flex overflow-hidden">
                        {viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy && (
                            <div className="px-3 w-full">
                                <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                            </div>
                        )}
                        {viewComfyState.currentViewComfy && <PlaygroundForm viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} onSubmit={onSubmit} loading={loading} />}

                    </div>
                    <div className="relative flex h-full min-h-[50vh] rounded-xl bg-muted/50 p-1 lg:col-span-2">
                        <ScrollArea className="relative flex h-full w-full flex-1 flex-col">
                            {(Object.keys(results).length === 0) && !loading && (
                                <>  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                                    <PreviewOutputsImageGallery viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} />
                                </div>
                                    <Badge variant="outline" className="absolute right-3 top-3">
                                        Output
                                    </Badge>

                                </>
                            )}
                            {(!loading || Object.keys(results).length > 0) && Object.keys(results).length > 0 && (
                                <div className="absolute right-3 top-3 flex gap-2">
                                    <Badge variant="outline">
                                        Output
                                    </Badge>
                                </div>
                            )}
                            <div className="flex-1 h-full p-4 flex overflow-y-auto">
                                <div className="flex flex-col w-full h-full">
                                    {loading && (
                                        <div className="flex flex-col gap-4 w-full">
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
                                                    {currentLog?.data}
                                                    {!currentLog && "Prompt Scheduled"}
                                                </div>
                                            </div>
                                            <hr className="w-full py-4 border-gray-300" />
                                        </div>
                                    )}
                                    {Object.entries(results).map(([timestamp, generation], index, array) => (
                                        <div className="flex flex-col gap-4 w-full h-full" key={timestamp}>
                                            <div className="flex flex-wrap w-full h-full gap-4 pt-4" key={timestamp}>
                                                {generation.map((output) => (
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
    const userManagement = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

    const content = !userManagement ? <PlaygroundWithoutAuth /> : (
        <UserContentWrapper>
            {(userId) => <PlaygroundWithAuth userId={userId} />}
        </UserContentWrapper>
    );

    return (
        <ImageComparisonProvider>
            {content}
        </ImageComparisonProvider>
    );
}

export function ImageDialog({ output, showOutputFileName }: { output: { outputs: File | S3FilesData, url: string }, showOutputFileName: boolean }) {
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
            {showOutputFileName && parseFileName(output.outputs instanceof S3FilesData ? output.outputs.filename : output.outputs.name)}
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div className="inline-block">
                    <img
                        key={output.url}
                        src={output.url}
                        alt={`${output.url}`}
                        className="max-h-[85vh] w-auto object-contain rounded-md"
                    />
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
    )
}

export function VideoDialog({ output }: { output: { outputs: File | S3FilesData, url: string } }) {
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

export function AudioDialog({ output }: { output: { outputs: File | S3FilesData, url: string } }) {
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

export function TextOutput({ output }: { output: { outputs: File | S3FilesData, url: string } }) {
    const [text, setText] = useState<string>("");

    useEffect(() => {
        if (output.outputs instanceof File) {
            output.outputs.text().then(setText);
        } else {
            // For S3FilesData, we'd need to fetch the content from the URL
            fetch(output.url).then(response => response.text()).then(setText);
        }
    }, [output.outputs, output.url]);

    const outputName = output.outputs instanceof S3FilesData ? output.outputs.filename : output.outputs.name;

    return (
        <div className="pt-4 w-full">
            <Textarea id={outputName} value={text} readOnly className="w-full" rows={5} />
        </div>
    )
}

export function FileOutput({ output }: { output: { outputs: File | S3FilesData, url: string } }) {
    const outputName = output.outputs instanceof S3FilesData ? output.outputs.filename : output.outputs.name;

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
        output: { outputs: File | S3FilesData, url: string },
        textOutputEnabled: boolean,
        showOutputFileName: boolean,
    }) {

    const getOutputComponent = () => {
        const contentType = output.outputs instanceof S3FilesData ? output.outputs.content_type : output.outputs.type;

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
                ((output.outputs instanceof S3FilesData ? output.outputs.content_type : output.outputs.type).startsWith('text/') && textOutputEnabled) && (
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