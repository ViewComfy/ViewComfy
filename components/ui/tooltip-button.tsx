import React from 'react';
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipButtonProps {
    icon: React.ReactNode;
    label: string;
    tooltipContent: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onClick?: () => void;
}

export function TooltipButton({
    icon,
    label,
    tooltipContent,
    variant = "ghost",
    size = "icon",
    className = "",
    onClick,
}: TooltipButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        className={`rounded-lg ${className}`}
                        aria-label={label}
                        onClick={onClick}
                    >
                        {icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}