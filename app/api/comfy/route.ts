import fs from 'node:fs/promises';
import { ReadableStream } from 'node:stream/web';
import mime from 'mime-types';
import { ComfyUIService } from '@/app/services/comfyui-service';
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from '@/app/models/errors';

const errorResponseFactory = new ErrorResponseFactory();

export async function POST(request: NextRequest) {
    console.log('GB, posting request: ')
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
        const outputPaths = await comfyUIService.runComfyUI({ workflow, viewComfy });
        console.log('GB, outputPaths: ', outputPaths)

        if (outputPaths.length > 0) {
            const stream = new ReadableStream({
                async start(controller) {
                    for (const outputPath of outputPaths) {
                        const mimeType = mime.lookup(outputPath) || 'application/octet-stream';
                        const ooutputBuffer = await fs.readFile(outputPath);
                        const mimeInfo = `Content-Type: ${mimeType}\r\n\r\n`;
                        controller.enqueue(new TextEncoder().encode(mimeInfo));
                        controller.enqueue(new Uint8Array(ooutputBuffer));
                        controller.enqueue(new TextEncoder().encode('\r\n--BLOB_SEPARATOR--\r\n'));
                    }
                    controller.close();
                }
            });
            // @ts-ignore
            return new NextResponse(stream, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename="generated_images.bin"'
                }
            });
        }
        return new NextResponse('No images generated', { status: 404 });

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
}
