import { ReactNode } from "react";
import { ComparisonCheckbox } from "./comparison-checkbox";

interface SelectableImageProps {
    imageUrl: string;
    children: ReactNode;
    className?: string;
}

export function SelectableImage({ imageUrl, children, className = "relative" }: SelectableImageProps) {
    return (
        <div className={className}>
            {children}
            <ComparisonCheckbox imageUrl={imageUrl} />
        </div>
    );
}
