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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/loader";
import { usePostPlayground } from "@/hooks/playground/use-post-playground";
import { type IViewComfyJSON, useViewComfy } from "@/app/providers/view-comfy-provider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { ApiErrorHandler } from "@/lib/api-error-handler";
import type { ResponseError } from "@/app/models/errors";


const apiErrorHandler = new ApiErrorHandler();

function PlaygroundPageContent() {    
    const { viewComfyState } = useViewComfy();
    const [formState, setFormState] = useState<IViewComfyJSON | undefined>(undefined);
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
                    setFormState(data.viewComfyJSON);
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
    }, [viewMode]);

    useEffect(() => {
        if (viewComfyState?.viewComfyJSON) {
            setFormState({ ...viewComfyState.viewComfyJSON });
        }
    }, [viewComfyState?.viewComfyJSON]);

    const { doPost, loading } = usePostPlayground();

    useEffect(() => {
        if (viewComfyState?.viewComfyJSON) {
            setFormState({ ...viewComfyState.viewComfyJSON });
            setOutputs([]);
        }
    }, [viewComfyState?.viewComfyJSON]);

    function onSubmit(data: IViewComfyJSON) {
        setFormState(data);
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
            viewComfy: inputs, workflow: viewComfyState?.workflowApiJSON, onSuccess: (data) => {
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

    if (!formState) {
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
                            <PlaygroundForm viewComfyJSON={formState} onSubmit={onSubmit} loading={loading} />
                        </DrawerContent>
                    </Drawer>
                </Header>
                <main className="grid overflow-hidden flex-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="relative hidden flex-col items-start gap-8 md:flex overflow-hidden">
                        <PlaygroundForm viewComfyJSON={formState} onSubmit={onSubmit} loading={loading} />
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
                                        {outputs.map((output, index) => (
                                            <div key={output.url} className="flex items-center justify-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
                                                {(true) && (
                                                    <img
                                                        src={output.url}
                                                        alt={`${output.url}`}
                                                        className="max-w-full max-h-[calc(100vh-12rem)] object-contain rounded-md"
                                                    />
                                                )}
                                                {(false) && (
                                                    <video 
                                                        className="max-w-full max-h-[calc(100vh-12rem)] object-contain rounded-md"
                                                        autoPlay
                                                        loop 
                                                    >
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
