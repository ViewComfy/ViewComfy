import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { useImageComparison } from "./image-comparison-provider";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// Dynamically import web component to avoid hydration issues
const ImgComparisonSlider = dynamic(
    () => import("@img-comparison-slider/react").then((mod) => mod.ImgComparisonSlider),
    { ssr: false }
);

export function ComparisonDialog() {
    const { selectedImages, handleComparisonDialogClose } = useImageComparison();
    const [isOpen, setIsOpen] = useState(false);
    const [imageSize, setImagesize] = useState(730);
    const [xCoordinate, setXCoordinate] = useState(0);
    const [yCoordinate, setYCoordinate] = useState(0);

    useEffect(() => {
        if (selectedImages.length === 2) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [selectedImages]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleComparisonDialogClose();
        }
        setIsOpen(open);
    };

    const handleZoomIn = useCallback(() => {
        setImagesize((prev) => prev + 100);
    }, []);
    
    const handleZoomOut = useCallback(() => {
        const newImageSize = Math.max(730, imageSize - 100);
        
        setImagesize(newImageSize);
        
        setXCoordinate((prev) => {
            const maxX = 730 - newImageSize;
            return Math.max(0, Math.min(prev, maxX));
        });
        
        setYCoordinate((prev) => {
            const maxY = 730 - newImageSize;
            return Math.max(0, Math.min(prev, maxY));
        });
    }, [imageSize]);

    const handleMoveUp = useCallback(() => {
        setYCoordinate((prev) => {
            const minY = 730 - imageSize;
            return Math.max(minY, prev - 10);
        });
    }, [imageSize]);
    
    const handleMoveDown = useCallback(() => {
        setYCoordinate((prev) => {
            const maxY = 0;
            return Math.min(maxY, prev + 10);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSize]);
    
    const handleMoveLeft = useCallback(() => {
        setXCoordinate((prev) => {
            const minX = 730 - imageSize;
            return Math.max(minX, prev - 10);
        });
    }, [imageSize]);
    
    const handleMoveRight = useCallback(() => {
        setXCoordinate((prev) => {
            const maxX = 0;
            return Math.min(maxX, prev + 10);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSize]);


    if (selectedImages.length !== 2) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-fit border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div 
                    className="inline-block w-[90vw] h-[90vh] max-w-[730px] max-h-[730px] overflow-hidden relative"
                >
                    <ImgComparisonSlider 
                        className=""
                        style={{ 
                            width: `${imageSize}px`,
                            height: `${imageSize}px`,
                            top: `${yCoordinate}px`,
                            left: `${xCoordinate}px`,
                            position: 'absolute'
                        }}
                    >
                        <img slot="first" alt="first image" width={imageSize} height={imageSize} src={selectedImages[0]} className={`object-cover w-[${imageSize}px] h-[${imageSize}px] absolute top-[${yCoordinate}px] left-[${xCoordinate}px]`} />
                        <img slot="second" alt="second image" width={imageSize} height={imageSize} src={selectedImages[1]} className={`object-cover w-[${imageSize}px] h-[${imageSize}px] absolute top-[${yCoordinate}px] left-[${xCoordinate}px]`} />
                    </ImgComparisonSlider>
                    <DialogOverlay className=" bg-background/10 rounded-md top-[calc(100%-100px)] left-[0%] h-25 w-60" >
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-2 right-2 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleZoomIn();
                            }}
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-2 right-13 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleZoomOut();
                            }}
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-13 right-36 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveUp();
                            }}
                            aria-label="Move up"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-2 right-36 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveDown();
                            }}
                            aria-label="Move down"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-2 right-47 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLeft();
                            }}
                            aria-label="Move left"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute bottom-2 right-25 pointer-events-auto bg-background/80 hover:bg-background"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRight();
                            }}
                            aria-label="Move right"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </DialogOverlay>
                </div>
            </DialogContent>
        </Dialog>
    );
}
