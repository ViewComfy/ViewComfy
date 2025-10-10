import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImageComparisonContextType {
    selectedImages: string[];
    isCompareModeActive: boolean;
    handleImageSelection: (imageUrl: string) => void;
    handleToggleCompareMode: () => void;
    handleClearSelectedImages: () => void;
    handleComparisonDialogClose: () => void;
}

const ImageComparisonContext = createContext<ImageComparisonContextType | undefined>(undefined);

export function ImageComparisonProvider({ children }: { children: ReactNode }) {
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isCompareModeActive, setIsCompareModeActive] = useState(false);

    const handleImageSelection = (imageUrl: string) => {
        setSelectedImages((prevSelected) => {
            if (prevSelected.includes(imageUrl)) {
                return prevSelected.filter((url) => url !== imageUrl);
            } else if (prevSelected.length < 2) {
                return [...prevSelected, imageUrl];
            }
            return prevSelected; // Do not add more than 2 images
        });
    };

    const handleClearSelectedImages = () => {
        setSelectedImages([]);
    };

    const handleToggleCompareMode = () => {
        setIsCompareModeActive(prev => {
            if (prev) {
                handleClearSelectedImages();
            }
            return !prev;
        });
    };

    const handleComparisonDialogClose = () => {
        handleClearSelectedImages();
        setIsCompareModeActive(false);
    };

    return (
        <ImageComparisonContext.Provider
            value={{
                selectedImages,
                isCompareModeActive,
                handleImageSelection,
                handleToggleCompareMode,
                handleClearSelectedImages,
                handleComparisonDialogClose,
            }}
        >
            {children}
        </ImageComparisonContext.Provider>
    );
}

export function useImageComparison() {
    const context = useContext(ImageComparisonContext);
    if (context === undefined) {
        throw new Error('useImageComparison must be used within an ImageComparisonProvider');
    }
    return context;
}
