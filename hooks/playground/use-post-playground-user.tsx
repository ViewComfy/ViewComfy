import { ErrorTypes, ResponseError } from "@/app/models/errors";
import { useState, useCallback, useEffect } from "react";
import { IPlaygroundParams, IUsePostPlayground } from "@/hooks/playground/interfaces";
import { useSocket } from "@/app/providers/socket-provider";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@clerk/nextjs";
import { useWorkflowData } from "@/app/providers/workflows-data-provider";
import { IWorkflowHistoryModel } from "@/app/interfaces/workflow-history";

export const usePostPlaygroundUser = () => {
    const [loading, setLoading] = useState(false);
    const { socket, isConnected } = useSocket();
    const { runningWorkflows, addRunningWorkflow } = useWorkflowData();
    const { getToken } = useAuth();

    const doPost = useCallback(async ({ viewComfy, workflow, viewcomfyEndpoint, onSuccess, onError }: IUsePostPlayground) => {
        const params = { viewComfy, workflow, viewcomfyEndpoint, onSuccess, onError };
        setLoading(true);
        try {
            // clearCurrentLog();
            const data = await inferApiComfy({ ...params, socket, getToken });
            if (data) {
                addRunningWorkflow(data.workflow);
            }
        } catch (error) {
            onError(error);
        } finally {
            setLoading(false);
        }
    }, [socket, getToken]);

    useEffect(() => {
        if (runningWorkflows.length > 0 && isConnected) {
            const doSubscribe = async () => {
                await subscribeToRunningWorkflows({
                    socket,
                    getToken
                })
            };
            doSubscribe();
        }
    }, [runningWorkflows, isConnected]);

    return { doPost, loading, setLoading };
}

/**
 * Represents the output file data from a prompt execution
 */
export interface FilesData {
    filename: string;
    content_type: string;
    data: string;
    size: number;
}

/**
 * Represents the output file with a link to download the data from a prompt execution
 */
export class S3FilesData {
    filename: string;
    content_type: string;
    filepath: string;
    size: number;

    constructor(data: {
        filename: string;
        content_type: string;
        filepath: string;
        size: number;
    }) {
        this.filename = data.filename;
        this.content_type = data.content_type;
        this.filepath = data.filepath;
        this.size = data.size;
    }
}


/**
 * Creates a PromptResult object from the response
 *
 * @param data Raw prompt result data
 * @returns A properly formatted PromptResult with File objects
 */
export class PromptResult {
    /** Unique identifier for the prompt */
    prompt_id: string;

    /** Current status of the prompt execution */
    status: string;

    /** Whether the prompt execution is complete */
    completed: boolean;

    /** Time taken to execute the prompt in seconds */
    execution_time_seconds: number;

    /** The original prompt configuration */
    prompt: Record<string, any>;

    /** List of output files */
    outputs: (File | S3FilesData)[];

    constructor(data: {
        prompt_id: string;
        status: string;
        completed: boolean;
        execution_time_seconds: number;
        prompt: Record<string, any>;
        outputs?: FilesData[] | S3FilesData[];
    }) {
        const {
            prompt_id,
            status,
            completed,
            execution_time_seconds,
            prompt,
            outputs = [],
        } = data;

        // Convert output data to File objects
        const fileOutputs: (File | S3FilesData)[] = outputs.map((output: FilesData | S3FilesData) => {
            if (output instanceof S3FilesData) {
                return output;
            } else {
                const binaryData = atob(output.data);
                const arrayBuffer = new ArrayBuffer(binaryData.length);
                const uint8Array = new Uint8Array(arrayBuffer);

                for (let i = 0; i < binaryData.length; i++) {
                    uint8Array[i] = binaryData.charCodeAt(i);
                }

                const blob = new Blob([arrayBuffer], { type: output.content_type });

                // Create File object from Blob
                return new File([blob], output.filename, {
                    type: output.content_type,
                    lastModified: new Date().getTime(),
                });
            }
        });

        this.prompt_id = prompt_id;
        this.status = status;
        this.completed = completed;
        this.execution_time_seconds = execution_time_seconds;
        this.prompt = prompt;
        this.outputs = fileOutputs;
    }
}


function buildFormDataWS(data: {
    params: Array<{ [key: string]: any }>;
    override_workflow_api?: Record<string, any> | undefined;
    prompt_id: string;
    view_comfy_api_url: string;
    sid: string;
}): FormData {
    const { params, override_workflow_api, prompt_id, view_comfy_api_url, sid } = data;
    const formData = new FormData();
    let params_str: { [key: string]: any } = {};

    for (const { key, value } of params) {
        if (value instanceof File) {
            formData.set(key, value);
        } else {
            params_str[key] = value;
        }
    }

    formData.set("params", JSON.stringify(params_str));
    formData.set("prompt_id", prompt_id);
    formData.set("view_comfy_api_url", view_comfy_api_url);
    formData.set("sid", sid);

    if (override_workflow_api) {
        formData.set("workflow_api", JSON.stringify(override_workflow_api));
    }

    return formData;
}


const inferApiComfy = async (params: IPlaygroundParams & {
    onSuccess: (params: { promptId: string, outputs: File[] }) => void;
    socket: any;
    getToken: () => Promise<string | null>;
}) => {

    const { viewComfy, viewcomfyEndpoint, workflow, socket, getToken } = params;

    if (!viewcomfyEndpoint) {
        throw new Error("Missing ViewComfyEndpoint");
    };

    if (!socket) {
        throw new Error("Socket object is missing, probably not connected");
    };

    const token = await getToken();

    if (!token) {
        throw new Error("user token is missing");
    }

    const prompt_id: string = uuidv4();

    const url = `${process.env.NEXT_PUBLIC_API_URL}/workflow/infer`;
    const formData = buildFormDataWS({
        override_workflow_api: workflow,
        view_comfy_api_url: viewcomfyEndpoint,
        params: viewComfy.inputs,
        sid: socket.id!,
        prompt_id,
    });

    let response;

    try {
        response = await fetch(url, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
    } catch (error) {
        const args = {
            errorMsg: "Something went wrong",
            error: "Something when wrong calling our servers, please try again. if this error persist contact us: team@viewcomfy.com",
            errorType: ErrorTypes.UNKNOWN
        };
        throw new ResponseError(args)
    }

    if (!response.ok) {
        // const errMsg = `Failed to fetch viewComfy: ${response.statusText}, ${await response.text()}`;
        const responseError: ResponseError = await response.json();
        throw responseError;
    }

    const result = await response.json() as {
        data: {
            prompt_id: string,
            message: string,
            workflow: IWorkflowHistoryModel,
        }
    };
    if (result && result.data) {
        return {
            "promptId": result.data.prompt_id,
            "message": result.data.message,
            "workflow": result.data.workflow
        };
    }
};

const subscribeToRunningWorkflows = async (params: {
    socket: any;
    getToken: () => Promise<string | null>;
}) => {

    const { socket, getToken } = params;

    if (!socket) {
        throw new Error("Socket object is missing, probably not connected");
    };

    const token = await getToken();

    if (!token) {
        throw new Error("user token is missing");
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/workflow/infer/subscribe/${socket.id!}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
    });

    if (!response.ok) {
        const responseError: ResponseError = await response.json();
        throw responseError;
    }

    return await response.json();
};
