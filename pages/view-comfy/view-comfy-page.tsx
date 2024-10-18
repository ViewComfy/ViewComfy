"use client";
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ViewComfyFormEditor } from '@/pages/view-comfy/view-comfy-form-editor';
import { workflowAPItoViewComfy } from '@/lib/workflow-api-parser';
import { Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'
import { ActionType, type IViewComfy, type IViewComfyBase, type IViewComfyJSON, useViewComfy } from '@/app/providers/view-comfy-provider';
import { Label } from '@/components/ui/label';
import { ErrorAlertDialog } from '@/components/ui/error-alert-dialog';
import WorkflowSwitcher from '@/components/workflow-switchter';


class WorkflowJSONError extends Error {
    constructor() {
        super("Workflow.json file is not supported, please use workflow_api.json");
    }
}

export function ViewComfyPage() {

    const [file, setFile] = useState<File | null>(null);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [errorDialog, setErrorDialog] = useState<{ open: boolean, error: Error | undefined }>({ open: false, error: undefined });

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (parsed.file_type === "view_comfy") {
                        viewComfyStateDispatcher({
                            type: ActionType.INIT_VIEW_COMFY,
                            payload: parsed as IViewComfyJSON
                        });
                    } else if (parsed.last_node_id) {
                        throw new WorkflowJSONError();
                    }
                    else {
                        viewComfyStateDispatcher({
                            type: ActionType.SET_VIEW_COMFY_DRAFT,
                            payload: { viewComfyJSON: workflowAPItoViewComfy(parsed), workflowApiJSON: parsed, file }
                        });
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setErrorDialog({ open: true, error: error as Error });
                    viewComfyStateDispatcher({
                        type: ActionType.SET_VIEW_COMFY_DRAFT,
                        payload: undefined
                    });
                } finally {
                    setFile(null);
                }
            };
            reader.readAsText(file);
        }
    }, [file, viewComfyStateDispatcher]);

    const removeFileOnClick = () => {
        viewComfyStateDispatcher({
            type: ActionType.SET_VIEW_COMFY_DRAFT,
            payload: undefined
        });
    }

    const getFileInfo = () => {
        if (viewComfyState.viewComfyDraft?.file) {
            const fileSizeInKB = Math.round(viewComfyState.viewComfyDraft.file.size / 1024);
            return `Uploaded file: ${viewComfyState.viewComfyDraft.file.name} (${fileSizeInKB} KB)`;
        }
        return undefined;
    }

    const getDropZoneText = () => {
        if (viewComfyState.viewComfyDraft?.viewComfyJSON) {
            return <div className="text-muted-foreground text-lg">
                Drag and drop your <b>workflow_api.json</b> to start
            </div>
        }
        return <div className="text-muted-foreground text-lg">
            Drag and drop your <b>workflow_api.json</b> or <b>view_comfy.json</b> to start
        </div>
    }

    const showDeleteWorkflowButton = () => {
        return viewComfyState.currentViewComfy;
    }

    const deleteViewComfyJSON = () => {
        if (viewComfyState.currentViewComfy) {
            viewComfyStateDispatcher({
                type: ActionType.REMOVE_VIEW_COMFY,
                payload: viewComfyState.currentViewComfy,
            });
        } else {
            viewComfyStateDispatcher({
                type: ActionType.SET_VIEW_COMFY_DRAFT,
                payload: undefined,
            });
        }
    }

    const showDropZone = () => {
        return !viewComfyState.viewComfyDraft
    }

    const getOnSubmit = (data: IViewComfyBase) => {
        if (viewComfyState.currentViewComfy) {
            viewComfyStateDispatcher({
                type: ActionType.UPDATE_VIEW_COMFY,
                payload: {
                    id: viewComfyState.currentViewComfy.viewComfyJSON
                        .id,
                    viewComfy: {
                        viewComfyJSON: {
                            ...data,
                            id: viewComfyState.currentViewComfy
                                .viewComfyJSON.id,
                        },
                        file: viewComfyState.viewComfyDraft?.file,
                        workflowApiJSON:
                            viewComfyState.viewComfyDraft
                                ?.workflowApiJSON,
                    },
                },
            });
        } else {
            if (data.title === "") {
                data.title = `My Awesome Workflow ${viewComfyState.viewComfys.length + 1}`;
            }

            viewComfyStateDispatcher({
                type: ActionType.ADD_VIEW_COMFY,
                payload: { viewComfyJSON: { ...data, id: Math.random().toString(16).slice(2) }, file: viewComfyState.viewComfyDraft?.file, workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON }
            });
        }
    }

    const onSelectChange = (data: IViewComfy) => {
        return viewComfyStateDispatcher({
            type: ActionType.UPDATE_CURRENT_VIEW_COMFY,
            payload: { ...data }
        });
    }

    const addWorkflowOnClick = () => {
        return viewComfyStateDispatcher({
            type: ActionType.RESET_CURRENT_AND_DRAFT_VIEW_COMFY,
            payload: undefined
        });
    }

    return (
        <div className="flex flex-col h-screen">
            <Header title="Editor">
            </Header>
            <main className={`flex-1 overflow-hidden p-4 ${viewComfyState.viewComfyDraft?.workflowApiJSON || viewComfyState.viewComfyDraft?.viewComfyJSON ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                {showDropZone() && (
                    <div className="flex flex-col w-full h-full overflow-hidden">
                        <div className="w-full mt-10 sm:w-1/2 sm:h-1/2 mx-auto">
                            <Dropzone
                                onChange={setFile}
                                fileExtensions={[".json"]}
                                className="custom-dropzone w-full h-full"
                                inputPlaceholder={getDropZoneText()}
                            />
                        </div>
                    </div>
                )}

                {!showDropZone() && (
                    <>
                        {viewComfyState.viewComfyDraft?.viewComfyJSON && (
                            <div className="flex flex-col w-full h-full overflow-hidden">
                                <div className="relative flex flex-col items-start gap-4 h-full">
                                    <div className="flex gap-4">
                                        {(viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy) && (
                                            <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                                        )}
                                        {showDeleteWorkflowButton() && (
                                            <>
                                                <Button
                                                    variant="destructive"
                                                    className="mb-3"
                                                    onClick={deleteViewComfyJSON}
                                                >
                                                    Delete Workflow
                                                </Button>
                                                <Button onClick={addWorkflowOnClick}>
                                                    Add Workflow
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    <ViewComfyFormEditor onSubmit={getOnSubmit} viewComfyJSON={viewComfyState.viewComfyDraft?.viewComfyJSON} />
                                </div>
                            </div>
                        )}
                        {viewComfyState.viewComfyDraft?.workflowApiJSON && (
                            <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl gap-4">
                                {!viewComfyState.currentViewComfy && (
                                    <Button
                                        variant="secondary"
                                        className="border-2 border-dashed text-muted-foreground"
                                        onClick={removeFileOnClick}
                                    >
                                        <p className="text-muted-foreground mr-2">{getFileInfo()}</p>
                                        <Trash2 className="size-5" />
                                    </Button>
                                )}
                                <Label>Workflow API JSON</Label>
                                <ScrollArea className="w-full flex-1 rounded-md border">
                                    <JsonView src={viewComfyState.viewComfyDraft?.workflowApiJSON} collapsed={3} displaySize={3} editable={false} />
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}
                    </>
                )}
            </main>
            <ErrorAlertDialog
                open={errorDialog.open}
                errorDescription={getErrorText(errorDialog.error)}
                onClose={() => setErrorDialog({ open: false, error: undefined })} />
        </div>
    )
}

function getErrorText(error: Error | undefined) {
    if (!error) {
        return <> </>
    }
    if (error instanceof WorkflowJSONError) {
        return <>
            Looks like you have uploaded a workflow.json instead of workflow_api.json <br />
            To generate workflow_api.json, enable dev mode options in the ComfyUI settings and export using the “Save (API format)” button.
        </>
    }

    return <> An error occurred while parsing the JSON, most commons cuase is the json is not valid or is empty. <br /> <b> error details: </b> <br /> {error.message} </>

}
