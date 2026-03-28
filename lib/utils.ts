import { IViewComfyJSON, IViewComfyState } from "@/app/providers/view-comfy-provider";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

const MAX_UPLOAD_SIZE = 1024 * 1024 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ["application/json"];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getComfyUIRandomSeed() {
  const minCeiled = Math.ceil(0);
  const maxFloored = Math.floor(2 ** 32);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

export function fromSecondsToTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  let result = `${minutes}m ${remainingSeconds}s`
  if (hours > 0) {
    result = `${hours}h ${result}`
  }
  return result;
}

interface IInputJsonFileValidator {
  required?: boolean;
  errorMsg?: string;
}

export const inputJsonFileValidator = (
  params: IInputJsonFileValidator = {
    required: false,
    errorMsg: "This input is required",
  },
) => {
  const { required, errorMsg } = params;

  // Create the base file validation
  const fileValidation = z
    .instanceof(File, { message: errorMsg })
    .refine(
      file => file.size <= MAX_UPLOAD_SIZE,
      "File size must be less than 10MB",
    )
    .refine(
      file => ACCEPTED_FILE_TYPES.includes(file.type),
      "File must be a json",
    );

  // If not required, allow null or undefined values
  return required
    ? fileValidation
    : z.union([fileValidation, z.null(), z.undefined()]);
};

export const buildViewComfyJSON = ({ viewComfyState }: { viewComfyState: IViewComfyState }): IViewComfyJSON => {
  const workflows = viewComfyState.viewComfys.map((item) => {
    return {
      viewComfyJSON: { ...item.viewComfyJSON },
      workflowApiJSON: { ...item.workflowApiJSON }
    }
  });

  return {
    "file_type": "view_comfy",
    "file_version": "1.0.0",
    "version": "0.0.1",
    "appTitle": viewComfyState.appTitle || "",
    "appImg": viewComfyState.appImg || "",
    workflows
  };
}

// LocalStorage key for saving editor workflows
const EDITOR_WORKFLOWS_STORAGE_KEY = "viewcomfy_editor_workflows";

/**
 * Save workflows to localStorage in view_comfy.json format
 * This ensures workflows persist across page refreshes and browser sessions
 */
export const saveWorkflowsToLocalStorage = (viewComfyState: IViewComfyState): void => {
  try {
    // Only save if there are workflows to save
    if (viewComfyState.viewComfys.length === 0 && !viewComfyState.viewComfyDraft) {
      // Clear storage if no workflows exist
      if (typeof window !== "undefined") {
        localStorage.removeItem(EDITOR_WORKFLOWS_STORAGE_KEY);
      }
      return;
    }

    // Build the view_comfy.json format
    const viewComfyJSON = buildViewComfyJSON({ viewComfyState });
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(EDITOR_WORKFLOWS_STORAGE_KEY, JSON.stringify(viewComfyJSON));
    }
  } catch (error) {
    // Silently fail if localStorage is unavailable or quota exceeded
    console.error("Failed to save workflows to localStorage:", error);
  }
};

/**
 * Load workflows from localStorage in view_comfy.json format
 * Returns null if no saved workflows exist or if there's an error
 */
export const loadWorkflowsFromLocalStorage = (): IViewComfyJSON | null => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const savedData = localStorage.getItem(EDITOR_WORKFLOWS_STORAGE_KEY);
    if (!savedData) {
      return null;
    }

    const parsed = JSON.parse(savedData) as IViewComfyJSON;
    
    // Validate the structure
    if (parsed.file_type === "view_comfy" && Array.isArray(parsed.workflows)) {
      return parsed;
    }

    return null;
  } catch (error) {
    // Silently fail if localStorage is unavailable or data is corrupted
    console.error("Failed to load workflows from localStorage:", error);
    return null;
  }
};

/**
 * Clear workflows from localStorage
 * This removes all saved workflow data from the browser's local storage
 */
export const clearWorkflowsFromLocalStorage = (): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(EDITOR_WORKFLOWS_STORAGE_KEY);
    }
  } catch (error) {
    // Silently fail if localStorage is unavailable
    console.error("Failed to clear workflows from localStorage:", error);
  }
};