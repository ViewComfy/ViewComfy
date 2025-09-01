import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImgComparisonSlider } from '@img-comparison-slider/react';
import { useImageComparison } from "./image-comparison-provider";

export function ComparisonDialog() {
    const { selectedImages, handleComparisonDialogClose } = useImageComparison();
    const [isOpen, setIsOpen] = useState(false);

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

    if (selectedImages.length !== 2) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-fit border-0 p-0 bg-transparent [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:p-1 [&>button]:shadow-md">
                <div className="inline-block">
                    <ImgComparisonSlider>
                        <img slot="first" alt="first image" width={730} height={730} src={selectedImages[0]} />
                        <img slot="second" alt="second image" width={730} height={730} src={selectedImages[1]} />
                    </ImgComparisonSlider>
                </div>
            </DialogContent>
        </Dialog>
    );
}
