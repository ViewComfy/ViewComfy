import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const viewComfyFileName = process.env.VIEW_COMFY_FILE_NAME || "view_comfy.json";

export async function GET(request: NextRequest) {
    const filePath = path.join(process.cwd(), viewComfyFileName);
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return NextResponse.json({ viewComfyJSON: JSON.parse(fileContent) });
    } catch (error) {
        return NextResponse.json({ error: `File ${viewComfyFileName} not found` }, { status: 404 });
    }
}
