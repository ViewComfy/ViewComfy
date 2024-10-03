import { type NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { missingViewComfyFileError, missingWorkflowApiFileError, viewComfyFileName, workflowApiFileName } from '@/app/constants';
import { ErrorBase, ErrorResponseFactory, ErrorTypes } from '@/app/models/errors';

const errorResponseFactory = new ErrorResponseFactory();

export async function GET(request: NextRequest) {
    const viewComfyPath = path.join(process.cwd(), viewComfyFileName);
    const workflowApiFilePath = path.join(process.cwd(), workflowApiFileName);
    try {
        const [fileContent] = await Promise.all([
            fs.readFile(viewComfyPath, 'utf8'),
            fs.access(workflowApiFilePath)
        ]);
        return NextResponse.json({ viewComfyJSON: JSON.parse(fileContent) });
    } catch (error) {
        console.error("Files not found");
        console.error(error);
        
        const missingFiles: string[]= [];
        if (!await fileExists(viewComfyPath)) {
            missingFiles.push(missingViewComfyFileError);
        }
        if (!await fileExists(workflowApiFilePath)) {
            missingFiles.push(
                missingWorkflowApiFileError
            );
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
