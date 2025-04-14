import { NextResponse } from "next/server";

import {
    clerkMiddleware,
    createRouteMatcher,
} from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login(.*)"]);

export default clerkMiddleware(async (auth, request) => {
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
