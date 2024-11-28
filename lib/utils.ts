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