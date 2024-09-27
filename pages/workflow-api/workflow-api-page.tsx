"use client";
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ViewComfyFormEditor } from '@/pages/workflow-api/view-comfy';
import { WorkflowApiJSON, workflowAPItoViewComfy } from '@/lib/workflow-api-parser';
import { Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'
import { ActionType, IViewComfyJSON, useViewComfy } from '@/app/providers/view-comfy-provider';
import { Label } from '@/components/ui/label';

export function WorkflowApiPage() {
    const [file, setFile] = useState<File | null>(null);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (parsed.file_type === "view_comfy") {
                        viewComfyStateDispatcher({
                            type: ActionType.SET_VIEW_COMFY_JSON,
                            payload: parsed as IViewComfyJSON
                        });
                    } else {
                        viewComfyStateDispatcher({
                            type: ActionType.SET_JSON,
                            payload: { viewComfyJSON: workflowAPItoViewComfy(parsed), file: file, workflowApiJSON: parsed }
                        });
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    viewComfyStateDispatcher({
                        type: ActionType.SET_JSON,
                        payload: undefined
                    });
                }
            };
            reader.readAsText(file);
        }
    }, [file, viewComfyStateDispatcher]);

    const removeFileOnClick = () => {
        setFile(null);
        viewComfyStateDispatcher({
            type: ActionType.SET_JSON,
            payload: undefined
        });
    }

    const getFileInfo = () => {
        if (viewComfyState?.file) {
            const fileSizeInKB = Math.round(viewComfyState.file.size / 1024);
            return `Uploaded file: ${viewComfyState.file.name} (${fileSizeInKB} KB)`;
        }
        return undefined;
    }

    const getDropZoneText = () => {
        if (viewComfyState?.viewComfyJSON) {
            return <div className="text-muted-foreground text-lg">
                Drag and drop your <b>workflow_api.json</b> file here or Click Here
            </div>
        } else {
            return <div className="text-muted-foreground text-lg">
                Drag and drop your <b>workflow_api.json</b> or <b>view_comfy.json</b> file here or Click Here
            </div>
        }
    }

    const showDeleteViewComfyJSON = () => {
        return viewComfyState?.viewComfyJSON && viewComfyState?.viewComfyJSON.file_type
    }

    const deleteViewComfyJSON = () => {
        if (viewComfyState?.workflowApiJSON) {
            console.log(viewComfyState?.workflowApiJSON);
            viewComfyStateDispatcher({
                type: ActionType.SET_VIEW_COMFY_JSON,
                payload: workflowAPItoViewComfy(viewComfyState?.workflowApiJSON as WorkflowApiJSON)
            });
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <Header title="Form Editor for Workflow_api.json">
            </Header>
            <main className={`flex-1 overflow-hidden p-4 ${viewComfyState?.workflowApiJSON || viewComfyState?.viewComfyJSON ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                <div className="flex flex-col w-full h-full overflow-hidden">
                    {!viewComfyState?.workflowApiJSON && (
                        <div className="w-full sm:w-1/2 sm:h-1/2 mx-auto">
                            <Dropzone
                                onChange={setFile}
                                fileExtension=".json"
                                className="custom-dropzone w-full h-full"
                                inputPlaceholder={getDropZoneText()}
                            />
                        </div>
                    )}
                    {viewComfyState?.workflowApiJSON && (
                        <div className="relative flex flex-col items-start gap-4 h-full">
                            <Button
                                variant="secondary"
                                className="border-2 border-dashed text-muted-foreground"
                                onClick={removeFileOnClick}
                            >
                                <p className="text-muted-foreground mr-2">{getFileInfo()}</p>
                                <Trash2 className="size-5" />
                            </Button>
                            <Label>Workflow API JSON</Label>
                            <ScrollArea className="w-full flex-1 rounded-md border">
                                <JsonView src={viewComfyState.workflowApiJSON} collapsed={3} displaySize={3} editable={false} />
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    )}
                </div>
                {viewComfyState?.viewComfyJSON && (
                    <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl">
                        {showDeleteViewComfyJSON() && (
                            <Button
                                variant="secondary"
                                className="border-2 border-dashed text-muted-foreground mb-3"
                                onClick={deleteViewComfyJSON}
                            >
                                <p className="text-muted-foreground mr-2">view_comfy.json</p>
                                <Trash2 className="size-5" />
                            </Button>
                        )}
                        <ViewComfyFormEditor />
                    </div>
                )}
            </main>
        </div>
    )
}
