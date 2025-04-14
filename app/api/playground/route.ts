import { type NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { missingViewComfyFileError, viewComfyFileName } from '@/app/constants';
import { ErrorBase, ErrorResponseFactory, ErrorTypes } from '@/app/models/errors';
import { auth } from '@clerk/nextjs/server'
import { SettingsService } from '@/app/services/settings-service';
import { ViewComfyService } from '@/app/services/viewcomfy-service';

const errorResponseFactory = new ErrorResponseFactory();

const settingsService = new SettingsService();
const viewComfyService = new ViewComfyService();

export async function GET(request: NextRequest) {

    if (settingsService.isUserManagementEnabled()) {
        const { userId, getToken } = await auth();

        if (!userId) {
            return new Response('Unauthorized', { status: 401 })
        }

        const token = await getToken();
        if (!token) {
            return new Response('Unauthorized: Token is missing', { status: 401 })
        }

        const appId = request.nextUrl.searchParams.get('appId');

        if (!appId) {
            const err = new ErrorBase({
                message: "App ID is required",
                errorType: ErrorTypes.VIEW_MODE_MISSING_APP_ID,
                errors: ["You're missing the App ID in the URL, make sure to copy it from the ViewComfy Dashboard"]
            });
            const responseError = errorResponseFactory.getErrorResponse(err);
            return NextResponse.json(responseError, {
                status: 422,
            });
        }

        try {
            const viewComfyApp = await viewComfyService.getViewComfyApp(appId, token);
            return NextResponse.json({ viewComfyJSON: viewComfyApp.viewComfyJson });
        } catch (error) {
            const responseError = errorResponseFactory.getErrorResponse(error);
            return NextResponse.json(responseError, {
                status: 500,
            });
        }

    } else {
        const viewComfyPath = path.join(process.cwd(), viewComfyFileName);
        try {
            const fileContent = await fs.readFile(viewComfyPath, 'utf8');
            return NextResponse.json({ viewComfyJSON: JSON.parse(fileContent) });
        } catch (error) {
            console.error("Files not found");
            console.error(error);

            const missingFiles: string[] = [];
            if (!await fileExists(viewComfyPath)) {
                missingFiles.push(missingViewComfyFileError);
            }

            const err = new ErrorBase({
                message: "ViewMode is missing files",
                errorType: ErrorTypes.VIEW_MODE_MISSING_FILES,
                errors: missingFiles
            });

            const responseError = errorResponseFactory.getErrorResponse(err);
            return NextResponse.json(responseError, {
                status: 500,
            });
        }
    }
}

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
