import { ComfyUIService } from '@/app/services/comfyui-service';
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from '@/app/models/errors';
import { IViewComfy } from '@/app/interfaces/comfy-input';
import { requireApiToken } from '@/app/lib/api-auth';

export const runtime = 'nodejs';
// 5 minutes is the practical upper bound for a single ComfyUI run.
// Prevents the event loop from being held indefinitely by a stuck job.
export const maxDuration = 300;

const errorResponseFactory = new ErrorResponseFactory();

// Hard cap on request body to prevent the formData parse itself from
// pinning the event loop on a multi-GB upload.
const MAX_REQUEST_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
    // Auth gate: when Clerk is off, require VIEWCOMFY_API_TOKEN.
    const authError = requireApiToken(request);
    if (authError) return authError;

    // Body size gate. We can't easily check this *before* parsing
    // formData, but we can fail fast on the content-length header when
    // the upstream supplies one (most clients do, including the
    // browser FormData implementation in Next's runtime).
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
        return NextResponse.json(
            { error: `Request body exceeds ${MAX_REQUEST_BYTES} bytes` },
            { status: 413 },
        );
    }

    const formData = await request.formData();
    let workflow = undefined;
    if (formData.get('workflow') && formData.get('workflow') !== 'undefined') {
        try {
            workflow = JSON.parse(formData.get('workflow') as string);
        } catch {
            return new NextResponse("workflow is not valid JSON", { status: 400 });
        }
    }

    let viewComfy: IViewComfy = {inputs: [], textOutputEnabled: false};
    if (formData.get('viewComfy') && formData.get('viewComfy') !== 'undefined') {
        try {
            viewComfy = JSON.parse(formData.get('viewComfy') as string);
        } catch {
            return new NextResponse("viewComfy is not valid JSON", { status: 400 });
        }
    }

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
        const stream = await comfyUIService.runWorkflow({ workflow, viewComfy });

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
