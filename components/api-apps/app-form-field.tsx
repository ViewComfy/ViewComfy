"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import type {
  AppInputFieldOutputDTO,
  AppInputTypeEnum,
  AppInputDataTypeEnum,
} from "@/src/generated";
import { AppsService } from "@/src/generated";
import { Trash2, Loader2, X, Info, Dices } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getComfyUIRandomSeed } from "@/lib/utils";
import {
  getFileExtensions,
  isMediaDataType,
  isMediaArrayDataType,
  getBaseMediaType,
} from "@/lib/file-extensions";

interface AppFormFieldProps {
  field: ControllerRenderProps;
  inputDef: AppInputFieldOutputDTO;
  appId: number;
  className?: string;
}

/**
 * Builds tooltip text from description and field constraints (min, max, default).
 */
function buildTooltipText(inputDef: AppInputFieldOutputDTO): string | null {
  if (!inputDef.description) return null;

  const parts: string[] = [inputDef.description];
  const constraints: string[] = [];

  if (inputDef.minValue !== null && inputDef.minValue !== undefined) {
    constraints.push(`Min: ${inputDef.minValue}`);
  }
  if (inputDef.maxValue !== null && inputDef.maxValue !== undefined) {
    constraints.push(`Max: ${inputDef.maxValue}`);
  }
  if (inputDef.default !== null && inputDef.default !== undefined) {
    constraints.push(`Default: ${inputDef.default}`);
  }

  if (constraints.length > 0) {
    parts.push(constraints.join(" | "));
  }

  return parts.join("\n");
}

/**
 * Help tooltip icon that displays field description and constraints.
 */
function HelpTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info
          className="h-4 w-4 text-muted-foreground ml-1 inline cursor-help"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </TooltipTrigger>
      <TooltipContent className="text-center whitespace-pre-wrap max-w-[300px]">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * File input control with dropzone and media preview.
 * Uploads files to S3 via presigned URLs and stores the public URL.
 */
function FileFieldControl({
  field,
  inputDef,
  appId,
}: {
  field: ControllerRenderProps;
  inputDef: AppInputFieldOutputDTO;
  appId: number;
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dataType = inputDef.dataType as AppInputDataTypeEnum;
  const fileExtensions = getFileExtensions(dataType);

  // Preview source: prefer local blob URL (smoother UX), fall back to S3 URL
  const previewSrc = localPreview || field.value;

  // Cleanup local blob URL on unmount or when no longer needed
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Handle file selection - upload to S3 via presigned URL
  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) {
        field.onChange(null);
        setLocalPreview(null);
        setUploadError(null);
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setIsUploading(true);
      setUploadError(null);

      try {
        // Get presigned URL from API
        const { url: presignedUrl } =
          await AppsService.getPresignedUploadUrlApiAppsAppIdUploadUrlPost(
            appId,
            { filename: file.name, contentType: file.type || "application/octet-stream" }
          );

        // Upload file directly to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        // Get public URL by stripping query params from presigned URL
        const publicUrl = presignedUrl.split("?")[0];

        // Store URL in form state (keep localPreview for smooth UX - cleaned up on unmount/remove)
        field.onChange(publicUrl);
      } catch (error) {
        console.error("Failed to upload file:", error);
        setUploadError("Failed to upload file. Please try again.");
        setLocalPreview(null);
        field.onChange(null);
      } finally {
        setIsUploading(false);
      }
    },
    [field, appId]
  );

  const handleRemove = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    field.onChange(null);
    setUploadError(null);
  }, [field, localPreview]);

  // Show preview with upload spinner overlay
  if (previewSrc) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md relative">
          {dataType === "image" && (
            <img
              src={previewSrc}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          )}
          {dataType === "video" && (
            <video className="max-w-full max-h-full object-contain" controls>
              <track default kind="captions" srcLang="en" src="" />
              <source src={previewSrc} />
            </video>
          )}
          {dataType === "audio" && <audio src={previewSrc} controls />}

          {/* Upload spinner overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-md">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="mt-2 text-sm text-muted-foreground">
                Uploading...
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border text-muted-foreground"
          onClick={handleRemove}
          disabled={isUploading}
        >
          <Trash2 className="size-4 mr-2" />
          Remove {dataType}
        </Button>
      </div>
    );
  }

  // Show dropzone when no file
  return (
    <div className="space-y-2">
      <Dropzone
        onChange={handleFileSelect}
        fileExtensions={fileExtensions}
        className="form-dropzone"
        inputPlaceholder={`Drop ${dataType} file here or click to upload`}
      />
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}
    </div>
  );
}

/** Represents a file being uploaded or already uploaded */
interface UploadingFile {
  id: string;
  localPreview: string;
  s3Url: string | null;
  isUploading: boolean;
  error: string | null;
}

/**
 * File array input control with dropzone and horizontal carousel.
 * Always shows dropzone, displays uploaded files in a scrollable carousel below.
 */
function FileArrayFieldControl({
  field,
  inputDef,
  appId,
}: {
  field: ControllerRenderProps;
  inputDef: AppInputFieldOutputDTO;
  appId: number;
}) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Track whether we've initialized from field.value to prevent re-initialization
  // when user removes all files
  const hasInitializedRef = React.useRef(false);

  const dataType = inputDef.dataType as AppInputDataTypeEnum;
  const baseMediaType = getBaseMediaType(dataType) || "image";
  const fileExtensions = getFileExtensions(dataType);
  const minFiles = inputDef.minValue ?? 0;
  const maxFiles = inputDef.maxValue ?? Infinity;

  // Sync files state with field value on mount (for existing values)
  // Only run once on mount to prevent re-initialization when user removes files
  useEffect(() => {
    if (hasInitializedRef.current) return;

    const currentUrls = Array.isArray(field.value) ? field.value : [];
    if (currentUrls.length > 0) {
      const existingFiles: UploadingFile[] = currentUrls.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        localPreview: url,
        s3Url: url,
        isUploading: false,
        error: null,
      }));
      setFiles(existingFiles);
    }
    hasInitializedRef.current = true;
  }, [field.value]);

  // Sync form field value when files change
  useEffect(() => {
    const urls = files
      .filter((f) => f.s3Url !== null)
      .map((f) => f.s3Url as string);
    const currentValue = Array.isArray(field.value) ? field.value : [];
    // Only update if the URLs have actually changed
    if (JSON.stringify(urls) !== JSON.stringify(currentValue)) {
      field.onChange(urls);
    }
  }, [files, field]);

  // Handle file selection - upload to S3 via presigned URL
  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) return;

      // Check max limit
      const currentCount = files.filter((f) => f.s3Url !== null || f.isUploading).length;
      if (currentCount >= maxFiles) {
        setUploadError(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const objectUrl = URL.createObjectURL(file);

      // Add file to list with uploading state
      const newFile: UploadingFile = {
        id: fileId,
        localPreview: objectUrl,
        s3Url: null,
        isUploading: true,
        error: null,
      };

      setFiles((prev) => [...prev, newFile]);
      setUploadError(null);

      try {
        // Get presigned URL from API
        const { url: presignedUrl } =
          await AppsService.getPresignedUploadUrlApiAppsAppIdUploadUrlPost(appId, {
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          });

        // Upload file directly to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        // Get public URL by stripping query params from presigned URL
        const publicUrl = presignedUrl.split("?")[0];

        // Update file with S3 URL
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, s3Url: publicUrl, isUploading: false } : f
          )
        );
      } catch (error) {
        console.error("Failed to upload file:", error);
        // Update file with error
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileId
              ? { ...f, isUploading: false, error: "Upload failed" }
              : f
          );
          return updated;
        });
      }
    },
    [appId, files, maxFiles]
  );

  // Remove a file from the list
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.localPreview && !fileToRemove.s3Url) {
        URL.revokeObjectURL(fileToRemove.localPreview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.localPreview && !f.s3Url) {
          URL.revokeObjectURL(f.localPreview);
        }
      });
    };
  }, [files]);

  const uploadedCount = files.filter((f) => f.s3Url !== null).length;
  const canAddMore = uploadedCount < maxFiles;

  return (
    <div className="space-y-3 w-full min-w-0 overflow-hidden">
      {/* Dropzone - always visible if can add more */}
      {canAddMore && (
        <Dropzone
          onChange={handleFileSelect}
          fileExtensions={fileExtensions}
          className="form-dropzone"
          inputPlaceholder={`Drop ${baseMediaType} file here or click to upload (${uploadedCount}/${maxFiles === Infinity ? "∞" : maxFiles})`}
        />
      )}

      {/* Upload error */}
      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

      {/* File count indicator */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {uploadedCount} of {maxFiles === Infinity ? "unlimited" : maxFiles} file(s)
          {minFiles > 0 && ` (minimum: ${minFiles})`}
        </p>
      )}

      {/* Carousel */}
      {files.length > 0 && (
        <div
          className="rounded-md border"
          style={{
            contain: 'inline-size',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          <div className="flex gap-3 p-3 w-max">
            {files.map((file) => (
            <div
              key={file.id}
              className="relative shrink-0 w-32 h-32 rounded-md border overflow-hidden group"
            >
              {/* Preview */}
              {baseMediaType === "image" && (
                <img
                  src={file.localPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              {baseMediaType === "video" && (
                <video
                  src={file.localPreview}
                  className="w-full h-full object-cover"
                />
              )}
              {baseMediaType === "audio" && (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">Audio</span>
                </div>
              )}

              {/* Upload spinner overlay */}
              {file.isUploading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="mt-1 text-xs text-muted-foreground">
                    Uploading...
                  </span>
                </div>
              )}

              {/* Error overlay */}
              {file.error && (
                <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                  <span className="text-xs text-destructive-foreground">
                    {file.error}
                  </span>
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveFile(file.id)}
                disabled={file.isUploading}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Select input control that defaults to the first option.
 */
function SelectFieldControl({
  field,
  inputDef,
}: {
  field: ControllerRenderProps;
  inputDef: AppInputFieldOutputDTO;
}) {
  const validOptions = (inputDef.options ?? []).filter(
    (option: string) => option && option.trim() !== ""
  );
  const defaultValue = validOptions[0] ?? "";

  // Set the default value on mount if no value is set
  useEffect(() => {
    if (!field.value && defaultValue) {
      field.onChange(defaultValue);
    }
  }, [field, defaultValue]);

  return (
    <Select
      value={field.value || defaultValue}
      onValueChange={field.onChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={inputDef.description || "Select an option"} />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((option: string) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Renders the appropriate input control based on the inputType.
 */
function FieldControl({
  field,
  inputDef,
  appId,
}: {
  field: ControllerRenderProps;
  inputDef: AppInputFieldOutputDTO;
  appId: number;
}) {
  const inputType = inputDef.inputType as AppInputTypeEnum;
  const dataType = inputDef.dataType as AppInputDataTypeEnum;

  // Check for media array types first
  if (isMediaArrayDataType(dataType)) {
    return <FileArrayFieldControl field={field} inputDef={inputDef} appId={appId} />;
  }

  // Check for single media types
  if (isMediaDataType(dataType)) {
    return <FileFieldControl field={field} inputDef={inputDef} appId={appId} />;
  }

  switch (inputType) {
    case "text":
      return (
        <Input
          {...field}
          type="text"
          placeholder={inputDef.description}
          value={field.value ?? ""}
        />
      );

    case "textarea":
      return (
        <Textarea
          {...field}
          placeholder={inputDef.description}
          value={field.value ?? ""}
          rows={4}
        />
      );

    case "number": {
      const isSeedField = inputDef.label?.toLowerCase().includes("seed");
      return (
        <div className="flex items-center gap-2">
          <Input
            {...field}
            type="number"
            min={inputDef.minValue ?? undefined}
            max={inputDef.maxValue ?? undefined}
            step={inputDef.step ?? 1}
            value={field.value ?? ""}
            onChange={(e) => {
              const value = e.target.valueAsNumber;
              field.onChange(Number.isNaN(value) ? undefined : value);
            }}
            className="flex-1"
          />
          {isSeedField && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const newSeed = getComfyUIRandomSeed();
                field.onChange(newSeed);
              }}
              className="shrink-0"
            >
              <Dices className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    case "range":
      return (
        <div className="flex items-center gap-4">
          <Slider
            min={inputDef.minValue ?? 0}
            max={inputDef.maxValue ?? 100}
            step={inputDef.step ?? 1}
            value={[field.value ?? inputDef.minValue ?? 0]}
            onValueChange={(values) => field.onChange(values[0])}
            className="flex-1"
          />
          <span className="min-w-[3rem] text-sm text-muted-foreground text-right tabular-nums">
            {field.value ?? inputDef.minValue ?? 0}
          </span>
        </div>
      );

    case "checkbox":
      return (
        <Checkbox
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
        />
      );

    case "file":
      return <FileFieldControl field={field} inputDef={inputDef} appId={appId} />;

    case "select":
      return <SelectFieldControl field={field} inputDef={inputDef} />;

    default:
      // Fallback to text input
      return (
        <Input
          {...field}
          type="text"
          placeholder={inputDef.description}
          value={field.value ?? ""}
        />
      );
  }
}

/**
 * Full form field component including label, control, and error message.
 * Description is shown as a help tooltip next to the label.
 */
export function AppFormField({
  field,
  inputDef,
  appId,
  className,
}: AppFormFieldProps) {
  const isCheckbox = inputDef.inputType === "checkbox";
  const dataType = inputDef.dataType as AppInputDataTypeEnum;
  const isFileArray = isMediaArrayDataType(dataType);
  const tooltipText = buildTooltipText(inputDef);

  if (isCheckbox) {
    // Checkbox has a different layout - label to the right
    return (
      <FormItem
        className={cn(
          "flex flex-row items-start space-x-3 space-y-0",
          className
        )}
      >
        <FormControl>
          <FieldControl field={field} inputDef={inputDef} appId={appId} />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel>
            {inputDef.label}
            {inputDef.required && (
              <span className="text-destructive ml-1">*</span>
            )}
            {tooltipText && <HelpTooltip text={tooltipText} />}
          </FormLabel>
        </div>
        <FormMessage />
      </FormItem>
    );
  }

  return (
    <FormItem className={cn(isFileArray && "min-w-0 overflow-hidden", className)}>
      <FormLabel>
        {inputDef.label}
        {inputDef.required && <span className="text-destructive ml-1">*</span>}
        {tooltipText && <HelpTooltip text={tooltipText} />}
      </FormLabel>
      <FormControl>
        <FieldControl field={field} inputDef={inputDef} appId={appId} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

AppFormField.displayName = "AppFormField";
