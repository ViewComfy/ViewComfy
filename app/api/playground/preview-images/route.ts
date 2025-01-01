// pages/api/upload.ts
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { UPLOAD_PREVIEW_IMAGES_PATH } from '@/app/constants'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
        }

        const fileName = `${Date.now()}-${file.name}`
        const publicPath = path.join(process.cwd(), "public", UPLOAD_PREVIEW_IMAGES_PATH);

        // Create uploads directory if it doesn't exist

        try {
            await fs.stat(publicPath)
        } catch (error: unknown) { 
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                await fs.mkdir(publicPath, { recursive: true })
            }
        }

        // Copy file to public/uploads
        const rawData = await file.arrayBuffer();
        await fs.writeFile(path.join(publicPath, fileName), Buffer.from(rawData))

        // Return the public URL
        const fileUrl = `/${UPLOAD_PREVIEW_IMAGES_PATH}/${fileName}`;

        return NextResponse.json({ url: fileUrl }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error uploading file' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { url } = await request.json()

    if (!url) {
        return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Construct the full path to the image file
    const filePath = path.join(process.cwd(), 'public', url);
    try {
        // Check if the file exists
        if ((await fs.stat(filePath)).isFile()) {
            // Delete the file
            await fs.unlink(filePath);
            return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: 'Image deletion failed' }, { status: 500 });
    }
}