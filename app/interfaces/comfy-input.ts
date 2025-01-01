import type { IInput } from "./input";

export interface IViewComfy {
    inputs: IInput[];
    textOutputEnabled?: boolean;
}

export interface IComfyInput {
    viewComfy: IViewComfy;
    workflow?: object;
}
