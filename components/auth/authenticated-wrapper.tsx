"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { SocketProvider } from "@/app/providers/socket-provider";
import { WorkflowDataProvider } from "@/app/providers/workflows-data-provider";
import { ApiAppExecutionProvider } from "@/app/providers/api-app-execution-provider";
import { useGetTeamByAppId, useUser, useWorkflows, useInitializeOpenAPIAuth } from "@/hooks/use-data";
import { useBoundStore } from "@/stores/bound-store";
import { useSearchParams } from "next/navigation";
import { parseAppIdParam } from "@/app/interfaces/unified-app";

export default function AuthenticatedWrapper({ children }: { children: React.ReactNode }) {
    const { isLoaded } = useAuth();
    const { setCurrentTeam, currentTeam, setWorkflows } = useBoundStore();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const appIdParam = searchParams?.get("appId");
    const parsedAppId = appIdParam ? parseAppIdParam(appIdParam) : null;
    const viewComfyAppId = parsedAppId?.type === "viewcomfy" ? parsedAppId.id : null;
    const { teamId, isLoading } = useGetTeamByAppId({ appId: viewComfyAppId });
    const { workflows } = useWorkflows({ teamId: currentTeam?.id });
    useInitializeOpenAPIAuth();

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
    }, [user, setCurrentTeam, teamId, viewComfyAppId, currentTeam, isLoading]);

    useEffect(() => {
        if (workflows) {
            setWorkflows(workflows)
        };
    }, [workflows, setWorkflows])

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <WorkflowDataProvider>
            <ApiAppExecutionProvider>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </ApiAppExecutionProvider>
        </WorkflowDataProvider>
    );
} 
