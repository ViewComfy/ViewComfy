import { useImageComparison } from "./image-comparison-provider";

interface ComparisonCheckboxProps {
    imageUrl: string;
    className?: string;
}

export function ComparisonCheckbox({ imageUrl, className = "absolute top-2 right-2 z-10 w-[20px] h-[20px]" }: ComparisonCheckboxProps) {
    const { selectedImages, isCompareModeActive, handleImageSelection } = useImageComparison();

    if (!isCompareModeActive) {
        return null;
    }

    return (
        <input
            type="checkbox"
            className={className}
            checked={selectedImages.includes(imageUrl)}
            onChange={() => handleImageSelection(imageUrl)}
        />
    );
}
