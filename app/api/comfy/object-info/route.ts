import { NextResponse } from 'next/server';
import { ComfyUIAPIService } from '@/app/services/comfyui-api-service';

export async function GET() {
    try {
        const clientId = crypto.randomUUID();
        const comfyAPIService = new ComfyUIAPIService(clientId);
        const objectInfo = await comfyAPIService.getObjectInfo();

        return NextResponse.json(objectInfo);
    } catch (error) {
        console.error('Error fetching object_info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch object_info from ComfyUI' },
            { status: 500 }
        );
    }
}
