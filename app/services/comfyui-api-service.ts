import { ComfyWorkflowError } from '@/app/models/errors';
import { ComfyUIConnRefusedError } from '@/app/constants';
import mime from 'mime-types';

type ComfyUIWSEventType = "status" | "executing" | "execution_cached" | "progress" | "executed" | "execution_error" | "execution_success";

interface IComfyUIWSEventData {
    type: ComfyUIWSEventType;
    data: { [key: string]: unknown };
}

export interface IComfyUINodeError {
    type: string;
    message: string;
}

export interface IComfyUIError {
    message: string;
    node_errors: { [key: number]: IComfyUINodeError[] }
}

export class ComfyImageOutputFile {
    public fileName: string;
    public subFolder: string;
    public outputType: string;

    constructor({ fileName, subFolder, outputType }: { fileName: string, subFolder: string, outputType: string }) {
        this.fileName = fileName;
        this.subFolder = subFolder;
        this.outputType = outputType;
    }
}

export class ComfyUIAPIService {
    private baseUrl: string;
    private ws: WebSocket;
    private clientId: string;
    private promptId: string | undefined = undefined;
    private isPromptRunning: boolean;
    private workflowStatus: ComfyUIWSEventType | undefined;
    private secure: boolean;
    private httpBaseUrl: string;
    private wsBaseUrl: string;
    private outputFiles: Array<{ [key: string]: string }>;
     
    private comfyExecutionError: { [key: string]: any } | undefined;
    private workflowCompletionPromise: {
        resolve: (value: unknown) => void;
        reject: (reason?: unknown) => void;
    } | undefined;

    constructor(clientId: string) {
        this.secure = process.env.COMFYUI_SECURE === "true";
        this.httpBaseUrl = this.secure ? "https://" : "http://";
        this.wsBaseUrl = this.secure ? "wss://" : "ws://";
        this.baseUrl = process.env.COMFYUI_API_URL || "127.0.0.1:8188";
        this.clientId = clientId;
        this.comfyuiApiKey = process.env.COMFYUI_API_KEY;
        this.comfyExecutionError = undefined;
        try {
            this.ws = new WebSocket(`${this.getUrl("ws")}/ws?clientId=${this.clientId}`);
            this.connect();
        } catch (error) {
            console.error(error);
            throw error;
        }
        this.isPromptRunning = false;
        this.workflowStatus = undefined;
        this.outputFiles = [];
    }

    private getUrl(protocol: "http" | "ws") {
        if (protocol === "http") {
            return `${this.httpBaseUrl}${this.baseUrl}`;
        }
        return `${this.wsBaseUrl}${this.baseUrl}`;
    }

    private async connect() {
        try {
            this.ws.onopen = () => {
                console.log("WebSocket connection opened");
            };

            this.ws.onmessage = (event) => {
                // console.log("WebSocket message received:", event.data);
                this.comfyEventDataHandler(event.data);
            };
        } catch (error) {
            console.error(error);
            throw new Error("WebSocket connection error");
        }
    }

    private comfyEventDataHandler(eventData: string) {
        let event: IComfyUIWSEventData | undefined;
        try {
            event = JSON.parse(eventData) as IComfyUIWSEventData;
        } catch (error) {
            console.log("Error parsing event data:", eventData);
            console.error(error);
            return;
        }

        const data = event.data as object;
        // Skip any messages that aren't about our prompt
        if ("prompt_id" in data && data.prompt_id !== this.promptId) {
            return true;
        }

        switch (event.type) {
            case "status":
                // console.log("Status:", event.data);
                this.workflowStatus = event.type;
                break;
            case "executing":
                // console.log("Executing:", event.data);
                this.workflowStatus = event.type;
                break;
            case "execution_cached":
                // console.log("Execution cached:", event.data);
                this.workflowStatus = event.type;
                break;
            case "progress":
                // console.log("Progress:", event.data);
                this.workflowStatus = event.type;
                break;
            case "executed":
                console.log("Executed:", event.data);
                this.parseOutputFiles(event.data);
                this.workflowStatus = event.type;
                break;
            case "execution_error":
                // data error shape
                // data = {
                //     exception_message: "",
                //     exception_type: "",
                //     node_type: "",
                //     prompt_id: ""
                // }
                // console.log("Execution error:", event.data);
                this.isPromptRunning = false;
                this.workflowStatus = event.type;
                this.comfyExecutionError = event.data;
                if (this.workflowCompletionPromise) {
                    this.workflowCompletionPromise.resolve(true);
                    this.workflowCompletionPromise = undefined;
                }
                break;
            case "execution_success":
                // console.log("Execution success:", event.data);
                this.isPromptRunning = false;
                this.workflowStatus = event.type;
                if (this.workflowCompletionPromise) {
                    this.workflowCompletionPromise.resolve(true);
                    this.workflowCompletionPromise = undefined;
                }
                break;
            default:
                // console.log("Unknown event type:", event.type);
                this.workflowStatus = event.type;
                break;
        }
    }

    public async queuePrompt(workflow: object) {
        const data = {
            "prompt": workflow,
            "client_id": this.clientId,
        }
        if (this.comfyuiApiKey) {
            data["extra_data"] = {
                "api_key_comfy_org": this.comfyuiApiKey,
            };
        }
        try {
            const response = await fetch(`${this.getUrl("http")}/prompt`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {

                let resError: IComfyUIError | string;
                try {
                    const responseError = await response.json();
                    if (responseError.error?.message) {
                        resError = {
                            message: responseError.error.message,
                            node_errors: responseError.node_errors || [],
                        }
                    } else {
                        resError = responseError;
                    }
                } catch (error) {
                    console.error("cannot parse response", error);
                    throw error;
                }
                console.error(resError);
                throw resError;

            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const responseData = await response.json();

            if (responseData.hasOwnProperty("node_errors") && Object.keys(responseData.node_errors).length > 0) {
                const resError: IComfyUIError = {
                    message: "Something went wrong executing your workflow",
                    node_errors: responseData.node_errors,
                }
                throw resError;
            }


            this.promptId = responseData.prompt_id;

            if (this.promptId === undefined) {
                throw new Error("Prompt ID is undefined");
            }

            this.isPromptRunning = true;
            this.comfyExecutionError = undefined; // Reset error before new prompt
            this.workflowStatus = undefined;     // Reset status before new prompt

            // Create a new promise and store its resolve/reject methods
            const completionPromise = new Promise((resolve, reject) => {
                this.workflowCompletionPromise = { resolve, reject };
            });

            await completionPromise; // Wait for the workflow to complete

            if (this.workflowStatus === "execution_error") {
                const errorMessage =
                    (this.comfyExecutionError && "exception_message" in this.comfyExecutionError)
                        ? (this.comfyExecutionError as { exception_message?: string }).exception_message
                        : undefined;
                const nodeType =
                    (this.comfyExecutionError && "node_type" in this.comfyExecutionError)
                        ? (this.comfyExecutionError as { node_type?: string }).node_type
                        : undefined;

                let errorMsg =
                    errorMessage ||
                    "Something went wrong while your workflow was executing";
                
                if (nodeType) {
                    errorMsg = `${nodeType}: ${errorMsg}`;
                }

                throw new ComfyWorkflowError({
                    message: "ComfyUI workflow execution error",
                    errors: [errorMsg]
                });
            }
            return { outputFiles: this.outputFiles, promptId: this.promptId };

             
        } catch (error: any) {
            console.error(error);
            if (error?.cause?.code === "ECONNREFUSED") {
                throw new ComfyWorkflowError({
                    message: "Cannot connect to ComfyUI",
                    errors: [ComfyUIConnRefusedError(this.getUrl("http"))]
                });
            }
            throw error;
        }
    }

    public async getOutputFiles({ file }: { file: { [key: string]: string } }) {

        const data = new URLSearchParams({ ...file }).toString();

        try {
            const response = await fetch(`${this.getUrl("http")}/view?${encodeURI(data)}`);
            if (!response.ok) {
                if (response.status === 404) {
                    const fileName = file.filename || "";
                    throw new ComfyWorkflowError({
                        message: "File not found",
                        errors: [`The file ${fileName} was not found in the ComfyUI output directory`]
                    });
                }
                const responseError = await response.json();
                throw responseError;
            }

            const blob = await response.blob();
            return new File([blob], file.filename, { type: mime.lookup(file.filename) || "application/octet-stream" });

             
        } catch (error: any) {
            console.error(error);
            if (error?.cause?.code === "ECONNREFUSED") {
                throw new ComfyWorkflowError({
                    message: "Cannot connect to ComfyUI",
                    errors: [ComfyUIConnRefusedError(this.getUrl("http"))]
                });
            }
            throw error;
        }
    }

    private parseOutputFiles(data: { [key: string]: unknown }) {
        if (!data.output) {
            return
        }

        const output = data.output as { [key: string]: unknown } | undefined;
        for (const key in output) {
             
            for (const dict of output[key] as any[]) {
                if (dict.type !== "temp") {
                    this.outputFiles.push(dict)
                }
            }
        }
    }

    public async uploadMask(params: {
        maskFile: File,
        maskFileName: string,
        originalFileRef: string,
    }) {
        const { maskFile, maskFileName, originalFileRef } = params;
        const formData = new FormData()
        formData.append('image', maskFile, maskFileName)
        formData.append(
            'original_ref',
            JSON.stringify({
                "filename": originalFileRef,
                "subfolder": "clipspace",
                "type": "input",
            })
        )
        formData.append('type', 'input')
        formData.append('subfolder', 'clipspace')
        const response = await fetch(`${this.getUrl("http")}/upload/mask`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {

            let resError: IComfyUIError | string;
            try {
                const responseError = await response.json();
                if (responseError.error?.message) {
                    resError = {
                        message: responseError.error.message,
                        node_errors: responseError.node_errors || [],
                    }
                } else {
                    resError = responseError;
                }
            } catch (error) {
                console.error("cannot parse response", error);
                throw error;
            }
            console.error(resError);
            throw resError;

        }

        if (!response.body) {
            throw new Error("No response body");
        }

        return await response.json();

    }

    public async uploadImage(params: {
        imageFile: File,
        imageFileName: string,
        originalFileRef: string,
    }) {
        const { imageFile, imageFileName, originalFileRef } = params;
        const formData = new FormData()
        formData.append('image', imageFile, imageFileName)
        formData.append(
            'original_ref',
            JSON.stringify({
                "filename": originalFileRef,
                "subfolder": "",
                "type": "input",
            })
        )
        formData.append('type', 'input')
        formData.append('subfolder', 'clipspace')
        const response = await fetch(`${this.getUrl("http")}/upload/image`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {

            let resError: IComfyUIError | string;
            try {
                const responseError = await response.json();
                if (responseError.error?.message) {
                    resError = {
                        message: responseError.error.message,
                        node_errors: responseError.node_errors || [],
                    }
                } else {
                    resError = responseError;
                }
            } catch (error) {
                console.error("cannot parse response", error);
                throw error;
            }
            console.error(resError);
            throw resError;

        }

        if (!response.body) {
            throw new Error("No response body");
        }

        return await response.json();

    }

}
