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
import { PlaygroundForm } from "./playground-from";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/loader";
import { usePostPlayground } from "@/hooks/playground/use-post-playground";
import { IViewComfyJSON, useViewComfy } from "@/app/providers/view-comfy-provider";

function PlaygroundPageContent() {
    const { viewComfyState } = useViewComfy();
    const [formState, setFormState] = useState<IViewComfyJSON | undefined>(undefined);
    const [images, setImages] = useState<{ image: Blob, url: string }[]>([]);
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true" ? true : false;

    useEffect(() => {
        if (viewMode) {
            const fetchViewComfy = async () => {
                const response = await fetch('/api/playground');
                const data = await response.json();
                setFormState(data.viewComfyJSON);
            };
            fetchViewComfy();
        }
    }, [viewMode]);

    useEffect(() => {
        if (viewComfyState?.viewComfyJSON) {
            setFormState({ ...viewComfyState.viewComfyJSON });
        }
    }, [viewComfyState?.viewComfyJSON, setFormState]);

    const { doPost, loading } = usePostPlayground();

    useEffect(() => {
        if (viewComfyState?.viewComfyJSON) {
            setFormState({ ...viewComfyState.viewComfyJSON });
            setImages([]);
        }
    }, [viewComfyState?.viewComfyJSON, setFormState]);

    function onSubmit(data: IViewComfyJSON) {
        setFormState(data);
        const inputs: { key: string, value: string }[] = [];
        data.inputs.forEach((input) => {
            input.inputs.forEach((input) => {
                inputs.push({ key: input.key, value: input.value });
            });
        });
        data.advancedInputs.forEach((advancedInput) => {
            advancedInput.inputs.forEach((input) => {
                inputs.push({ key: input.key, value: input.value });
            });
        });
        doPost({
            viewComfy: inputs, workflow: viewComfyState?.workflowApiJSON, onSuccess: (data) => {
                onSetImages(data);
            }, onError: (error) => {
                console.log(error);
            }
        });
    }

    const onSetImages = (images: Blob[]) => {
        const newImages = images.map((image) => ({ image, url: URL.createObjectURL(image) }));
        setImages(newImages);
    };

    useEffect(() => {
        return () => {
            images.forEach((image) => URL.revokeObjectURL(image.url));
        };
    }, []);

    if (!formState) {
        return <></>;
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
                            <ScrollArea className="w-full h-full flex">
                                <div className="flex-1 p-4 flex items-center justify-center">
                                    <div className="flex flex-wrap justify-center items-center gap-4 w-full h-full">
                                        {images.map((image, index) => (
                                            <div key={image.url} className="flex items-center justify-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
                                                <img
                                                    src={image.url}
                                                    alt={`${image.url}`}
                                                    className="max-w-full max-h-[calc(100vh-12rem)] object-contain rounded-md"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}

export function PlaygroundPage() {
    return (

        <PlaygroundPageContent />
    );
}
