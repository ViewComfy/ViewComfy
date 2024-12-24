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

    let viewComfyInputs: { key: string, value: unknown }[] = [];
    if (formData.get('viewComfyInputs') && formData.get('viewComfyInputs') !== 'undefined') {
        viewComfyInputs = JSON.parse(formData.get('viewComfyInputs') as string);
    }

    let viewComfyJSON = undefined;
    if (formData.get('viewComfyJSON') && formData.get('viewComfyJSON') !== 'undefined') {
        viewComfyJSON = JSON.parse(formData.get('viewComfyJSON') as string);
    }

    for (const [key, value] of Array.from(formData.entries())) {
        if (key !== 'workflow') {
            if (value instanceof File) {
                viewComfyInputs.push({ key, value });
            }
        }
    }

    if (!viewComfyInputs) {
        return new NextResponse("viewComfyInputs are required", { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const stream = await comfyUIService.runWorkflow({ workflow, viewComfyInputs, viewComfyJSON});

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
