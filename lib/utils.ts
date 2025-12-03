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