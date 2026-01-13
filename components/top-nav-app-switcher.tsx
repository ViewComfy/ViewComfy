"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBoundStore } from "@/stores/bound-store";
import { useViewComfyApps, useGetTeamByAppId } from "@/hooks/use-data";
import { AppSwitcherDialog } from "@/components/apps/app-switcher-dialog";
import type { IViewComfyApp } from "@/app/interfaces/viewcomfy-app";

interface TopNavAppSwitcherProps {
    appId: string | null | undefined;
    viewMode: boolean;
}

export default function TopNavAppSwitcher({ appId, viewMode }: TopNavAppSwitcherProps) {
    const router = useRouter();
    const { currentTeam } = useBoundStore();

    // These hooks use useAuth() internally - only safe inside ClerkProvider
    const { teamId: appTeamId } = useGetTeamByAppId({ appId });
    const effectiveTeamId = currentTeam?.id ?? appTeamId;
    const { viewComfyApps, isLoading: isLoadingApps } = useViewComfyApps({ teamId: effectiveTeamId });

    const handleSelectApp = useCallback((app: IViewComfyApp) => {
        router.push(`/playground?appId=${app.appId}`, { scroll: false });
    }, [router]);

    const showAppSwitcher = viewMode && appId && viewComfyApps && viewComfyApps.length > 1;

    if (!showAppSwitcher) {
        return null;
    }

    return (
        <AppSwitcherDialog
            apps={viewComfyApps}
            currentAppId={appId}
            isLoading={isLoadingApps}
            onSelectApp={handleSelectApp}
        />
    );
}
