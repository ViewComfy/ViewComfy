"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type UnifiedApp, getAppDisplayInfo } from "@/app/interfaces/unified-app"

interface AppCardBaseProps {
    app: UnifiedApp
    className?: string
    isSelected?: boolean
    showSelectedIndicator?: boolean
    buttonText: string
    onButtonClick: () => void
    onCardClick?: () => void
}

export const AppCardBase = React.forwardRef<HTMLDivElement, AppCardBaseProps>(
    ({
        app,
        className,
        isSelected = false,
        showSelectedIndicator = false,
        buttonText,
        onButtonClick,
        onCardClick,
    }, ref) => {
        const displayInfo = getAppDisplayInfo(app)

        return (
            <Card
                ref={ref}
                className={cn(
                    "w-full h-[270px] flex flex-col transition-all",
                    onCardClick && "cursor-pointer hover:shadow-md hover:border-primary/50",
                    isSelected && showSelectedIndicator && "border-primary ring-2 ring-primary/20",
                    className
                )}
                onClick={onCardClick}
            >
                <CardHeader className="p-3 pb-2 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-1">{displayInfo.name}</CardTitle>
                        {isSelected && showSelectedIndicator && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                    </div>
                </CardHeader>
                <div className="relative w-full h-[140px] flex-shrink-0 px-3">
                    <img
                        src={displayInfo.imageUrl}
                        alt={displayInfo.name}
                        className="w-full h-full object-contain rounded-lg"
                    />
                </div>
                <CardContent className="flex-1 p-3 pt-2 min-h-0">
                    <CardDescription className="text-xs line-clamp-2">
                        {displayInfo.description || "No description"}
                    </CardDescription>
                </CardContent>
                <CardFooter className="p-3 pt-6 flex-shrink-0">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            onButtonClick()
                        }}
                        className="w-full h-8 text-sm"
                    >
                        {buttonText}
                    </Button>
                </CardFooter>
            </Card>
        )
    }
)

AppCardBase.displayName = "AppCardBase"
