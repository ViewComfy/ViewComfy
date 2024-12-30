import { ComfyUIService } from '@/app/services/comfyui-service';
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from '@/app/models/errors';

const errorResponseFactory = new ErrorResponseFactory();

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    let workflow = undefined;
    if (formData.get('workflow') && formData.get('workflow') !== 'undefined') {
        workflow = JSON.parse(formData.get('workflow') as string);
    }

    let viewComfy: {inputs: { key: string, value: unknown }[], textOutputEnabled: boolean} = {inputs: [], textOutputEnabled: false};
    if (formData.get('viewComfy') && formData.get('viewComfy') !== 'undefined') {
        viewComfy = JSON.parse(formData.get('viewComfy') as string);
    }

    // let viewComfyJSON = undefined;
    // if (formData.get('viewComfyJSON') && formData.get('viewComfyJSON') !== 'undefined') {
    //     viewComfyJSON = JSON.parse(formData.get('viewComfyJSON') as string);
    // }

    for (const [key, value] of Array.from(formData.entries())) {
        if (key !== 'workflow') {
            if (value instanceof File) {
                viewComfy.inputs.push({ key, value });
            }
        }
    }

    if (!viewComfy) {
        return new NextResponse("viewComfy is required", { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const stream = await comfyUIService.runWorkflow({ workflow, viewComfy});

        return new NextResponse<ReadableStream<Uint8Array>>(stream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="generated_images.bin"'
            }
        });
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: unknown) {
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
}
