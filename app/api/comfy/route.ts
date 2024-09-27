import fs from 'fs/promises';
import { ReadableStream } from 'stream/web';
import mime from 'mime-types';
import { ComfyUIService } from '@/app/services/comfyui-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    let workflow = undefined;
    if (formData.get('workflow') && typeof formData.get('workflow') === 'object') {
        workflow = JSON.parse(formData.get('workflow') as string);
    }
    const viewComfy: { key: string, value: string | File }[] = [];

    for (const [key, value] of Array.from(formData.entries())) {
        if (key !== 'workflow') {
            viewComfy.push({ key, value: value as string | File });
        }
    }

    if (!viewComfy) {
        return new NextResponse(`ViewComfy is required`, { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const imagePaths = await comfyUIService.runComfyUI({ workflow, viewComfy });

        if (imagePaths.length > 0) {
            const stream = new ReadableStream({
                async start(controller) {
                    for (const imagePath of imagePaths) {
                        const mimeType = mime.lookup(imagePath) || 'application/octet-stream';
                        const imageBuffer = await fs.readFile(imagePath);
                        const mimeInfo = `Content-Type: ${mimeType}\r\n\r\n`;
                        controller.enqueue(new TextEncoder().encode(mimeInfo));
                        controller.enqueue(new Uint8Array(imageBuffer));
                        controller.enqueue(new TextEncoder().encode('\r\n--IMAGE_SEPARATOR--\r\n'));
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
        } else {
            return new NextResponse('No images generated', { status: 404 });
        }
    } catch (error: any) {
        return new NextResponse(`Error running ComfyUI: ${error.message}`, { status: 500 });
    }
}

