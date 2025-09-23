"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppContent from "@/components/app-content";
import { SocketProvider } from "@/app/providers/socket-provider";
import { WorkflowDataProvider } from "@/app/providers/workflows-data-provider";

export default function AuthenticatedWrapper() {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();

    useEffect(() => {
        if (!userId && isLoaded) {
            router.push("/login");
        }
    }, [userId, isLoaded, router]);

    // Show loading state while checking authentication
    if (!isLoaded) {
        return <div>Loading...</div>; // Or a more sophisticated loading component
    }

    if (!userId) {
        return null;
    }

    // Once authenticated, render the main app content
    return (
        <WorkflowDataProvider>
            <SocketProvider>
                <AppContent />
            </SocketProvider>
        </WorkflowDataProvider>
    );
} 
