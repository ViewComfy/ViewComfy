"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SocketProvider } from "@/app/providers/socket-provider";
import { WorkflowDataProvider } from "@/app/providers/workflows-data-provider";

export default function AuthenticatedWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();

    useEffect(() => {
        if (!userId && isLoaded) {
            router.push("/login");
        }
    }, [userId, isLoaded, router]);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (!userId) {
        return null;
    }

    return (
        <WorkflowDataProvider>
            <SocketProvider>
                {children}
            </SocketProvider>
        </WorkflowDataProvider>
    );
} 
