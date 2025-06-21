import { IViewComfy } from "@/app/interfaces/comfy-input";

export interface IPlaygroundParams {
    viewComfy: IViewComfy,
    workflow?: object,
    viewcomfyEndpoint?: string | null,
}

export interface IUsePostPlayground extends IPlaygroundParams {
    onSuccess: (outputs: Blob[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => void,
}
