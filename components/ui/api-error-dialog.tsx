"use client"

import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AlertCircle, CreditCard, AlertTriangle } from "lucide-react"
import { ApiError } from "@/src/generated"

export interface ApiErrorBody {
    errorMsg: string
    errorDetails: string | null
    errorType: string
}

function isApiError(error: unknown): error is ApiError {
    return error instanceof Error && error.name === "ApiError"
}

function getErrorBody(error: ApiError): ApiErrorBody {
    const body = error.body
    return {
        errorMsg: body?.errorMsg || error.message || "An error occurred",
        errorDetails: body?.errorDetails || null,
        errorType: body?.errorType || "UnknownError",
    }
}

function isBalanceError(body: ApiErrorBody): boolean {
    return body.errorMsg.toLowerCase().includes("balance")
}

function isValidationError(body: ApiErrorBody): boolean {
    return body.errorMsg.toLowerCase().includes("validation")
}

function getErrorIcon(body: ApiErrorBody) {
    if (isBalanceError(body)) {
        return <CreditCard className="h-5 w-5 text-amber-500" />
    }
    if (isValidationError(body)) {
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
    return <AlertCircle className="h-5 w-5 text-destructive" />
}

function getErrorTitle(body: ApiErrorBody): string {
    if (isBalanceError(body)) {
        return "Insufficient Balance"
    }
    if (isValidationError(body)) {
        return "Validation Error"
    }
    return body.errorMsg
}

interface ApiErrorDialogProps {
    open: boolean
    error: unknown
    onClose: () => void
}

export function ApiErrorDialog({ open, error, onClose }: ApiErrorDialogProps) {
    const errorBody = React.useMemo(() => {
        if (!error) return null
        if (isApiError(error)) {
            return getErrorBody(error)
        }
        return null
    }, [error])

    if (!errorBody) {
        return null
    }

    const title = getErrorTitle(errorBody)
    const icon = getErrorIcon(errorBody)
    const showBalanceHint = isBalanceError(errorBody)
    const showValidationHint = isValidationError(errorBody)

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="w-full max-w-[90vw] md:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {icon}
                        <span>{title}</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 pt-2">
                            {showBalanceHint && (
                                <p className="text-sm text-foreground">
                                    {errorBody.errorMsg}
                                </p>
                            )}

                            {showValidationHint && errorBody.errorDetails && (
                                <div className="rounded-md bg-muted p-3">
                                    <p className="text-sm font-medium text-foreground mb-1">
                                        Details:
                                    </p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {errorBody.errorDetails}
                                    </p>
                                </div>
                            )}

                            {!showBalanceHint && !showValidationHint && (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        {errorBody.errorMsg}
                                    </p>
                                    {errorBody.errorDetails && (
                                        <div className="rounded-md bg-muted p-3">
                                            <p className="text-sm text-muted-foreground font-mono">
                                                {errorBody.errorDetails}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col items-start">
                    <p className={cn("text-sm text-muted-foreground w-full mb-4")}>
                        If you need help, join our&nbsp;
                        <Link
                            href="https://discord.gg/DXubrz5R7E"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                        >
                            Discord
                        </Link>
                        &nbsp;or create an issue on&nbsp;
                        <Link
                            href="https://github.com/ViewComfy/ViewComfy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                        >
                            GitHub
                        </Link>
                    </p>
                    <AlertDialogAction onClick={onClose}>
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

ApiErrorDialog.displayName = "ApiErrorDialog"
