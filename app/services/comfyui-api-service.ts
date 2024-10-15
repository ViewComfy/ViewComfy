import { ComfyWorkflowError } from '@/app/models/errors';
import { ComfyUIConnRefusedError } from '@/app/constants';

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
    private port: string;
    private ws: WebSocket;
    private clientId: string;
    private promptId: string | undefined = undefined;
    private isPromptRunning: boolean;
    private workflowStatus: ComfyUIWSEventType | undefined;
    private secure: boolean;
    private httpBaseUrl: string;
    private wsBaseUrl: string;
    private outputFiles: Array<{ [key: string]: string }>;

    constructor(clientId: string) {
        this.secure = process.env.COMFYUI_SECURE === "true";
        this.httpBaseUrl = this.secure ? "https://" : "http://";
        this.wsBaseUrl = this.secure ? "wss://" : "ws://";
        this.baseUrl = process.env.COMFYUI_BASE_URL || "127.0.0.1";
        this.port = process.env.COMFYUI_PORT || "8188";
        this.clientId = clientId;
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
            return `${this.httpBaseUrl}${this.baseUrl}:${this.port}`;
        }
        return `${this.wsBaseUrl}${this.baseUrl}:${this.port}`;
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
        const event = JSON.parse(eventData) as IComfyUIWSEventData;

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
                // console.log("Execution error:", event.data);
                this.isPromptRunning = false;
                this.workflowStatus = event.type;
                break;
            case "execution_success":
                // console.log("Execution success:", event.data);
                this.isPromptRunning = false;
                this.workflowStatus = event.type;
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
                    resError = await response.text();
                }
                console.error(resError);
                throw resError;

            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const responseData = await response.json();
            this.promptId = responseData.prompt_id;

            if (this.promptId === undefined) {
                throw new Error("Prompt ID is undefined");
            }

            this.isPromptRunning = true;

            while (this.isPromptRunning) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (this.workflowStatus === "execution_error") {
                throw new ComfyWorkflowError({
                    message: "ComfyUI workflow execution error",
                    errors: []
                });
            }
            return { outputFiles: this.outputFiles, promptId: this.promptId };

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

            return await response.blob();

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            for (const value of output[key] as any[]) {
                this.outputFiles.push(value)
            }
        }

    }
}
