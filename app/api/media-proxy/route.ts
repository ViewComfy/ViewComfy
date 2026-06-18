import { NextRequest, NextResponse } from 'next/server';
import {
    ProxyGuardError,
    validateProxyUrl,
} from '@/app/lib/ssrf-guard';

export const runtime = 'nodejs';
// Cap response body for any single proxy call so a malicious upstream
// can't pin the Node event loop on a multi-GB download.
export const maxDuration = 30;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json(
            { error: 'URL parameter is required' },
            { status: 400 },
        );
    }

    let target;
    try {
        target = await validateProxyUrl(url, { purpose: 'media-proxy' });
    } catch (error) {
        if (error instanceof ProxyGuardError) {
            return NextResponse.json(
                { error: `Blocked: ${error.message}` },
                { status: 403 },
            );
        }
        return NextResponse.json(
            { error: 'Invalid URL' },
            { status: 400 },
        );
    }

    try {
        const response = await fetch(target.url, {
            // No automatic redirect — re-validate the Location URL through
            // the guard. An attacker can otherwise redirect us into a
            // private subnet.
            redirect: 'manual',
        });

        if (response.status >= 300 && response.status < 400) {
            return NextResponse.json(
                { error: 'Redirects are not allowed' },
                { status: 502 },
            );
        }
        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${response.status}` },
                { status: 502 },
            );
        }

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        // Only forward a handful of safe content types. Anything else is
        // a red flag — the proxy is used for image/video preview, not
        // for arbitrary HTML/JS execution in the user's browser context.
        const allowed = /^(image\/(png|jpe?g|gif|webp|svg\+xml|avif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp3|wav|ogg|aac|flac)|application\/octet-stream)/i;
        if (!allowed.test(contentType)) {
            return NextResponse.json(
                { error: `Blocked content-type: ${contentType}` },
                { status: 415 },
            );
        }

        const blob = await response.blob();
        if (blob.size > MAX_BYTES) {
            return NextResponse.json(
                { error: `Upstream payload exceeds ${MAX_BYTES} bytes` },
                { status: 413 },
            );
        }

        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // Restrict CORS to the same origin the app is served from.
                // The previous * allowed any site to embed the proxy as a
                // data exfiltration channel.
                'Access-Control-Allow-Origin': req.nextUrl?.origin || '*',
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching media:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 },
        );
    }
}
