import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Define the props expected by the Dropzone component
interface DropzoneProps {
    onChange: (file: File | null) => void;
    className?: string;
    fileExtension?: string;
    inputPlaceholder?: React.ReactNode;
}

// Create the Dropzone component receiving props
export function Dropzone({
    onChange,
    className,
    fileExtension,
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
            setError(`You can only upload one file at a time`);
            return;
        }
        const uploadedFile = files[0];

        // Check file extension
        if (fileExtension && !uploadedFile.name.endsWith(`${fileExtension}`)) {
            setError(`Invalid file type. Expected: ${fileExtension}`);
            return;
        }

        onChange(uploadedFile); // Pass the File object directly

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
                className="flex flex-col items-center justify-center space-y-2 px-2 py-4 text-medium"
                
            >
                <div className="flex items-center justify-center text-muted-foreground">
                    <span className="font-medium ml-2 mr-2">{inputPlaceholder || "Drag Files to Upload or Click Here"}</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={`${fileExtension}`}
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
