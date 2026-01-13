"use client"

import * as React from "react"
import { AppWindow, ChevronDown, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppCardBase } from "@/components/apps/app-card-base"

interface AppSwitcherDialogProps {
    apps: IViewComfyApp[] | null
    currentAppId: string | null
    isLoading: boolean
    onSelectApp: (app: IViewComfyApp) => void
}

export function AppSwitcherDialog({
    apps,
    currentAppId,
    isLoading,
    onSelectApp,
}: AppSwitcherDialogProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelectApp = (app: IViewComfyApp) => {
        onSelectApp(app)
        setOpen(false)
    }

    const currentApp = apps?.find(app => app.appId === currentAppId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    aria-label="Switch app"
                >
                    <AppWindow className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">
                        {currentApp?.name || "Select App"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Switch App</DialogTitle>
                    <DialogDescription>
                        Select a different app to use. Your current session stays active.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Your generated outputs will be preserved when you switch apps.
                    </AlertDescription>
                </Alert>

                <ScrollArea className="h-[60vh] pr-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-[260px] w-full rounded-lg" />
                            ))}
                        </div>
                    ) : apps && apps.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {apps.map((app) => (
                                <AppCardBase
                                    key={app.appId}
                                    app={app}
                                    isSelected={app.appId === currentAppId}
                                    showSelectedIndicator={true}
                                    buttonText={app.appId === currentAppId ? "Selected" : "Select App"}
                                    onButtonClick={() => handleSelectApp(app)}
                                    onCardClick={() => handleSelectApp(app)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <AppWindow className="h-12 w-12 mb-4 opacity-50" />
                            <p>No apps available</p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

AppSwitcherDialog.displayName = "AppSwitcherDialog"
