import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import ViewComfyFormEditor from '@/components/pages/view-comfy/view-comfy-form-editor';
import { workflowAPItoViewComfy } from '@/lib/workflow-api-parser';
import { useState, useEffect, useRef } from 'react';
import { ActionType, type IViewComfy, type IViewComfyBase, type IViewComfyJSON, useViewComfy } from '@/app/providers/view-comfy-provider';
import { Label } from '@/components/ui/label';
import { ErrorAlertDialog } from '@/components/ui/error-alert-dialog';
import WorkflowSwitcher from '@/components/workflow-switchter';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { saveWorkflowsToLocalStorage, loadWorkflowsFromLocalStorage, clearWorkflowsFromLocalStorage } from '@/lib/utils';

class WorkflowJSONError extends Error {
    constructor() {
        super("Workflow.json file is not supported, please use workflow_api.json");
    }
}



export default function ViewComfyPage() {

    const [file, setFile] = useState<File | null>(null);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [errorDialog, setErrorDialog] = useState<{ open: boolean, error: Error | undefined }>({ open: false, error: undefined });
    const [appTitle, setAppTitle] = useState<string>(viewComfyState.appTitle || "");
    const [appImg, setAppImg] = useState<string>(viewComfyState.appImg || "");
    const [appImgError, setAppImgError] = useState<string | undefined>(undefined);
    const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
    const hasLoadedFromStorage = useRef(false);

    const handleOnBlur = (inputBlur: "appTitle" | "appImg") => {
        if (inputBlur === "appTitle") {
            viewComfyStateDispatcher({ type: ActionType.SET_APP_TITLE, payload: appTitle });
            // Save is handled by the useEffect watching viewComfyState
        } else if (inputBlur === "appImg") {
            setAppImgError(undefined);
            if (!appImg) {
                viewComfyStateDispatcher({ type: ActionType.SET_APP_IMG, payload: "" });
            } else {
                try {
                    new URL(appImg);
                    viewComfyStateDispatcher({ type: ActionType.SET_APP_IMG, payload: appImg });
                } catch (error) {
                    console.error('Error parsing image URL:', error);
                    setAppImgError("Invalid image URL");
                }
            }
            // Save is handled by the useEffect watching viewComfyState
        }
    }

    useEffect(() => {
        setAppTitle(viewComfyState.appTitle || "");
    }, [viewComfyState.appTitle]);

    useEffect(() => {
        setAppImg(viewComfyState.appImg || "");
    }, [viewComfyState.appImg]);

    // Load workflows from localStorage on component mount
    useEffect(() => {
        if (hasLoadedFromStorage.current) {
            return;
        }

        // Only load if there are no workflows currently loaded
        if (viewComfyState.viewComfys.length === 0 && !viewComfyState.viewComfyDraft) {
            const savedWorkflows = loadWorkflowsFromLocalStorage();
            if (savedWorkflows) {
                try {
                    viewComfyStateDispatcher({
                        type: ActionType.INIT_VIEW_COMFY,
                        payload: savedWorkflows
                    });
                } catch (error) {
                    console.error('Error loading workflows from localStorage:', error);
                }
            }
        }
        // Mark as loaded after initial check, allowing future saves
        hasLoadedFromStorage.current = true;
    }, [viewComfyState.viewComfys.length, viewComfyState.viewComfyDraft, viewComfyStateDispatcher]);

    // Save workflows to localStorage whenever state changes
    useEffect(() => {
        // Skip saving on initial load to avoid overwriting with empty state
        if (!hasLoadedFromStorage.current) {
            return;
        }
        saveWorkflowsToLocalStorage(viewComfyState);
    }, [viewComfyState]);

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
            // Save is handled by the useEffect watching viewComfyState
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
            // Save is handled by the useEffect watching viewComfyState
        } else {
            if (data.title === "") {
                data.title = `My Awesome Workflow ${viewComfyState.viewComfys.length + 1}`;
            }

            viewComfyStateDispatcher({
                type: ActionType.ADD_VIEW_COMFY,
                payload: { viewComfyJSON: { ...data, id: Math.random().toString(16).slice(2) }, file: viewComfyState.viewComfyDraft?.file, workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON }
            });
            // Save is handled by the useEffect watching viewComfyState
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

    const handleClearCache = () => {
        clearWorkflowsFromLocalStorage();
        // Create a copy of workflows array to avoid mutation during iteration
        const workflowsToRemove = [...viewComfyState.viewComfys];
        // Remove all workflows from state
        workflowsToRemove.forEach((workflow) => {
            viewComfyStateDispatcher({
                type: ActionType.REMOVE_VIEW_COMFY,
                payload: workflow,
            });
        });
        // Reset current and draft workflows
        viewComfyStateDispatcher({
            type: ActionType.RESET_CURRENT_AND_DRAFT_VIEW_COMFY,
            payload: undefined
        });
        // Reset app title and image
        viewComfyStateDispatcher({ type: ActionType.SET_APP_TITLE, payload: "" });
        viewComfyStateDispatcher({ type: ActionType.SET_APP_IMG, payload: "" });
        setClearCacheDialogOpen(false);
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Header title="Editor">
            </Header>
            <main className="flex-1 overflow-hidden p-2 pb-12">
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
                                {(viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy) && (
                                    <div className="w-full flex flex-wrap items-center gap-4 mb-4 pl-1">
                                        <div className="w-1/2 flex">
                                            <div className="w-full flex gap-4">
                                                <div className="grid w-1/2 items-center gap-1.5">
                                                    <Label htmlFor="appTitle">App Title</Label>
                                                    <Input id="appTitle" placeholder="ViewComfy" value={appTitle} onBlur={() => handleOnBlur("appTitle")} onChange={(e) => setAppTitle(e.target.value)} />
                                                </div>

                                                <div className="grid w-full items-center gap-1.5 pr-4">
                                                    <Label htmlFor="appImg">App Image URL</Label>
                                                    <Input id="appImg" placeholder="https://example.com/image.png" value={appImg} onBlur={() => handleOnBlur("appImg")} onChange={(e) => setAppImg(e.target.value)} />
                                                </div>
                                            </div>
                                            {appImgError && (
                                                <p className="text-sm font-medium text-red-500 mt-1">
                                                    {appImgError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full flex flex-wrap items-center gap-4 mb-4 ml-1">
                                    {(viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy) && (
                                        <div className="flex">
                                            <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                                        </div>
                                    )}
                                    {showDeleteWorkflowButton() && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="destructive"
                                                onClick={deleteViewComfyJSON}
                                            >
                                                Delete Workflow
                                            </Button>
                                            <Button onClick={addWorkflowOnClick}>
                                                Add Workflow
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setClearCacheDialogOpen(true)}
                                            >
                                                Clear Cache
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ViewComfyFormEditor onSubmit={getOnSubmit} viewComfyJSON={viewComfyState.viewComfyDraft?.viewComfyJSON} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
            <ErrorAlertDialog
                open={errorDialog.open}
                errorDescription={getErrorText(errorDialog.error)}
                onClose={() => setErrorDialog({ open: false, error: undefined })} />
            <AlertDialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Cache</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear all cached workflows? This will remove all saved workflows from localStorage and reset the editor. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCache} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Clear Cache
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
