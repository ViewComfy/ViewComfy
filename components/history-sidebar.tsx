"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { History, Filter, ChevronRight, Check, Copy, FileType, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
} from "@/components/ui/collapsible"
import BlurFade from "@/components/ui/blur-fade"
import { cn, fromSecondsToTime } from "@/lib/utils"
import WorkflowSwitcher from "@/components/workflow-switchter";
import { type IViewComfy, useViewComfy } from "@/app/providers/view-comfy-provider";
import DatePickerWithRange from "./ui/date-picker-with-range"
import { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"
import { useWorkflowHistory } from "@/hooks/use-data"
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { default as NextImage } from "next/image"
import { Play } from "lucide-react"
import { ChevronLeft } from "lucide-react"
import { IWorkflowHistoryModel, IWorkflowHistoryFileModel } from "@/app/interfaces/workflow-history"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "./ui/skeleton"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

interface HistorySidebarProps {
    open: boolean
    setOpen: (open: boolean) => void
    className?: string
}

export function HistorySidebar({ open, setOpen, className }: HistorySidebarProps) {
    const userManagement = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

    // If user management is disabled, don't render the history sidebar
    if (!userManagement) {
        return null;
    }

    return <HistorySidebarContent open={open} setOpen={setOpen} className={className} />;
}

export function HistorySidebarContent({ open, setOpen, className }: HistorySidebarProps) {
    const [showFilters, setShowFilters] = useState(true);
    const { viewComfyState } = useViewComfy();
    const [currentViewComfySwitcher, setCurrentViewComfySwitcher] = useState<IViewComfy>(viewComfyState.viewComfys[0]);
    const [successWorkflows, setSuccessWorkflows] = useState<IWorkflowHistoryModel[]>([]);
    const today = new Date();
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(today, 1),
        to: today,
    });

    const {
        workflowHistory,
        isLoading: isLoadingWorkflowHistory,
        isError,
    } = useWorkflowHistory({
        apiEndpoint: currentViewComfySwitcher.viewComfyJSON.viewcomfyEndpoint || "",
        startDate: date?.from,
        endDate: date?.to,
    });

    useEffect(() => {
        if (!workflowHistory) {
            return;
        }
        setSuccessWorkflows(workflowHistory.filter(w => w.status === "success"))
    }, [workflowHistory])

    if (!open) {
        return null;
    }

    if (!viewComfyState.currentViewComfy) {
        return null;
    }


    const getTotalSize = (workflowHistory: IWorkflowHistoryModel) => {
        if (!workflowHistory.outputs) {
            return 0;
        }
        const sizeInBytes = workflowHistory.outputs.reduce((acc, blob) => acc + blob.size, 0);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB.toFixed(2);
    }

    const copyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        toast({
            duration: 2000,
            description: "Prompt copied to clipboard",
            action: (
                <ToastAction altText="Try again" onClick={() => { }}>
                    <Check className="text-green-500" />
                </ToastAction>
            ),
        });
    };

    return (
        <div className={cn("h-full w-[340px] sm:w-[340px] bg-background border-l flex flex-col", className)}>
            <div className="border-b">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <History className="h-5 w-5" />
                        <span className="font-semibold">Generation History</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-y-hidden">
                <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                    <CollapsibleContent className="space-y-4 p-4 border-b">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={currentViewComfySwitcher} onSelectChange={setCurrentViewComfySwitcher} />
                            </div>
                            <DatePickerWithRange
                                dateRange={date}
                                setDate={setDate}
                                disabled={false}
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                <ScrollArea className="flex-1 p-4">
                    {isLoadingWorkflowHistory ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col space-y-3">
                                <Skeleton className="h-[125px] w-[250px] rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[250px]" />
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <Skeleton className="h-[125px] w-[250px] rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[250px]" />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <Skeleton className="h-[125px] w-[250px] rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[250px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : successWorkflows && successWorkflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <History className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No history found</h3>
                            <p className="text-sm text-muted-foreground">
                                Your generation history will appear here
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <History className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Error loading history</h3>
                            <p className="text-sm text-muted-foreground">
                                Please try again later
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 mt-2">
                                        {successWorkflows?.map(
                                (workflowHistory: IWorkflowHistoryModel) => (
                                    <div key={workflowHistory.id} >
                                        <div className="flex flex-col items-center justify-center">
                                            <BlurFade key={workflowHistory.id + "blur-fade"} delay={0.23} inView>
                                                {workflowHistory.outputs && <BlobPreview key={workflowHistory.id + "blob-preview"}
                                                    outputs={workflowHistory.outputs}
                                                />}
                                            </BlurFade>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Total size: {getTotalSize(workflowHistory)} MB
                                            -
                                            Prompt: <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={() =>
                                                    copyPrompt(
                                                        JSON.stringify(
                                                            workflowHistory.prompt,
                                                        ),
                                                    )
                                                }
                                            >
                                                <TooltipProvider
                                                    delayDuration={100}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger className="flex justify-self-center gap-1">
                                                            <Copy className="h-4 w-4" />
                                                        </TooltipTrigger>

                                                        <TooltipContent className="text-center">
                                                            <p>
                                                                Copy the
                                                                prompt to the
                                                                clipboard
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Button>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            execution time: {fromSecondsToTime(
                                                workflowHistory.executionTimeSeconds,
                                            )} - <span className="text-sm text-muted-foreground">
                                                {" "}{format(
                                                    workflowHistory.createdAt.toLocaleString(),
                                                    "dd/M/yyyy HH:mm:ss",
                                                )}
                                            </span>
                                        </div>

                                    </div>
                                ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}

function BlobPreview({
    outputs,
}: {
    outputs: IWorkflowHistoryFileModel[] | null;
}) {
    const [blobIndex, setBlobIndex] = useState(0);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
    const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);
    const backgroundColor = "black";
    const scaleUp = false;
    const zoomFactor = 8;

    const imageScale = useMemo((): number => {
        if (
            containerWidth === 0 ||
            containerHeight === 0 ||
            imageNaturalWidth === 0 ||
            imageNaturalHeight === 0
        )
            return 0;
        const scale = Math.min(
            containerWidth / imageNaturalWidth,
            containerHeight / imageNaturalHeight,
        );
        return scaleUp ? scale : Math.max(scale, 1);
    }, [
        scaleUp,
        containerWidth,
        containerHeight,
        imageNaturalWidth,
        imageNaturalHeight,
    ]);

    const isImageByMimeType = (file: IWorkflowHistoryFileModel) => {
        return file.contentType.startsWith(
            "image/",
        ) && file.contentType !== "image/vnd.adobe.photoshop"
    };

    const handleResize = useCallback(() => {
        if (container !== null) {
            const rect = container.getBoundingClientRect();
            setContainerWidth(rect.width);
            setContainerHeight(rect.height);
        } else {
            setContainerWidth(0);
            setContainerHeight(0);
        }
    }, [container]);

    useEffect(() => {
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [handleResize]);

    const handleImageOnLoad = (image: HTMLImageElement) => {
        setImageNaturalWidth(image.naturalWidth);
        setImageNaturalHeight(image.naturalHeight);
    };

    useEffect(() => {
        if (!outputs || !outputs[blobIndex]) {
            return;
        }

        if (!isImageByMimeType(outputs[blobIndex])) {
            return;
        }

        const image = new Image();
        image.onload = () => handleImageOnLoad(image);
        image.src = outputs[blobIndex].filepath;
    }, [blobIndex, outputs]);


    if (!outputs || outputs.length === 0) {
        return null;
    }

    const previewBlob = outputs[0];

    const goToPrevious = () => {
        setBlobIndex(prev => (prev > 0 ? prev - 1 : outputs.length - 1));
    };

    const goToNext = () => {
        setBlobIndex(prev => (prev < outputs.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="relative inline-block">
            <Dialog
                onOpenChange={() => {
                    setBlobIndex(0);
                }}
            >
                <DialogTrigger asChild>
                    <div key={previewBlob.id + "blob-preview-trigger"}>
                        {previewBlob.contentType.startsWith("image/") && previewBlob.contentType !== "image/vnd.adobe.photoshop" && (
                            <NextImage
                                src={previewBlob.filepath}
                                alt={"Output image"}
                                unoptimized
                                width={140}
                                height={140}
                                className="rounded-md transition-all hover:scale-105 hover:cursor-pointer"
                            />
                        )}
                        {previewBlob.contentType.startsWith("video/") && (
                            <video
                                key={previewBlob.id}
                                className="object-contain rounded-md hover:cursor-pointer transition-all hover:scale-105"
                                width={100}
                                height={100}
                            >
                                <track
                                    default
                                    kind="captions"
                                    srcLang="en"
                                    src="SUBTITLE_PATH"
                                />
                                <source src={previewBlob.filepath} />
                            </video>
                        )}
                        {previewBlob.contentType.startsWith("audio/") && (
                            <Button variant="outline">
                                <Play className="h-4 w-4" />
                            </Button>
                        )}
                        {(previewBlob.contentType === "image/vnd.adobe.photoshop") && (
                            <Button variant="outline">
                                <File className="h-10 w-10" />
                            </Button>
                        )}
                        {(previewBlob.contentType.startsWith("text/")) && (
                            <Button variant="outline">
                                <FileType className="h-10 w-10" />
                            </Button>
                        )}
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                    <div className="relative">
                        {isImageByMimeType(outputs[blobIndex]) && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor,
                                    cursor: "zoom-in"
                                }}
                                ref={(el: HTMLDivElement | null) => setContainer(el)}
                            >
                                <TransformWrapper
                                    key={`${containerWidth}x${containerHeight}`}
                                    initialScale={imageScale}
                                    minScale={imageScale}
                                    maxScale={imageScale * zoomFactor}
                                    centerOnInit
                                >
                                    <TransformComponent
                                        wrapperStyle={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    >
                                        <img
                                            key={outputs[blobIndex].id}
                                            src={outputs[blobIndex].filepath}
                                            alt={`${outputs[blobIndex].filename}`}
                                            className="max-h-[85vh] w-auto object-contain rounded-md"
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                        )}
                        {outputs[blobIndex].contentType.startsWith(
                            "video/",
                        ) && (
                                <video
                                    key={outputs[blobIndex].id}
                                    className="max-h-[85vh] w-auto object-contain rounded-md"
                                    controls
                                >
                                    <track
                                        default
                                        kind="captions"
                                        srcLang="en"
                                        src="SUBTITLE_PATH"
                                    />
                                    <source src={outputs[blobIndex].filepath} />
                                </video>
                            )}
                        {outputs[blobIndex].contentType.startsWith(
                            "audio/",
                        ) && (
                                <div className="m-20">
                                    <audio
                                        key={outputs[blobIndex].id}
                                        controls
                                    >
                                        <source src={outputs[blobIndex].filepath} />
                                    </audio>
                                </div>
                            )}
                        {(outputs[blobIndex].contentType === "image/vnd.adobe.photoshop") && (
                            <div className="m-20">
                                <File className="h-20 w-20" />
                            </div>
                        )}
                        {(outputs[blobIndex].contentType.startsWith("text/")) && (
                            <div className="m-20">
                                <FileType className="h-20 w-20" />
                            </div>
                        )}
                        {outputs.length > 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-accent border border-border rounded-full p-2 shadow-md z-10"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-accent border border-border rounded-full p-2 shadow-md z-10"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {outputs.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
                                {blobIndex + 1} / {outputs.length}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-transparent">
                        <Button
                            className="w-full"
                            onClick={() => {
                                const link = document.createElement("a");
                                link.href = outputs[blobIndex].filepath;
                                link.download = `${outputs[blobIndex].filepath.split("/").pop()}`;
                                link.click();
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Badge className="absolute -bottom-1 -right-1 px-2 py-1 min-w-[20px] h-5 flex items-center justify-center z-10">
                {outputs.length}
            </Badge>
        </div>
    );
}

export function ImageDialog({ blob }: { blob: IWorkflowHistoryFileModel }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <NextImage
                    src={blob.filepath}
                    alt={"Output image"}
                    unoptimized
                    width={100}
                    height={100}
                    className="rounded-md transition-all hover:scale-105 hover:cursor-pointer"
                />
            </DialogTrigger>
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-white [&>button]:border [&>button]:border-gray-300 [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div className="inline-block">
                    <img
                        key={blob.id}
                        src={blob.filepath}
                        alt={`${blob.filepath}`}
                        className="max-h-[85vh] w-auto object-contain rounded-md"
                    />
                </div>
                <DialogFooter className="bg-transparent">
                    <Button
                        className="w-full"
                        onClick={() => {
                            const link = document.createElement("a");
                            link.href = blob.filepath;
                            link.download = `${blob.filepath.split("/").pop()}`;
                            link.click();
                        }}
                    >
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function VideoDialog({ blob }: { blob: IWorkflowHistoryFileModel }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <video
                    key={blob.id}
                    className="object-contain rounded-md hover:cursor-pointer transition-all hover:scale-105"
                    width={100}
                    height={100}
                >
                    <track
                        default
                        kind="captions"
                        srcLang="en"
                        src="SUBTITLE_PATH"
                    />
                    <source src={blob.filepath} />
                </video>
            </DialogTrigger>
            <DialogContent className="max-w-fit max-h-[90vh] border-0 p-0 bg-transparent [&>button]:bg-white [&>button]:border [&>button]:border-gray-300 [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <video
                    key={blob.id}
                    className="max-h-[85vh] w-auto object-contain rounded-md"
                    controls
                >
                    <track
                        default
                        kind="captions"
                        srcLang="en"
                        src="SUBTITLE_PATH"
                    />
                    <source src={blob.filepath} />
                </video>
            </DialogContent>
        </Dialog>
    );
}
