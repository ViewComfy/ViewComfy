/* eslint-disable @next/next/no-img-element */
import {
    Settings
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Fragment, useEffect, useState } from "react";
import { Header } from "@/components/header";
import PlaygroundForm from "./playground-form";
import { Loader } from "@/components/loader";
import { usePostPlayground } from "@/hooks/playground/use-post-playground";
import { ActionType, type IViewComfy, type IViewComfyWorkflow, useViewComfy } from "@/app/providers/view-comfy-provider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { ApiErrorHandler } from "@/lib/api-error-handler";
import type { ResponseError } from "@/app/models/errors";
import BlurFade from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";
import WorkflowSwitcher from "@/components/workflow-switchter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewOutputsImageGallery } from "@/components/images-preview"
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'

const apiErrorHandler = new ApiErrorHandler();

// Dynamically import the user content wrapper
const UserContentWrapper = dynamic(
    () => import("@/components/auth/user-content-wrapper"),
    { ssr: false }
);

function PlaygroundPageContent({ userId = null }: { userId: string | null }) {
    const [results, SetResults] = useState<{ [key: string]: { outputs: Blob, url: string }[] }>({});
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [errorAlertDialog, setErrorAlertDialog] = useState<{ open: boolean, errorTitle: string | undefined, errorDescription: React.JSX.Element, onClose: () => void }>({ open: false, errorTitle: undefined, errorDescription: <></>, onClose: () => { } });
    const searchParams = useSearchParams();
    const appId = searchParams?.get("appId");

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

    const { doPost, loading } = usePostPlayground();

    // useEffect(() => {
    //     if (viewComfyState?.viewComfyJSON) {
    //         setFormState({ ...viewComfyState.viewComfyJSON });
    //         SetResults({});
    //     }
    // }, [viewComfyState?.viewComfyJSON]);

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

        const generationData = {
            inputs: inputs,
            textOutputEnabled: data.textOutputEnabled ?? false
        };

        doPost({
            viewComfy: generationData,
            workflow: viewComfyState.currentViewComfy?.workflowApiJSON,
            viewcomfyEndpoint: viewComfyState.currentViewComfy?.viewComfyJSON.viewcomfyEndpoint ?? "",
            onSuccess: (data) => {
                onSetResults(data);

                // If user is logged in, could save their generation history
                if (userId) {
                    // Save to user history logic
                    console.log(`Saving generation results for user ${userId}`);
                }
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

    const onSetResults = (data: Blob[]) => {
        const timestamp = Date.now();
        const newGeneration = data.map((output) => ({ outputs: output, url: URL.createObjectURL(output) }));
        SetResults((prevResults) => ({
            [timestamp]: newGeneration,
            ...prevResults
        }));
    };

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
                <Header title={"Playground"} />
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
                    <div className="relative h-full min-h-[50vh] rounded-xl bg-muted/50 px-1 lg:col-span-2">
                        <ScrollArea className="relative flex h-full w-full flex-col">
                            {(Object.keys(results).length === 0) && !loading && (
                                <>  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                                    <PreviewOutputsImageGallery viewComfyJSON={viewComfyState.currentViewComfy?.viewComfyJSON} />
                                </div>
                                    <Badge variant="outline" className="absolute right-3 top-3">
                                        Output
                                    </Badge>
                                </>
                            )}
                            {loading ? (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <Loader />
                                </div>
                            ) : (
                                <div className="flex-1 h-full p-4 flex overflow-y-auto">
                                    <div className="flex flex-col w-full h-full">
                                        {Object.entries(results).map(([timestamp, generation], index, array) => (
                                            <div className="flex flex-col gap-4 w-full h-full" key={timestamp}>
                                                <div className="flex flex-wrap w-full h-full gap-4" key={timestamp}>
                                                    {generation.map((output) => (
                                                        <Fragment key={output.url}>
                                                            <div
                                                                key={output.url}
                                                                className="flex items-center justify-center px-4 sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]"
                                                            >
                                                                {(output.outputs.type.startsWith('image/')) && (
                                                                    <BlurFade key={output.url} delay={0.25} inView className="flex items-center justify-center w-full h-full">
                                                                        <img
                                                                            src={output.url}
                                                                            alt={`${output.url}`}
                                                                            className={cn("max-w-full max-h-full w-auto h-auto object-contain rounded-md transition-all hover:scale-105")}
                                                                        />
                                                                    </BlurFade>
                                                                )}
                                                                {(output.outputs.type.startsWith('video/')) && (
                                                                    <video
                                                                        key={output.url}
                                                                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-md"
                                                                        autoPlay
                                                                        loop

                                                                    >
                                                                        <track default kind="captions" srcLang="en" src="SUBTITLE_PATH" />
                                                                        <source src={output.url} />
                                                                    </video>
                                                                )}
                                                            </div>
                                                            {(output.outputs.type.startsWith('text/')) && (
                                                                <pre className="whitespace-pre-wrap break-words text-sm bg-white rounded-md w-full">
                                                                    {URL.createObjectURL(output.outputs) && (
                                                                        <object
                                                                            data={output.url}
                                                                            type={output.outputs.type}
                                                                            className="w-full"
                                                                        >
                                                                            Unable to display text content
                                                                        </object>
                                                                    )}
                                                                </pre>
                                                            )}
                                                        </Fragment>
                                                    ))}
                                                </div>
                                                <hr className={
                                                    `w-full py-4 
                                                ${index !== array.length - 1 ? 'border-gray-300' : 'border-transparent'}
                                                `}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </main>
                <ErrorAlertDialog open={errorAlertDialog.open} errorTitle={errorAlertDialog.errorTitle} errorDescription={errorAlertDialog.errorDescription} onClose={errorAlertDialog.onClose} />
            </div>
        </>
    )
}

export default function PlaygroundPage() {
    const userManagement = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

    // If user management is disabled, render without auth
    if (!userManagement) {
        return <PlaygroundPageContent userId={null} />;
    }

    // If user management is enabled, use the UserContentWrapper
    return (
        <Suspense>
            <UserContentWrapper>
                {(userId) => <PlaygroundPageContent userId={userId} />}
            </UserContentWrapper>
        </Suspense>
    );
}
