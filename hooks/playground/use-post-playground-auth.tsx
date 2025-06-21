import { IViewComfy } from "@/app/interfaces/comfy-input";
import { ErrorTypes, ResponseError } from "@/app/models/errors";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { IUsePostPlayground, IPlaygroundParams } from "@/hooks/playground/interfaces";

export const usePostPlaygroundAuth = () => {
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const doPost = useCallback(async ({ viewComfy, workflow, viewcomfyEndpoint, onSuccess, onError }: IUsePostPlayground) => {
        setLoading(true);
        try {
            let token: string | null = null;
            try {

                token = await getToken({ template: "long_token" });

            } catch (error) {
                console.error("Error getting token", error);
                throw error;
            }

            if (!token) {
                throw new Error("token is not set");
            }
            await inferViewComfyCloud({ viewComfy, workflow, viewcomfyEndpoint, onSuccess, token });

        } catch (error) {
            onError(error);
        }
        setLoading(false);
    }, []);

    return { doPost, loading };
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function findSubarray(arr: Uint8Array, separator: Uint8Array): number {
    outer: for (let i = 0; i <= arr.length - separator.length; i++) {
        for (let j = 0; j < separator.length; j++) {
            if (arr[i + j] !== separator[j]) {
                continue outer;
            }
        }
        return i;
    }
    return -1;
}


function buildFormData(data: {
    logs: boolean;
    params: Record<string, any>;
    override_workflow_api?: Record<string, any> | undefined;
}): FormData {
    const { params, override_workflow_api, logs } = data;
    const formData = new FormData();
    let params_str: Record<string, any> = {};
    for (const key in params) {
        const value = params[key];
        if (value instanceof File) {
            formData.set(key, value);
        } else {
            params_str[key] = value;
        }
    }

    if (override_workflow_api) {
        formData.set("workflow_api", JSON.stringify(override_workflow_api));
    }

    formData.set("params", JSON.stringify(params_str));

    formData.set("logs", logs.toString());

    return formData;
}

const inferViewComfyCloud = async (params: IPlaygroundParams & { onSuccess: (outputs: Blob[]) => void, token: string }) => {
    const { viewComfy, viewcomfyEndpoint, onSuccess, token } = params;

    if (!viewcomfyEndpoint) {
        throw new Error("viewcomfyEndpoint is not set");
    }

    const viewComfyParams: Record<string, any> = {};

    for (const { key, value } of viewComfy.inputs) {
        if (value instanceof File) {
            viewComfyParams[key] = value;
        } else {
            viewComfyParams[key] = value;
        }
    }

    const result = await infer({
        apiUrl: viewcomfyEndpoint,
        params: viewComfyParams,
        secret: new Secret({ token }),
    });

    if (result.outputs.length > 0) {
        onSuccess(result.outputs);
    } else {
        onSuccess([]);
    }

}

const inferLocalComfyUI = async (params: IPlaygroundParams & { onSuccess: (outputs: Blob[]) => void }) => {

    const searchParams = useSearchParams();
    const appId = searchParams?.get("appId");

    const { viewComfy, workflow, viewcomfyEndpoint, onSuccess } = params;

    const url = viewcomfyEndpoint ? "/api/viewcomfy" : "/api/comfy";

    const formData = new FormData();

    const viewComfyJSON: IViewComfy = {
        inputs: [],
        textOutputEnabled: viewComfy.textOutputEnabled ?? false
    };
    for (const { key, value } of viewComfy.inputs) {
        if (value instanceof File) {
            formData.append(key, value);
        } else {
            viewComfyJSON.inputs.push({ key, value });
        }
    }

    formData.append('workflow', JSON.stringify(workflow));
    formData.append('viewComfy', JSON.stringify(viewComfyJSON));
    formData.append('viewcomfyEndpoint', viewcomfyEndpoint ?? "");

    if (appId) {
        formData.append('appId', appId);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        if (response.status === 504) {
            const error = new ResponseError({
                error: "Your workflow is taking too long to respond. The maximum allowed time is 5 minutes.",
                errorMsg: "ViewComfy Timeout",
                errorType: ErrorTypes.VIEW_MODE_TIMEOUT
            });
            throw error;
        }
        const responseError: ResponseError = await response.json();
        throw responseError;
    }

    if (!response.body) {
        throw new Error("No response body");
    }

    const reader = response.body.getReader();
    let buffer: Uint8Array = new Uint8Array(0);
    const output: Blob[] = [];
    const separator = new TextEncoder().encode('--BLOB_SEPARATOR--');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer = concatUint8Arrays(buffer, value);

        let separatorIndex: number;
        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        while ((separatorIndex = findSubarray(buffer, separator)) !== -1) {
            const outputPart = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + separator.length);

            const mimeEndIndex = findSubarray(outputPart, new TextEncoder().encode('\r\n\r\n'));
            if (mimeEndIndex !== -1) {
                const mimeType = new TextDecoder().decode(outputPart.slice(0, mimeEndIndex)).split(': ')[1];
                const outputData = outputPart.slice(mimeEndIndex + 4);
                const blob = new Blob([outputData], { type: mimeType });
                output.push(blob);
            }
        }
    }

    if (output.length > 0) {
        onSuccess(output);
    } else {
        onSuccess([]);
    }
}


interface Infer {
    apiUrl: string;
    params: Record<string, any>;
    override_workflow_api?: Record<string, any> | undefined;
    secret: Secret;
}

interface InferWithLogs extends Infer {
    loggingCallback: (message: string) => void;
}

/**
 * Make an inference request to the viewComfy API
 *
 * @param apiUrl - The URL to send the request to
 * @param params - The parameter to send to the workflow
 * @param override_workflow_api - Optional override the default workflow_api of the deployment
 * @param secret - Your ViewComfy Client ID and Client Secret or Token
 * @returns The parsed prompt result or null
 */
export const infer = async ({
    apiUrl,
    params,
    override_workflow_api,
    secret
}: Infer) => {

    if (!apiUrl) {
        throw new Error("viewComfyUrl is not set");
    }

    try {
        const formData = buildFormData({
            logs: false,
            params,
            override_workflow_api,
        });

        const headers: Record<string, string> = secret.clientId && secret.clientSecret ? {
            "client_id": secret.clientId,
            "client_secret": secret.clientSecret,
        } : {
            "Authorization": `Bearer ${secret.token}`,
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
            redirect: "follow",
            headers,
        });

        if (!response.ok) {
            const errMsg = `Failed to fetch viewComfy: ${response.statusText
                }, ${await response.text()}`;
            console.error(errMsg);
            throw new Error(errMsg);
        }

        const data = await response.json();
        return new PromptResult(data);
    } catch (error) {
        throw error;
    }
};

/**
 * Process a streaming Server-Sent Events (SSE) response.
 *
 * @param response - An active fetch response with a readable stream
 * @param loggingCallback - Function to handle log messages
 * @returns The parsed prompt result or null
 */
async function consumeEventSource(
    response: Response,
    loggingCallback: (message: string) => void
): Promise<PromptResult | null> {
    if (!response.body) {
        throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentData = "";
    let currentEvent = "message"; // Default event type
    let promptResult: PromptResult | null = null;
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines in the buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (promptResult) break;

                // Empty line signals the end of an event
                if (!trimmedLine) {
                    if (currentData) {
                        try {
                            if (
                                currentEvent === "log_message" ||
                                currentEvent === "error"
                            ) {
                                loggingCallback(
                                    `${currentEvent}: ${currentData}`
                                );
                            } else if (currentEvent === "prompt_result") {
                                promptResult = new PromptResult(
                                    JSON.parse(currentData)
                                );
                            } else {
                                console.log(
                                    `Unknown event: ${currentEvent}, data: ${currentData}`
                                );
                            }
                        } catch (e) {
                            console.log("Invalid JSON: ...");
                            console.error(e);
                        }
                        // Reset for next event
                        currentData = "";
                        currentEvent = "message";
                    }
                    continue;
                }

                // Parse SSE fields
                if (trimmedLine.startsWith("event:")) {
                    currentEvent = trimmedLine.substring(6).trim();
                } else if (trimmedLine.startsWith("data:")) {
                    currentData = trimmedLine.substring(5).trim();
                } else if (trimmedLine.startsWith("id:")) {
                    // Handle event ID if needed
                } else if (trimmedLine.startsWith("retry:")) {
                    // Handle retry directive if needed
                }
            }

            if (promptResult) break;
        }
    } catch (error) {
        console.error("Error reading stream:", error);
        throw error;
    }

    return promptResult;
}

/**
 * Make an inference with real-time logs from the execution prompt
 *
 * @param apiUrl - The URL to send the request to
 * @param params - The parameter to send to the workflow
 * @param loggingCallback - Function to handle log messages
 * @param override_workflow_api - Optional override the default workflow_api of the deployment
 * @returns The parsed prompt result or null
 */
export const inferWithLogsStream = async ({
    apiUrl,
    params,
    loggingCallback,
    override_workflow_api,
    secret,
}: InferWithLogs): Promise<PromptResult | null> => {
    if (!apiUrl) {
        throw new Error("url is not set");
    }


    try {
        const formData = buildFormData({
            logs: true,
            override_workflow_api,
            params,
        });

        const headers: Record<string, string> = secret.clientId && secret.clientSecret ? {
            "client_id": secret.clientId,
            "client_secret": secret.clientSecret,
        } : {
            "Authorization": `Bearer ${secret.token}`,
        };
        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
            headers,
        });

        if (response.status === 201) {
            // Check if it's actually a server-sent event stream
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("text/event-stream")) {
                return await consumeEventSource(response, loggingCallback);
            } else {
                throw new Error(
                    "Set the logs to True for streaming the process logs"
                );
            }
        } else {
            const errorText = await response.text();
            console.error(`Error response: ${errorText}`);
            throw new Error(errorText);
        }
    } catch (e) {
        console.error(
            `Error with streaming request: ${e instanceof Error ? e.message : String(e)
            }`
        );
        throw e;
    }
};

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
    outputs: File[];

    constructor(data: {
        prompt_id: string;
        status: string;
        completed: boolean;
        execution_time_seconds: number;
        prompt: Record<string, any>;
        outputs?: FilesData[];
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
        const fileOutputs = outputs.map((output) => {
            // Convert base64 data to Blob
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
        });

        this.prompt_id = prompt_id;
        this.status = status;
        this.completed = completed;
        this.execution_time_seconds = execution_time_seconds;
        this.prompt = prompt;
        this.outputs = fileOutputs;
    }
}

class Secret {
    clientId: string | undefined;
    clientSecret: string | undefined;
    token: string | undefined;

    constructor(params: {
        clientId: string,
        clientSecret: string
    } | {
        token: string
    }) {

        if ("clientId" in params) {
            if (!params.clientId) {
                throw new Error("clientId is not set");
            }
            if (!params.clientSecret) {
                throw new Error("clientSecret is not set");
            }
            this.clientId = params.clientId;
            this.clientSecret = params.clientSecret;
        } else {
            if (!params.token) {
                throw new Error("token is not set");
            }
            this.token = params.token;
        }
    }
}
