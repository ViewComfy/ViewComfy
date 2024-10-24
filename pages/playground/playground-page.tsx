import {
    Settings
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { PlaygroundForm } from "./playground-form";
import { Loader } from "@/components/loader";
import { usePostPlayground } from "@/hooks/playground/use-post-playground";
import { ActionType, type IViewComfy, type IViewComfyWorkflow, useViewComfy } from "@/app/providers/view-comfy-provider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { ApiErrorHandler } from "@/lib/api-error-handler";
import type { ResponseError } from "@/app/models/errors";
import BlurFade from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";
import WorkflowSwitcher from "@/components/workflow-switchter";


const apiErrorHandler = new ApiErrorHandler();

function PlaygroundPageContent() {
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [outputs, setOutputs] = useState<{ outputs: Blob, url: string }[]>([]);
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [errorAlertDialog, setErrorAlertDialog] = useState<{ open: boolean, errorTitle: string | undefined, errorDescription: React.JSX.Element, onClose: () => void }>({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });

    useEffect(() => {
        if (viewMode) {
            const fetchViewComfy = async () => {
                try {
                    const response = await fetch("/api/playground");

                    if (!response.ok) {
                        const responseError: ResponseError =
                            await response.json();
                        throw responseError;
                    }
                    const data = await response.json();
                    viewComfyStateDispatcher({ type: ActionType.INIT_VIEW_COMFY, payload: data.viewComfyJSON });
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
    }, [viewMode, viewComfyStateDispatcher]);

    useEffect(() => {
        if (viewComfyState.currentViewComfy) {
            setOutputs([]);
        }
    }, [viewComfyState.currentViewComfy]);

    const { doPost, loading } = usePostPlayground();

    function onSubmit(data: IViewComfyWorkflow) {
        // setFormState(data);
        const inputs: { key: string, value: string }[] = [];

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

        doPost({
            viewComfy: inputs, workflow: viewComfyState.currentViewComfy?.workflowApiJSON, onSuccess: (data) => {
                onSetOutputs(data);
            }, onError: (error) => {
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
        });
    }

    const onSetOutputs = (outputs: Blob[]) => {
        const newOutputs = outputs.map((output) => ({ outputs: output, url: URL.createObjectURL(output) }));
        setOutputs(newOutputs);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        return () => {
            for (const output of outputs) {
                URL.revokeObjectURL(output.url);
            }
        };
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
            <div className="flex flex-col h-screen">
                <Header title="Playground">
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Settings className="size-4" />
                                <span className="sr-only">Settings</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh]">
                            <DrawerHeader>
                                <DrawerTitle>Configuration</DrawerTitle>
                                <DrawerDescription>
                                    Configure the settings for the model and messages.
                                </DrawerDescription>
                            </DrawerHeader>
                            <PlaygroundForm viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} onSubmit={onSubmit} loading={loading} />
                        </DrawerContent>
                    </Drawer>
                </Header>
                <main className="grid overflow-hidden flex-1 gap-4 p-2 md:grid-cols-2 lg:grid-cols-3">
                    <div className="relative hidden flex-col items-start gap-8 md:flex overflow-hidden">
                        {viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy && (
                            <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                        )}
                        {viewComfyState.currentViewComfy && <PlaygroundForm viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} onSubmit={onSubmit} loading={loading} />}

                    </div>
                    <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
                        <Badge variant="outline" className="absolute right-3 top-3">
                            Output
                        </Badge>
                        {loading ? (
                            <div className="flex-1 p-4 flex items-center justify-center">
                                <Loader />
                            </div>
                        ) : (
                            <div className="flex-1 h-full p-4 flex items-center justify-center overflow-y-auto">
                                <div className="flex flex-wrap justify-center items-center gap-4 w-full h-full">
                                    {outputs.map((output) => (
                                        <div key={output.url} className="flex items-center justify-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
                                            {(output.outputs.type.startsWith('image/')) && (
                                                <BlurFade key={output.url} delay={0.25} inView>
                                                    <img
                                                        src={output.url}
                                                        alt={`${output.url}`}
                                                        className={cn("max-w-full max-h-[calc(100vh-12rem)] object-contain rounded-md transition-all hover:scale-105")}
                                                    />
                                                </BlurFade>
                                            )}
                                            {(output.outputs.type.startsWith('video/')) && (
                                                <video
                                                    key={output.url}
                                                    className="max-w-full max-h-[calc(100vh-12rem)] object-contain rounded-md"
                                                    autoPlay
                                                    loop

                                                >
                                                    <track default kind="captions" srcLang="en" src="" />
                                                    <source src={output.url} />
                                                </video>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
                <ErrorAlertDialog open={errorAlertDialog.open} errorTitle={errorAlertDialog.errorTitle} errorDescription={errorAlertDialog.errorDescription} onClose={errorAlertDialog.onClose} />
            </div>
        </>
    )
}

export function PlaygroundPage() {
    return (

        <PlaygroundPageContent />
    );
}
