"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppForm, AppFormSkeleton } from "@/components/api-apps";
import type { AppFormValues } from "@/components/api-apps";
import type { AppOutputDTO, AppExecutionOutputDTO } from "@/src/generated";
import { AppsService } from "@/src/generated";
import { cn } from "@/lib/utils";
import { useBoundStore } from "@/stores/bound-store";

interface ApiAppPlaygroundFormProps {
    app: AppOutputDTO;
    loading: boolean;
    onSubmitStart: () => void;
    onSuccess: (result: AppExecutionOutputDTO) => void;
    onError: (error: unknown) => void;
}

/**
 * Playground form wrapper for API apps.
 * Handles submission via AppsService and matches the ViewComfy form layout.
 */
export function ApiAppPlaygroundForm({
    app,
    loading,
    onSubmitStart,
    onSuccess,
    onError,
}: ApiAppPlaygroundFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {currentTeam} = useBoundStore();

    const handleSubmit = async (data: AppFormValues) => {
        if (!currentTeam) {
            return;
        }
        setIsSubmitting(true);
        onSubmitStart();

        try {
            const result = await AppsService.executeAppApiAppsAppIdExecutePost(
                app.id,
                currentTeam.id,
                { inputData: data as Record<string, unknown> }
            );
            onSuccess(result);
        } catch (error) {
            onError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const effectiveLoading = loading || isSubmitting;

    const headerContent = (
        <div className="mb-4">
            <h2 className="text-lg font-semibold">{app.name}</h2>
            {app.description && (
                <p className="text-sm text-muted-foreground mt-1">
                    {app.description}
                </p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 w-full">
                <div className="p-4 min-w-0 pb-24 overflow-hidden">
                    <AppForm
                        key={app.id}
                        app={app}
                        onSubmit={handleSubmit}
                        header={headerContent}
                    />
                </div>
            </ScrollArea>

            <div className="sticky bottom-0 p-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-t">
                <Button
                    type="submit"
                    form="app-form"
                    className="w-full"
                    disabled={effectiveLoading}
                >
                    {effectiveLoading ? "Generating..." : "Generate"} <WandSparkles className={cn("size-5 ml-2")} />
                </Button>
            </div>
        </div>
    );
}

/**
 * Loading skeleton for the API app form
 */
export function ApiAppPlaygroundFormSkeleton() {
    return (
        <ScrollArea className="h-full flex-1">
            <div className="p-4">
                <AppFormSkeleton fieldCount={4} />
            </div>
        </ScrollArea>
    );
}

ApiAppPlaygroundForm.displayName = "ApiAppPlaygroundForm";
ApiAppPlaygroundFormSkeleton.displayName = "ApiAppPlaygroundFormSkeleton";
