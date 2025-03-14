import { promises as fs } from "fs";
import * as path from "path";
import { infer, inferWithLogsStream } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';

// import { workflowApiParametersCreator } from "../../workflows/flux-consistent-characters/node-typescript/workflow_api_parameters_creator";

const viewComfyUrl = "";
const clientId = "";
const clientSecret = "";

// Move your main function logic into a route handler
export async function POST(request: NextRequest) {
    try {
        const override_workflow_api_path = null;

        const params = {};

        params["6-inputs-text"] = "A cat sorcerer"

        // const inputImage = await loadImageFile("<path to image>");
        // params["52-inputs-image"] = inputImage;

        // params["3-inputs-steps"] = 1


        let override_workflow_api = null;
        if (override_workflow_api_path) {
            try {
                const fileContent = await fs.readFile(override_workflow_api_path, "utf-8");
                override_workflow_api = JSON.parse(fileContent);
            } catch (error) {
                console.error("Override workflow API path does not exist");
            }
        }

        // Call the API and wait for the results
        const result = await infer({
            apiUrl: viewComfyUrl,
            params,
            clientId,
            clientSecret,
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

        // return new NextResponse(result, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });

        // const urls = [];
        // if (result) {
        //     for (const file of result.outputs) {
        //         await saveBlob(file, file.name);
        //     }
        // }

        // return { success: true, urls };
    } catch (error: any) {
        console.error("Error:", error);
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