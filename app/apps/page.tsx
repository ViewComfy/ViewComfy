"use client"
import { AppCard } from "@/components/apps/apps-card"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllApps } from "@/hooks/use-data";
import { useBoundStore } from "@/stores/bound-store";
import { Suspense } from 'react'
import { getAppDisplayInfo } from "@/app/interfaces/unified-app";

export default function AppsPage() {
    const { currentTeam } = useBoundStore();
    const { apps, isLoading } = useAllApps({ teamId: currentTeam?.id });

    if (isLoading || !apps) {
        return <Skeleton />
    }

    return (
        <Suspense>
            <ScrollArea className="h-full">
                <div className="container mx-auto p-6 pb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {apps.map((app) => (
                            <AppCard key={getAppDisplayInfo(app).id} app={app} />
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </Suspense>
    )
}
