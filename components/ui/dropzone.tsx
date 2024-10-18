import type React from 'react';
import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp } from 'lucide-react';

// Define the props expected by the Dropzone component
interface DropzoneProps {
    onChange: (file: File | null) => void;
    className?: string;
    fileExtensions?: string[];
    inputPlaceholder?: React.ReactNode;
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

    // Function to handle drag over event
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Function to handle drop event
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const { files } = e.dataTransfer;
        handleFiles(files);
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
            className={`border-2 border-dashed bg-muted hover:cursor-pointer hover:border-muted-foreground/50 w-full flex items-center justify-center ${className}`}
            {...props}
            onClick={handleButtonClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <CardContent
                className="flex flex-col items-center justify-center space-y-4 px-2 py-4 text-medium"
            >
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    {inputPlaceholder ? (
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
