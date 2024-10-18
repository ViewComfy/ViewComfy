import { type NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { missingViewComfyFileError, viewComfyFileName } from '@/app/constants';
import { ErrorBase, ErrorResponseFactory, ErrorTypes } from '@/app/models/errors';

const errorResponseFactory = new ErrorResponseFactory();

export async function GET(request: NextRequest) {
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

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
