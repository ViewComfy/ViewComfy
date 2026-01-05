import type React from 'react';
import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interface for drag data from output media
interface DragMediaData {
    url: string;
    filename: string;
    contentType: string;
}

// Define the props expected by the Dropzone component
interface DropzoneProps {
    onChange: (file: File | null) => void;
    className?: string;
    fileExtensions?: string[];
    inputPlaceholder?: React.ReactNode;
}

/**
 * Fetches a media URL and converts it to a File object.
 * Uses the media-proxy API for remote URLs to avoid CORS issues.
 */
async function fetchMediaAsFile(
    url: string,
    filename: string,
    contentType: string
): Promise<File> {
    // If blob URL, fetch directly; otherwise use media-proxy to avoid CORS
    const fetchUrl = url.startsWith('blob:')
        ? url
        : `/api/media-proxy?url=${encodeURIComponent(url)}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: contentType });
}

/**
 * Checks if a content type matches any of the allowed file extensions.
 */
function isContentTypeAllowed(contentType: string, fileExtensions: string[]): boolean {
    const contentTypeToExtensions: Record<string, string[]> = {
        'image/png': ['png'],
        'image/jpeg': ['jpg', 'jpeg'],
        'image/gif': ['gif'],
        'image/webp': ['webp'],
        'video/mp4': ['mp4'],
        'video/webm': ['webm'],
        'video/x-msvideo': ['avi'],
        'video/x-matroska': ['mkv'],
        'audio/mpeg': ['mp3'],
        'audio/wav': ['wav'],
        'audio/x-wav': ['wav'],
        'audio/webm': ['webm'],
        'audio/x-m4a': ['m4a'],
        'audio/mp4': ['m4a', 'm4b', 'm4p'],
        'audio/x-ms-wma': ['wma'],
    };

    const extensions = contentTypeToExtensions[contentType] || [];
    return extensions.some(ext => fileExtensions.includes(ext));
}

// Create the Dropzone component receiving props
export function Dropzone({
    onChange,
    className,
    fileExtensions,
    inputPlaceholder,
    ...props
}: DropzoneProps) {
    // Initialize state variables using the useState hook
    const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference to file input element
    const [error, setError] = useState<string | null>(null); // Error message state
    const [isLoading, setIsLoading] = useState(false); // Loading state for URL fetching
    const [isDragOver, setIsDragOver] = useState(false); // Drag over visual state

    // Function to handle drag over event
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    // Function to handle drag leave event
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    // Function to handle drop event
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false); // Reset drag over state

        // Check for custom ViewComfy media data first (internal drag from output)
        const mediaDataStr = e.dataTransfer.getData('application/x-viewcomfy-media');
        if (mediaDataStr) {
            try {
                const mediaData: DragMediaData = JSON.parse(mediaDataStr);
                await handleMediaUrl(mediaData);
                return;
            } catch (err) {
                console.error('Failed to parse drag media data:', err);
                setError('Failed to process dropped media. Please try uploading manually.');
                return;
            }
        }

        // Fall back to regular file drop
        const { files } = e.dataTransfer;
        handleFiles(files);
    };

    // Function to handle media URL drop (from output panel)
    const handleMediaUrl = async (mediaData: DragMediaData) => {
        const { url, filename, contentType } = mediaData;

        // Validate content type against allowed extensions
        if (fileExtensions && !isContentTypeAllowed(contentType, fileExtensions)) {
            setError(`Invalid file type. Expected: ${fileExtensions.join(', ')}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const file = await fetchMediaAsFile(url, filename, contentType);
            onChange(file);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch dropped media:', err);
            setError('Failed to load dropped media. Please try uploading the file manually.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle file input change event
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files) {
            handleFiles(files);
        }
    };

    // Function to handle processing of uploaded files
    const handleFiles = (files: FileList) => {
        if (files.length > 1) {
            setError("You can only upload one file at a time");
            return;
        }
        const uploadedFile = files[0];

        if (!uploadedFile) {
            setError("Something went wrong uploading your file, please try again.");
            return;
        }

        // Check file extension
        if (fileExtensions && !fileExtensions.some(fileExtension => uploadedFile.name.endsWith(fileExtension))) {
            // if (fileExtensions && !uploadedFile.name.endsWith(`${fileExtension}`)) {
            setError(`Invalid file type. Expected: ${fileExtensions.join(', ')}`);
            return;
        }

        onChange(uploadedFile); // Pass the File object directly

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setError(null); // Reset error state
    };

    // Function to simulate a click on the file input element
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    return (
        <Card
            className={cn(
                "border-2 border-dashed bg-muted hover:cursor-pointer hover:border-muted-foreground/50 w-full flex items-center justify-center transition-colors",
                isDragOver && "border-primary bg-primary/10",
                className
            )}
            {...props}
            onClick={handleButtonClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <CardContent
                className="flex flex-col items-center justify-center space-y-4 px-2 py-4 text-medium"
            >
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    {isLoading ? (
                        <div className="flex items-center">
                            <Loader2 className="size-6 mr-2 animate-spin" />
                            <span className="font-medium">Loading media...</span>
                        </div>
                    ) : inputPlaceholder ? (
                        <>
                            <span className="font-medium">{inputPlaceholder}</span>
                            <FileUp className="size-8 mt-2" />
                        </>
                    ) : (
                        <div className="flex items-center">
                            <span className="font-medium mr-2">Drag Files to Upload</span>
                            <FileUp className="size-6" />
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={`${fileExtensions}`}
                        onChange={handleFileInputChange}
                        className="hidden"
                        multiple={false}
                    />
                </div>

                {error && <span className="text-red-500">{error}</span>}
            </CardContent>
        </Card>
    );
}
