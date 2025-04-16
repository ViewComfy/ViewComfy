import { IViewComfy } from "../interfaces/comfy-input";

export class ViewComfyApiParamBuilder {
    private formData: FormData;
    private _overrideWorkflowApi: Record<string, unknown> | undefined;
    private _viewComfy: IViewComfy | undefined;
    private _params: Record<string, unknown> = {};
    private _viewComfyUrl: string | undefined;

    constructor(formData: FormData) {
        this.formData = formData;
        this._viewComfy = {
            inputs: [],
            textOutputEnabled: false
        };
    }

    public buildParamsForViewComfyApi(): void {

        if (this.formData.get('workflow') && this.formData.get('workflow') !== 'undefined') {
            this._overrideWorkflowApi = JSON.parse(this.formData.get('workflow') as string);
        }

        if (this.formData.get('viewComfy') && this.formData.get('viewComfy') !== 'undefined') {
            this._viewComfy = JSON.parse(this.formData.get('viewComfy') as string);
        }

        if (!this._viewComfy) {
            throw new Error('viewComfy is required');
        }

        for (const [key, value] of Array.from(this.formData.entries())) {
            if (key !== 'workflow') {
                if (value instanceof File) {
                    this._params[key] = value;
                } else if (key === "viewComfy") {
                    for (const input of this._viewComfy.inputs) {
                        this._params[input.key] = input.value;
                    }
                }
            }
        }

        this._viewComfyUrl = this.formData.get('viewcomfyEndpoint') as string;

        if (!this._viewComfyUrl) {
            throw new Error('viewcomfyEndpoint is required');
        }
    }

    public get overrideWorkflowApi() {
        return this._overrideWorkflowApi;
    }

    public get viewComfyUrl() {
        if (!this._viewComfyUrl) {
            throw new Error('viewcomfyEndpoint is required');
        }
        return this._viewComfyUrl;
    }

    public get params() {
        return this._params;
    }

    public get viewComfy() {
        return this._viewComfy;
    }
}
