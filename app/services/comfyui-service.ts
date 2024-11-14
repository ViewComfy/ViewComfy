import path from "node:path";
import type { IComfyInput } from "@/app/interfaces/comfy-input";
import { ComfyWorkflow } from "@/app/models/comfy-workflow";
import fs from "node:fs/promises";
import { ComfyErrorHandler } from "@/app/helpers/comfy-error-handler";
import { ComfyError, ComfyWorkflowError } from "@/app/models/errors";
import { ComfyUIAPIService } from "@/app/services/comfyui-api-service";
import mime from 'mime-types';
import { missingViewComfyFileError, viewComfyFileName } from "@/app/constants";

export class ComfyUIService {
    private comfyErrorHandler: ComfyErrorHandler;
    private comfyUIAPIService: ComfyUIAPIService;
    private clientId: string;

    constructor() {
        this.clientId = crypto.randomUUID();
        this.comfyErrorHandler = new ComfyErrorHandler();
        this.comfyUIAPIService = new ComfyUIAPIService(this.clientId);
    }

    async runWorkflow(args: IComfyInput) {
        let workflow = args.workflow;

        if (!workflow) {
            workflow = await this.getLocalWorkflow();
        }

        const comfyWorkflow = new ComfyWorkflow(workflow);
        await comfyWorkflow.setViewComfy(args.viewComfy);

        try {

            const promptData = await this.comfyUIAPIService.queuePrompt(workflow);
            const outputFiles = promptData.outputFiles;
            const comfyUIAPIService = this.comfyUIAPIService;

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
                            let ooutputBuffer
                            let mimeType
                            if (typeof file === 'string') {
                                    ooutputBuffer = new Blob([file], {
                                        type: 'text/plain'
                                    });
                                    mimeType = 'text/plain'
                                }
                            else {
                                ooutputBuffer = await comfyUIAPIService.getOutputFiles({ file });
                                mimeType =
                                    mime.lookup(file?.filename) || "application/octet-stream";
                            }
                            const mimeInfo = `Content-Type: ${mimeType}\r\n\r\n`;
                            controller.enqueue(new TextEncoder().encode(mimeInfo));
                            controller.enqueue(
                                new Uint8Array(await ooutputBuffer.arrayBuffer()),
                            );
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

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: unknown) {
            console.error("Failed to run the workflow");
            console.error({ error });

            if (error instanceof ComfyWorkflowError) {
                throw error;
            }

            const comfyError =
                this.comfyErrorHandler.tryToParseWorkflowError(error);
            if (comfyError) {
                throw comfyError;
            }

            throw new ComfyWorkflowError({
                message: "Error running workflow",
                errors: [
                    "Something went wrong running the workflow, the most common cases are missing nodes and running out of Vram. Make sure that you can run this workflow in your local comfy",
                ],
            });
        }
    }

    private async getLocalWorkflow(): Promise<object> {
        const missingWorkflowError = new ComfyError({
            message: "Failed to launch ComfyUI",
            errors: [missingViewComfyFileError],
        });

        let workflow = undefined;

        try {
            const filePath = path.join(process.cwd(), viewComfyFileName);
            const fileContent = await fs.readFile(filePath, "utf8");
            workflow = JSON.parse(fileContent);
        } catch (error) {
            throw missingWorkflowError;
        }

        if (!workflow) {
            throw missingWorkflowError;
        }

        return workflow;
    }
    
    async uploadFile(file: File) {

        if (!file) {
            throw new Error("File is not defined or missing.");
        }

        try {

            const fileBuffer = await file.arrayBuffer();
            const base64Image = Buffer.from(fileBuffer).toString('base64');

            const formData = new FormData();
            formData.append('image', new Blob([Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))], { type: 'image/png' }), file.name);
            formData.append('type', "input");
            formData.append('overwrite', "false");

            const response = await fetch(`${this.comfyUIAPIService.getUrl("http")}/api/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Failed to upload file : ${response.statusText}`);
            }

            const responseData = await response.text();

            let json;
            try {
                json = JSON.parse(responseData);
            } catch (e) {
                throw new Error("The response is not valid JSON.");
            }

            return json.name; 

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: unknown) {

            if (error instanceof ComfyWorkflowError) {
                throw error;
            }

            const comfyError =
                this.comfyErrorHandler.tryToParseWorkflowError(error);
            if (comfyError) {
                throw comfyError;
            }
            console.log(error)

            throw new ComfyWorkflowError({
                message: "Error running workflow",
                errors: [
                    "Something went wrong running the workflow, impossible to upload file to comfyui.",
                ],
            });
        }
    }
    
}
