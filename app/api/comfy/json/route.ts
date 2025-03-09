import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const COMFY_JSON_DIR = path.join(process.cwd(), "comfy", "json");

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
        const filePath = path.join(COMFY_JSON_DIR, fileName);
        
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
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        // Get file stats for each JSON file
        const fileDetails = await Promise.all(
            jsonFiles.map(async (fileName) => {
                const filePath = path.join(COMFY_JSON_DIR, fileName);
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
        
        return NextResponse.json(fileDetails);
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
        const filePath = path.join(COMFY_JSON_DIR, fileName);
        
        await fs.unlink(filePath);
        
        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}