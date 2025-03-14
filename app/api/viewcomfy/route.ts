import { promises as fs } from "fs";
import * as path from "path";
import { infer, inferWithLogsStream } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';
import { IViewComfy } from "@/app/interfaces/comfy-input";
import { ErrorResponseFactory } from "@/app/models/errors";

const errorResponseFactory = new ErrorResponseFactory();

const clientId = process.env.VIEWCOMFY_CLIENT_ID || "";
const clientSecret = process.env.VIEWCOMFY_CLIENT_SECRET || "";

// Move your main function logic into a route handler
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        let override_workflow_api = undefined;
        if (formData.get('workflow') && formData.get('workflow') !== 'undefined') {
            override_workflow_api = JSON.parse(formData.get('workflow') as string);
        }
    
        let viewComfy: IViewComfy = {inputs: [], textOutputEnabled: false};
        if (formData.get('viewComfy') && formData.get('viewComfy') !== 'undefined') {
            viewComfy = JSON.parse(formData.get('viewComfy') as string);
        }
        
        const params: Record<string, any> = {};
        for (const [key, value] of Array.from(formData.entries())) {
            if (key !== 'workflow') {
                if (value instanceof File) {
                    params[key] = value;
                } else if (key === "viewComfy") {
                    for (const input of viewComfy.inputs) {
                        params[input.key] = input.value;
                    }
                }
            }
        }
        const viewComfyUrl = formData.get('viewcomfyEndpoint') as string;
    
        if (!viewComfy) {
            return new NextResponse("viewComfy is required", { status: 400 });
        }

        // Call the API and wait for the results
        const result = await infer({
            apiUrl: viewComfyUrl,
            params,
            clientId,
            clientSecret,
            override_workflow_api: override_workflow_api
        });

        // Call the API and get the logs of the execution in real time
        // the console.log is the function that will be use to log the messages
        // you can use any function that you want
        // const result = await inferWithLogsStream({
        //     apiUrl: viewComfyUrl,
        //     params,
        //     loggingCallback: console.log,
        //     clientId,
        //     clientSecret,
        // });

        const firstOutput = result.outputs[0];
        
        return new NextResponse(firstOutput, {
            headers: {
                'Content-Type': firstOutput.type,
                'Content-Disposition': `inline; filename="${firstOutput.name}"`
            }
        });

    } catch (error: unknown) {
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
};

async function loadImageFile(filepath: string): Promise<File> {
    const buffer = await fs.readFile(filepath);
    return new File([buffer], path.basename(filepath), { type: "image/png" });
}

async function saveBlob(blob: Blob, filename: string): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
}