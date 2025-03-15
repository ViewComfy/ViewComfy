import { ComfyErrorHandler } from "../helpers/comfy-error-handler";
import { ComfyWorkflowError } from "../models/errors";

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

interface Infer {
    apiUrl: string;
    params: Record<string, any>;
    override_workflow_api?: Record<string, any> | undefined;
    clientId: string;
    clientSecret: string;
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
 * @returns The parsed prompt result or null
 */
export const infer = async ({
    apiUrl,
    params,
    override_workflow_api,
    clientId,
    clientSecret,
}: Infer) => {
    if (!apiUrl) {
        throw new Error("viewComfyUrl is not set. Please get the right endpoint from your dashboard.");
    }
    if (!clientId) {
        throw new Error("Client ID is not set. You need your API keys to use your API endpoint. You can get your keys from the ViewComfy dashboard and add them to the .env file.");
    }
    if (!clientSecret) {
        throw new Error("c=Client Secret is not set. You need your API keys to use your API endpoint. You can get your keys from the ViewComfy dashboard and add them to the .env file.");
    }

    const comfyErrorHandler = new ComfyErrorHandler();

    try {
        const formData = buildFormData({
            logs: false,
            params,
            override_workflow_api,
        });

        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
            redirect: "follow",
            headers: {
                "client_id": clientId,
                "client_secret": clientSecret,
            },
        });

        if (!response.ok) {
            const errMsg = `Failed to fetch viewComfy: ${
                response.statusText
            }, ${await response.text()}`;
            console.error(errMsg);
            throw new Error(errMsg);
        }

        const data = await response.json();
        const outputFiles = data.outputs;

        if (outputFiles.length === 0) {
            throw new ComfyWorkflowError({
                message: "No output files found",
                errors: ["No output files found"],
            });
        }

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                for (const file of outputFiles) {
                    try {
                        let outputBuffer: Blob;
                        let mimeType: string;

                                        // Convert base64 data to Blob
                        const binaryData = atob(file.data);
                        const arrayBuffer = new ArrayBuffer(binaryData.length);
                        const uint8Array = new Uint8Array(arrayBuffer);

                        for (let i = 0; i < binaryData.length; i++) {
                            uint8Array[i] = binaryData.charCodeAt(i);
                        }

                        outputBuffer = new Blob([arrayBuffer], { type: file.content_type });
                        mimeType = file.content_type;

                        const mimeInfo = `Content-Type: ${mimeType}\r\n\r\n`;
                        controller.enqueue(new TextEncoder().encode(mimeInfo));
                        controller.enqueue(new Uint8Array(await outputBuffer.arrayBuffer()));
                        controller.enqueue(
                            new TextEncoder().encode("\r\n--BLOB_SEPARATOR--\r\n"),
                        );
                    } catch (error) {
                        console.error("Failed to get output file");
                        console.error(error);
                    }
                }
                controller.close();
            },
        });
        return stream;

    } catch (error: unknown) {
        console.error("Failed to run the workflow");
        console.error({ error });

        if (error instanceof Error && error.cause) {
            throw error;
        }

        if (error instanceof ComfyWorkflowError) {
            throw error;
        }

        const comfyError =
            comfyErrorHandler.tryToParseWorkflowError(error);
        if (comfyError) {
            throw comfyError;
        }

        throw new ComfyWorkflowError({
            message: "Error running workflow",
            errors: [
                "Something went wrong running the workflow, the most common cases are missing nodes and running out of Vram. Make sure that you can run this workflow on your deployment.",
            ],
        });
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
    clientId,
    clientSecret,
}: InferWithLogs): Promise<PromptResult | null> => {
    if (!apiUrl) {
        throw new Error("url is not set");
    }
    if (!clientId) {
        throw new Error("clientId is not set");
    }
    if (!clientSecret) {
        throw new Error("clientSecret is not set");
    }

    try {
        const formData = buildFormData({
            logs: true,
            override_workflow_api,
            params,
        });
        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
            headers: {
                "client_id": clientId,
                "client_secret": clientSecret,
            },
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
            `Error with streaming request: ${
                e instanceof Error ? e.message : String(e)
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
