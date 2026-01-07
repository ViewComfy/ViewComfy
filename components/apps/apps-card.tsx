"use client"

import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app"
import { useRouter } from "next/navigation"
import { AppCardBase } from "@/components/apps/app-card-base"

export function AppCard({
    className,
    app
}: { app: IViewComfyApp, className?: string }) {
    const router = useRouter()

    const onAppButtonClick = () => {
        router.push(`/playground?appId=${app.appId}`)
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
