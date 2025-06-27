import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
