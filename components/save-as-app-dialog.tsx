"use client"
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone } from "@/components/ui/dropzone";
import { Save } from "lucide-react";

interface SaveAsAppDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflowData: any;
}

export function SaveAsAppDialog({ open, onOpenChange, workflowData }: SaveAsAppDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");

    const handleThumbnailChange = (file: File) => {
        setThumbnail(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setThumbnailPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert("Please enter an app name");
            return;
        }

        const app = {
            id: crypto.randomUUID(),
            name: name.trim(),
            description: description.trim(),
            thumbnail: thumbnailPreview,
            workflowData,
            createdAt: new Date().toISOString()
        };

        // Get existing apps
        const stored = localStorage.getItem('viewcomfy-apps');
        const apps = stored ? JSON.parse(stored) : [];

        // Add new app
        apps.push(app);
        localStorage.setItem('viewcomfy-apps', JSON.stringify(apps));

        // Reset form and close
        setName("");
        setDescription("");
        setThumbnail(null);
        setThumbnailPreview("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Save as App</DialogTitle>
                    <DialogDescription>
                        Create a reusable app from your workflow
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">App Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Workflow"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="What does this workflow do?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Thumbnail (optional)</Label>
                        {thumbnailPreview ? (
                            <div className="relative">
                                <img
                                    src={thumbnailPreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-md border"
                                />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setThumbnail(null);
                                        setThumbnailPreview("");
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <Dropzone
                                onChange={handleThumbnailChange}
                                fileExtensions={['png', 'jpg', 'jpeg', 'webp']}
                                className="h-32"
                                inputPlaceholder="Click or drag image here"
                            />
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save App
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
