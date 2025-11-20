import { IViewComfy } from "@/app/interfaces/comfy-input";

export interface IPlaygroundParams {
    viewComfy: IViewComfy,
    workflow?: object,
    viewcomfyEndpoint?: string | null,
}

export interface IUsePostPlayground extends IPlaygroundParams {
    onSuccess: (params: { promptId: string, outputs: File[] }) => void,
     
    onError: (error: any) => void,
}
