import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import { useImageComparison } from "./image-comparison-provider";

export function ComparisonButton() {
    const { isCompareModeActive, handleToggleCompareMode } = useImageComparison();

    return (
        <Button variant="outline" size="sm" onClick={handleToggleCompareMode}>
            <Images className="h-4 w-4" />
            {isCompareModeActive ? "Cancel" : "Compare"}
        </Button>
    );
}
