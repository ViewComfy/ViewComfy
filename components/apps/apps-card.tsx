"use client"

import { useRouter } from "next/navigation"
import { AppCardBase } from "@/components/apps/app-card-base"
import { type UnifiedApp, getAppPlaygroundUrl } from "@/app/interfaces/unified-app"

export function AppCard({
    className,
    app
}: { app: UnifiedApp; className?: string }) {
    const router = useRouter()

    const onAppButtonClick = () => {
        router.push(getAppPlaygroundUrl(app))
    }

    return (
        <AppCardBase
            app={app}
            className={className}
            buttonText="Use App"
            onButtonClick={onAppButtonClick}
        />
    )
}
