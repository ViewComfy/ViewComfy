import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const COMFY_JSON_DIR = path.join(process.cwd(), "comfy", "json");

// Validate file path to prevent directory traversal
function isValidFilePath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return normalizedPath.startsWith(COMFY_JSON_DIR) && 
           !normalizedPath.includes('..') && 
           path.extname(normalizedPath) === '.json';
}

// Validate filename
function isValidFileName(fileName: string): boolean {
    return /^[\w\-. ]+\.json$/.test(fileName) && !fileName.includes('..');
}

// Ensure directory exists
async function ensureDir() {
    try {
        await fs.access(COMFY_JSON_DIR);
    } catch {
        await fs.mkdir(COMFY_JSON_DIR, { recursive: true });
    }
}

// Save JSON file
export async function POST(request: Request) {
    try {
        await ensureDir();
        const data = await request.json();
        const { fileName, content } = data;

        if (!fileName || typeof fileName !== 'string') {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        if (!content || typeof content !== 'object') {
            return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
        }

        if (!isValidFileName(fileName)) {
            return NextResponse.json({ error: 'Invalid filename format' }, { status: 400 });
        }

        const filePath = path.join(COMFY_JSON_DIR, fileName);
        
        if (!isValidFilePath(filePath)) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        await fs.writeFile(filePath, JSON.stringify(content, null, 2));
        
        return NextResponse.json({ message: 'File saved successfully' });
    } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
}

// Load JSON files listing
export async function GET() {
    try {
        await ensureDir();
        const files = await fs.readdir(COMFY_JSON_DIR);
        const jsonFiles = files.filter(file => isValidFileName(file));
        
        // Get file stats for each JSON file
        const fileDetails = await Promise.all(
            jsonFiles.map(async (fileName) => {
                const filePath = path.join(COMFY_JSON_DIR, fileName);
                
                if (!isValidFilePath(filePath)) {
                    return null;
                }

                const stats = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                return {
                    name: fileName,
                    size: stats.size,
                    modifiedAt: stats.mtime,
                    content: JSON.parse(content)
                };
            })
        );

        // Filter out any null entries from invalid files
        const validFileDetails = fileDetails.filter(detail => detail !== null);
        
        return NextResponse.json(validFileDetails);
    } catch (error) {
        console.error('Error reading files:', error);
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}

// Delete JSON file
export async function DELETE(request: Request) {
    try {
        const data = await request.json();
        const { fileName } = data;

        if (!fileName || typeof fileName !== 'string') {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        if (!isValidFileName(fileName)) {
            return NextResponse.json({ error: 'Invalid filename format' }, { status: 400 });
        }

        const filePath = path.join(COMFY_JSON_DIR, fileName);
        
        if (!isValidFilePath(filePath)) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        await fs.unlink(filePath);
        
        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}