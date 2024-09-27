import { IInputField, IMultiValueInput } from '@/lib/workflow-api-parser';
import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useState } from 'react';

export interface IViewComfyJSON {
    file_type?: string;
    file_version?: string;
    version?: string;
    title: string;
    description: string;
    inputs: IInputField[];
    advancedInputs: IMultiValueInput[];
}

export interface IViewComfyState {
    viewComfyJSON: IViewComfyJSON | undefined;
    workflowApiJSON?: object | undefined;
    file?: File | undefined;
}

// Define action types as an enum
export enum ActionType {
    SET_JSON = 'SET_JSON',
    SET_VIEW_COMFY_JSON = 'SET_VIEW_COMFY_JSON',
    ADD_INPUT = 'ADD_INPUT',
    UPDATE_INPUT = 'UPDATE_INPUT',
    REMOVE_INPUT = 'REMOVE_INPUT',
    ADD_ADVANCED_INPUT = 'ADD_ADVANCED_INPUT',
    UPDATE_ADVANCED_INPUT = 'UPDATE_ADVANCED_INPUT',
    REMOVE_ADVANCED_INPUT = 'REMOVE_ADVANCED_INPUT',
    UPDATE_ADVANCED_INPUT_NODE = 'UPDATE_ADVANCED_INPUT_NODE'
}

// Update the Action type to use the enum
export type Action =
    | { type: ActionType.SET_JSON; payload: IViewComfyState | undefined }
    | { type: ActionType.SET_VIEW_COMFY_JSON; payload: IViewComfyJSON | undefined }
    | { type: ActionType.ADD_INPUT; payload: IInputField }
    | { type: ActionType.UPDATE_INPUT; payload: { index: number; input: IInputField } }
    | { type: ActionType.REMOVE_INPUT; payload: number }
    | { type: ActionType.ADD_ADVANCED_INPUT; payload: IMultiValueInput }
    | { type: ActionType.UPDATE_ADVANCED_INPUT; payload: { index: number; input: IMultiValueInput } }
    | { type: ActionType.REMOVE_ADVANCED_INPUT; payload: number }
    | { type: ActionType.UPDATE_ADVANCED_INPUT_NODE; payload: { advancedIndex: number; inputIndex: number; input: IInputField } };

// Update the reducer function to use the enum
function viewComfyReducer(state: IViewComfyState | undefined, action: Action): IViewComfyState | undefined {
    switch (action.type) {
        case ActionType.SET_JSON:
            if (state?.viewComfyJSON && state?.viewComfyJSON.file_type) {
                return {
                    ...state,
                    workflowApiJSON: action.payload?.workflowApiJSON,
                    file: action.payload?.file
                }
            } else {
                return action.payload;
            }

        case ActionType.SET_VIEW_COMFY_JSON:
            return {
                ...state,
                viewComfyJSON: action.payload,
            }
        case ActionType.ADD_INPUT:
            return state && state.viewComfyJSON ? { ...state, viewComfyJSON: { ...state.viewComfyJSON, inputs: [...state.viewComfyJSON.inputs, action.payload] } } : undefined;
        case ActionType.UPDATE_INPUT:
            if (!state || !state.viewComfyJSON) return undefined;
            return {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    inputs: state.viewComfyJSON.inputs.map((input, index) =>
                        index === action.payload.index ? action.payload.input : input
                    )
                }
            };
        case ActionType.REMOVE_INPUT:
            return state && state.viewComfyJSON ? {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    inputs: state.viewComfyJSON.inputs.filter((_, index) => index !== action.payload)
                }
            } : undefined;
        case ActionType.ADD_ADVANCED_INPUT:
            return state && state.viewComfyJSON ? {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    advancedInputs: [...state.viewComfyJSON.advancedInputs, action.payload]
                }
            } : undefined;
        case ActionType.UPDATE_ADVANCED_INPUT:
            return state && state.viewComfyJSON ? {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    advancedInputs: state.viewComfyJSON.advancedInputs.map((input, index) =>
                        index === action.payload.index ? action.payload.input : input
                    )
                }
            } : undefined;
        case ActionType.REMOVE_ADVANCED_INPUT:
            return state && state.viewComfyJSON ? {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    advancedInputs: state.viewComfyJSON.advancedInputs.filter((_, index) => index !== action.payload)
                }
            } : undefined;
        case ActionType.UPDATE_ADVANCED_INPUT_NODE:
            if (!state || !state.viewComfyJSON) return undefined;
            return {
                ...state,
                viewComfyJSON: {
                    ...state.viewComfyJSON,
                    advancedInputs: state.viewComfyJSON.advancedInputs.map((input, advancedIndex) =>
                        advancedIndex === action.payload.advancedIndex
                            ? {
                                ...input,
                                inputs: input.inputs.map((subInput, inputIndex) =>
                                    inputIndex === action.payload.inputIndex ? action.payload.input : subInput
                                )
                            }
                            : input
                    )
                }
            };
        default:
            return state;
    }
}

interface ViewComfyContextType {
    viewComfyState: IViewComfyState | undefined;
    viewComfyStateDispatcher: Dispatch<Action>;
}

const ViewComfyContext = createContext<ViewComfyContextType | undefined>(undefined);

export function ViewComfyProvider({ children }: { children: ReactNode }) {
    const [viewComfyState, dispatch] = useReducer(viewComfyReducer, undefined);

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