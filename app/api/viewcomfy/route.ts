import { infer } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from "@/app/models/errors";
import { ViewComfyApiParamBuilder } from "@/app/models/viewcomfy-api-param-builder";
import { SettingsService } from "@/app/services/settings-service";
import { auth } from "@clerk/nextjs/server";
import { Secret } from "@/app/services/viewcomfy-api-services";
import { requireApiToken } from "@/app/lib/api-auth";
import {
    ProxyGuardError,
    validateViewComfyEndpoint,
} from "@/app/lib/ssrf-guard";

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_REQUEST_BYTES = 100 * 1024 * 1024; // 100 MB

const errorResponseFactory = new ErrorResponseFactory();
const settingsService = new SettingsService();

const clientId = settingsService.getViewComfyCloudApiClientId();
const clientSecret = settingsService.getViewComfyCloudApiClientSecret();

export async function POST(request: NextRequest) {

    // Auth gate: when Clerk is off, require VIEWCOMFY_API_TOKEN.
    const authError = requireApiToken(request);
    if (authError) return authError;

    // Body size gate.
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
        return NextResponse.json(
            { error: `Request body exceeds ${MAX_REQUEST_BYTES} bytes` },
            { status: 413 },
        );
    }

    try {
        const formData = await request.formData();

        const viewComfyApiParamBuilder = new ViewComfyApiParamBuilder(formData);
        viewComfyApiParamBuilder.buildParamsForViewComfyApi();

        // SSRF guard: the viewcomfyEndpoint is supplied by the client and
        // is then POSTed to with the operator's own credentials. Without
        // an allowlist this is a server-side SSRF with creds attached.
        try {
            validateViewComfyEndpoint(viewComfyApiParamBuilder.viewComfyUrl);
        } catch (error) {
            if (error instanceof ProxyGuardError) {
                return NextResponse.json(
                    { error: `Blocked viewcomfyEndpoint: ${error.message}` },
                    { status: 403 },
                );
            }
            throw error;
        }

        let secret: Secret | undefined;

        if (settingsService.isUserManagementEnabled()) {
            const { userId, getToken } = await auth();

            if (!userId) {
                const error = new Error('Unauthorized');
                const responseError = errorResponseFactory.getErrorResponse(error);

                return NextResponse.json(responseError, {
                    status: 401,
                });
            }

            const token = await getToken({ template: "long_token" });
            if (!token) {
                const error = new Error('Unauthorized: Token is missing');
                const responseError = errorResponseFactory.getErrorResponse(error);

                return NextResponse.json(responseError, {
                    status: 401,
                });
            }
            secret = new Secret({ token });
        }

        if (!secret) {
            if (!clientId || !clientSecret) {
                const error = new Error('Client ID or Client Secret is missing');
                const responseError = errorResponseFactory.getErrorResponse(error);

                return NextResponse.json(responseError, {
                    status: 422,
                });
            }

            secret = new Secret({ clientId, clientSecret });
        }

        const stream = await infer({
            apiUrl: viewComfyApiParamBuilder.viewComfyUrl,
            params: viewComfyApiParamBuilder.params,
            secret,
            overrideWorkflowApi: viewComfyApiParamBuilder.overrideWorkflowApi
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
