import { NextRequest, NextResponse } from 'next/server';
import {
    ProxyGuardError,
    validateProxyUrl,
} from '@/app/lib/ssrf-guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB — text-proxy is for short strings

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
        target = await validateProxyUrl(url, { purpose: 'text-proxy' });
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

        const contentType = response.headers.get('Content-Type') || 'text/plain';
        // Text-proxy is used to fetch plain strings for input previews.
        // Don't blindly forward HTML or JS — an attacker could otherwise
        // use text-proxy to render arbitrary HTML in the user's context.
        if (!/^text\/(plain|markdown|csv|json|xml)/i.test(contentType)) {
            return NextResponse.json(
                { error: `Blocked content-type: ${contentType}` },
                { status: 415 },
            );
        }

        const text = await response.text();
        if (text.length > MAX_BYTES) {
            return NextResponse.json(
                { error: `Upstream payload exceeds ${MAX_BYTES} bytes` },
                { status: 413 },
            );
        }

        return new NextResponse(text, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': req.nextUrl?.origin || '*',
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching text:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 },
        );
    }
}
