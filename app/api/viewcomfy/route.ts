import { infer } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from "@/app/models/errors";
import { ViewComfyApiParamBuilder } from "@/app/models/viewcomfy-api-param-builder";
import { SettingsService } from "@/app/services/settings-service";
import { auth } from "@clerk/nextjs/server";
import { Secret } from "@/app/services/viewcomfy-api-services";

const errorResponseFactory = new ErrorResponseFactory();
const settingsService = new SettingsService();

const clientId = settingsService.getViewComfyCloudApiClientId();
const clientSecret = settingsService.getViewComfyCloudApiClientSecret();

export async function POST(request: NextRequest) {

    try {
        const formData = await request.formData();

        const viewComfyApiParamBuilder = new ViewComfyApiParamBuilder(formData);
        viewComfyApiParamBuilder.buildParamsForViewComfyApi();

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

            const token = await getToken();
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
