"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBoundStore } from "@/stores/bound-store";
import { useAllApps, useGetTeamByAppId } from "@/hooks/use-data";
import { AppSwitcherDialog } from "@/components/apps/app-switcher-dialog";
import { ParsedAppId, type UnifiedApp, getAppPlaygroundUrl } from "@/app/interfaces/unified-app";

interface TopNavAppSwitcherProps {
    app: ParsedAppId | undefined;
    viewMode: boolean;
}

export default function TopNavAppSwitcher({ app, viewMode }: TopNavAppSwitcherProps) {
    const router = useRouter();
    const { currentTeam } = useBoundStore();

    // These hooks use useAuth() internally - only safe inside ClerkProvider
    const viewComfyAppId = app?.type === "viewcomfy" ? app.id : undefined;
    const { teamId: appTeamId } = useGetTeamByAppId({ appId: viewComfyAppId });
    const effectiveTeamId = currentTeam?.id ?? appTeamId;
    const { apps, isLoading: isLoadingApps } = useAllApps({ teamId: effectiveTeamId });

    const handleSelectApp = useCallback((app: UnifiedApp) => {
        router.push(getAppPlaygroundUrl(app), { scroll: false });
    }, [router]);

    if (!app || !app.id) {
        return null;
    }

    const showAppSwitcher = viewMode && app.id && apps && apps.length > 1;

    if (!showAppSwitcher) {
        return null;
    }

    return (
        <AppSwitcherDialog
            apps={apps}
            currentAppId={app.id}
            isLoading={isLoadingApps}
            onSelectApp={handleSelectApp}
        />
    );
}
