"use client"
import dynamic from "next/dynamic";
import AppContent from "@/components/app-content";

// Dynamically import the authenticated wrapper component
const AuthenticatedWrapper = dynamic(
    () => import("@/components/auth/authenticated-wrapper"),
    { ssr: false }
);

export default function Page() {
    const userManagement = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

    // If user management is enabled, wrap the app content with authentication
    if (userManagement === true) {
        return <AuthenticatedWrapper />;
    }

    // Otherwise render the app content directly
    return <AppContent />;
}

