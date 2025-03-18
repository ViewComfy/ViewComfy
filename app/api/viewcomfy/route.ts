import { infer } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';
import { IViewComfy } from "@/app/interfaces/comfy-input";
import { ErrorResponseFactory } from "@/app/models/errors";

const errorResponseFactory = new ErrorResponseFactory();

const clientId = process.env.VIEWCOMFY_CLIENT_ID || "";
const clientSecret = process.env.VIEWCOMFY_CLIENT_SECRET || "";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        let overrideWorkflowApi = undefined;
        if (formData.get('workflow') && formData.get('workflow') !== 'undefined') {
            overrideWorkflowApi = JSON.parse(formData.get('workflow') as string);
        }
    
        let viewComfy: IViewComfy = {inputs: [], textOutputEnabled: false};
        if (formData.get('viewComfy') && formData.get('viewComfy') !== 'undefined') {
            viewComfy = JSON.parse(formData.get('viewComfy') as string);
        }
        
        const params: Record<string, unknown> = {};
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

        const stream = await infer({
            apiUrl: viewComfyUrl,
            params,
            clientId,
            clientSecret,
            overrideWorkflowApi: overrideWorkflowApi
        });
        

        return new NextResponse<ReadableStream<Uint8Array>>(stream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="generated_images.bin"'
            }
        });

    } catch (error: unknown) {
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
};
