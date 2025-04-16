"use client"
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppContent from "@/components/app-content";

export default function AuthenticatedWrapper() {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();

    useEffect(() => {
        if (!userId && isLoaded) {
            return router.push("/login");
        }
    }, [userId, isLoaded, router]);

    // Show loading state while checking authentication
    if (!isLoaded) {
        return <div>Loading...</div>; // Or a more sophisticated loading component
    }

    // Once authenticated, render the main app content
    return <AppContent />;
} 
