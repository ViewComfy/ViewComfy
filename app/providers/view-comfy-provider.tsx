import type { IMultiValueInput } from '@/lib/workflow-api-parser';
import React, { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';

export interface IViewComfyBase {
    title: string;
    description: string;
    textOutputEnabled?: boolean;
    viewcomfyEndpoint?: string;
    previewImages: string[];
    inputs: IMultiValueInput[];
    advancedInputs: IMultiValueInput[];
}

export interface IViewComfyDraft {
    viewComfyJSON: IViewComfyBase;
    workflowApiJSON?: object | undefined;
    file?: File | undefined;
}

export interface IViewComfyWorkflow extends IViewComfyBase {
    id: string;
}

export interface IViewComfyJSON {
    appTitle?: string;
    appImg?: string;
    file_type?: string;
    file_version?: string;
    version?: string;
    workflows: IViewComfy[];
}

export interface IViewComfy {
    viewComfyJSON: IViewComfyWorkflow;
    workflowApiJSON?: object | undefined;
    file?: File | undefined;
}

export interface IViewComfyState {
    appTitle?: string;
    appImg?: string;
    viewComfys: IViewComfy[];
    viewComfyDraft: IViewComfyDraft | undefined;
    currentViewComfy: IViewComfy | undefined;
}

// Define action types as an enum
export enum ActionType {
    ADD_VIEW_COMFY = "ADD_VIEW_COMFY",
    UPDATE_VIEW_COMFY = "UPDATE_VIEW_COMFY",
    REMOVE_VIEW_COMFY = "REMOVE_VIEW_COMFY",
    SET_VIEW_COMFY_DRAFT = "SET_VIEW_COMFY_DRAFT",
    UPDATE_CURRENT_VIEW_COMFY = "UPDATE_CURRENT_VIEW_COMFY",
    RESET_CURRENT_AND_DRAFT_VIEW_COMFY = "RESET_CURRENT_AND_DRAFT_VIEW_COMFY",
    INIT_VIEW_COMFY = "INIT_VIEW_COMFY",
    SET_APP_TITLE = "SET_APP_TITLE",
    SET_APP_IMG = "SET_APP_IMG"
}

// Update the Action type to use the enum
export type Action =
    | { type: ActionType.ADD_VIEW_COMFY; payload: IViewComfy }
    | { type: ActionType.SET_VIEW_COMFY_DRAFT; payload: IViewComfyDraft | undefined }
    | { type: ActionType.UPDATE_VIEW_COMFY; payload: { viewComfy: IViewComfy, id: string } }
    | { type: ActionType.REMOVE_VIEW_COMFY; payload: IViewComfy }
    | { type: ActionType.UPDATE_CURRENT_VIEW_COMFY; payload: IViewComfy }
    | { type: ActionType.RESET_CURRENT_AND_DRAFT_VIEW_COMFY; payload: undefined }
    | { type: ActionType.INIT_VIEW_COMFY; payload: IViewComfyJSON }
    | { type: ActionType.SET_APP_TITLE; payload: string }
    | { type: ActionType.SET_APP_IMG; payload: string }

function viewComfyReducer(state: IViewComfyState, action: Action): IViewComfyState {
    console.log({ action });
    switch (action.type) {
        case ActionType.ADD_VIEW_COMFY: {
            const data = {
                ...state,
                viewComfys: [...state.viewComfys, { ...action.payload }],
                currentViewComfy: {
                    viewComfyJSON: action.payload.viewComfyJSON,
                    workflowApiJSON: action.payload.workflowApiJSON,
                    file: action.payload.file
                },
                viewComfyDraft: {
                    viewComfyJSON: action.payload.viewComfyJSON,
                    workflowApiJSON: action.payload.workflowApiJSON,
                    file: action.payload.file
                }
            };

            return data;
        }
        case ActionType.SET_VIEW_COMFY_DRAFT:

            if (action.payload) {
                action.payload.viewComfyJSON.viewcomfyEndpoint = ""
            }
            return {
                ...state,
                viewComfyDraft: action.payload ? { ...action.payload } : undefined
            };
        case ActionType.UPDATE_VIEW_COMFY:
            return {
                ...state,
                viewComfys: state.viewComfys.map((item) =>
                    item.viewComfyJSON.id === action.payload.id
                        ? { ...action.payload.viewComfy }
                        : item
                ),
                currentViewComfy: {
                    viewComfyJSON: action.payload.viewComfy.viewComfyJSON,
                    workflowApiJSON: action.payload.viewComfy.workflowApiJSON,
                    file: action.payload.viewComfy.file
                },
                viewComfyDraft: {
                    viewComfyJSON: action.payload.viewComfy.viewComfyJSON,
                    workflowApiJSON: action.payload.viewComfy.workflowApiJSON,
                    file: action.payload.viewComfy.file
                }
            };
        case ActionType.REMOVE_VIEW_COMFY: {
            const data = {
                ...state,
                viewComfys: state.viewComfys.filter((item) => item.viewComfyJSON.id !== action.payload.viewComfyJSON.id)
            };

            if (data.viewComfys.length > 0) {
                data.currentViewComfy = data.viewComfys[0];
                data.viewComfyDraft = {
                    viewComfyJSON: data.viewComfys[0].viewComfyJSON,
                    workflowApiJSON: data.viewComfys[0].workflowApiJSON,
                    file: data.viewComfys[0].file
                };
            } else {
                data.currentViewComfy = undefined;
                data.viewComfyDraft = undefined;
            }

            return data;
        }
        case ActionType.UPDATE_CURRENT_VIEW_COMFY:
            return {
                ...state,
                currentViewComfy: action.payload,
                viewComfyDraft: action.payload
            }
        case ActionType.RESET_CURRENT_AND_DRAFT_VIEW_COMFY:
            return {
                ...state,
                currentViewComfy: undefined,
                viewComfyDraft: undefined
            }
        case ActionType.INIT_VIEW_COMFY: {
            if (action.payload.workflows.length === 0) {
                return state;
            }
            return {
                appTitle: action.payload.appTitle ?? "ViewComfy",
                appImg: action.payload.appImg ?? "",
                viewComfys: [...action.payload.workflows.map((workflow) => ({
                    viewComfyJSON: workflow.viewComfyJSON,
                    workflowApiJSON: workflow.workflowApiJSON,
                }))],
                currentViewComfy: { viewComfyJSON: action.payload.workflows[0].viewComfyJSON, workflowApiJSON: action.payload.workflows[0].workflowApiJSON },
                viewComfyDraft: { viewComfyJSON: action.payload.workflows[0].viewComfyJSON, workflowApiJSON: action.payload.workflows[0].workflowApiJSON },
            };
        }
        case ActionType.SET_APP_TITLE:
            return {
                ...state,
                appTitle: action.payload || "ViewComfy"
            };
        case ActionType.SET_APP_IMG:
            return {
                ...state,
                appImg: action.payload
            };
        default:
            return state;
    }
}

interface ViewComfyContextType {
    viewComfyState: IViewComfyState;
    viewComfyStateDispatcher: Dispatch<Action>;
}

const ViewComfyContext = createContext<ViewComfyContextType | undefined>(undefined);

export function ViewComfyProvider({ children }: { children: ReactNode }) {
    const [viewComfyState, dispatch] = useReducer(viewComfyReducer, { viewComfys: [], viewComfyDraft: undefined, currentViewComfy: undefined });

    return (
        <ViewComfyContext.Provider value={{ viewComfyState, viewComfyStateDispatcher: dispatch }}>
            {children}
        </ViewComfyContext.Provider>
    );
}

export function useViewComfy() {
    const context = useContext(ViewComfyContext);
    if (context === undefined) {
        throw new Error('useViewComfy must be used within a ViewComfyProvider');
    }
    return context;
}
