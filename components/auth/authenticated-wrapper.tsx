"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SocketProvider } from "@/app/providers/socket-provider";
import { WorkflowDataProvider } from "@/app/providers/workflows-data-provider";
import { useGetTeamByAppId, useUser, useWorkflows } from "@/hooks/use-data";
import { useBoundStore } from "@/stores/bound-store";
import { useSearchParams } from "next/navigation";

export default function AuthenticatedWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const { setCurrentTeam, currentTeam, setWorkflows } = useBoundStore();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const appId: string | null | undefined = searchParams?.get("appId");
    const { teamId, isLoading } = useGetTeamByAppId({ appId });
    const { workflows } = useWorkflows({ teamId: currentTeam?.id });

    useEffect(() => {
        if (user && user?.teams.length > 0 && !currentTeam && !isLoading) {
            if (teamId) {
                let idx = user.teams.findIndex(t => t.id === teamId);
                if (idx === -1) {
                    idx = 0;
                }
                setCurrentTeam(user.teams[idx]);
            } else {
                setCurrentTeam(user.teams[0]);
            }
        }
    }, [user, setCurrentTeam, teamId, appId, currentTeam, isLoading]);

    useEffect(() => {
        if (workflows) {
            setWorkflows(workflows)
        };
    }, [workflows, setWorkflows])

    useEffect(() => {
        if (!userId && isLoaded) {
            router.push("/login");
        }
    }, [userId, isLoaded, router]);

    // this should remain the only condition because people with glitchy connection face a flashing loading screen
    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <WorkflowDataProvider>
            <SocketProvider>
                {children}
            </SocketProvider>
        </WorkflowDataProvider>
    );
} 
