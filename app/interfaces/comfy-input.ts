import type { IInput } from "./input";

export interface IComfyInput {
    viewComfyInputs: IInput[];
    workflow?: object;
    viewComfyJSON: {
        textOutputEnabled?: boolean;
        [key: string]: any;
    };
}
