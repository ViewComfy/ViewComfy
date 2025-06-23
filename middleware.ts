import { NextRequest, NextResponse } from "next/server";

import {
    clerkMiddleware,
    createRouteMatcher,
} from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login(.*)"]);

export default clerkMiddleware(async (auth, request) => {

    const proxyResponse = proxyMiddleware(request)
    if (proxyResponse) {
        return proxyResponse
    }
      // Check if user management is enabled
    const userManagementEnabled = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

    if (!userManagementEnabled) {
        // If user management is disabled, allow all requests
        return NextResponse.next();
    }

    const { userId, redirectToSignIn } = await auth();

    if (!userId && !isPublicRoute(request)) {
        // Add custom logic to run before redirecting

        return redirectToSignIn();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};

function proxyMiddleware(req: NextRequest) {
    if (req.nextUrl.pathname.match('__clerk')) {
        const proxyHeaders = new Headers(req.headers)
        proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '')
        proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')
        if (req.ip) {
            proxyHeaders.set('X-Forwarded-For', req.ip)
        } else {
            proxyHeaders.set('X-Forwarded-For', req.headers.get('X-Forwarded-For') || '')
        }

        const proxyUrl = new URL(req.url)
        proxyUrl.host = 'frontend-api.clerk.dev'
        proxyUrl.port = '443'
        proxyUrl.protocol = 'https'
        proxyUrl.pathname = proxyUrl.pathname.replace('/__clerk', '')

        return NextResponse.rewrite(proxyUrl, {
            request: {
                headers: proxyHeaders,
            },
        })
    }

    return null
}
