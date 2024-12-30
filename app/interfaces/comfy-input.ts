import type { IInput } from "./input";

export interface IComfyInput {
    viewComfy: { inputs: IInput[], textOutputEnabled: boolean };
    workflow?: object;
}
