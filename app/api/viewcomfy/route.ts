import { infer } from "@/app/services/viewcomfy-api-services";
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from "@/app/models/errors";
import { ViewComfyApiParamBuilder } from "@/app/models/viewcomfy-api-param-builder";
import { SettingsService } from "@/app/services/settings-service";

const errorResponseFactory = new ErrorResponseFactory();
const settingsService = new SettingsService();

const clientId = settingsService.getViewComfyCloudApiClientId();
const clientSecret = settingsService.getViewComfyCloudApiClientSecret();

export async function POST(request: NextRequest) {

    try {
        const formData = await request.formData();

        const viewComfyApiParamBuilder = new ViewComfyApiParamBuilder(formData);
        viewComfyApiParamBuilder.buildParamsForViewComfyApi();

        if (!clientId || !clientSecret) {
            const error = new Error('Client ID or Client Secret is missing');
            const responseError = errorResponseFactory.getErrorResponse(error);

            return NextResponse.json(responseError, {
                status: 422,
            });
        }

        const stream = await infer({
            apiUrl: viewComfyApiParamBuilder.viewComfyUrl,
            params: viewComfyApiParamBuilder.params,
            clientId,
            clientSecret,
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
