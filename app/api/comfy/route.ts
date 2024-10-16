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
    const viewComfy: { key: string, value: string | File }[] = [];

    for (const [key, value] of Array.from(formData.entries())) {
        if (key !== 'workflow') {
            viewComfy.push({ key, value: value as string | File });
        }
    }

    if (!viewComfy) {
        return new NextResponse("ViewComfy is required", { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const stream = await comfyUIService.runWorkflow({ workflow, viewComfy });

        return new NextResponse<ReadableStream<Uint8Array>>(stream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="generated_images.bin"'
            }
        });
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
}
