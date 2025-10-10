export const viewComfyFileName = process.env.VIEW_COMFY_FILE_NAME || "view_comfy.json";

export const missingViewComfyFileError = `The ${viewComfyFileName} file is missing from the root of your project, \nor set the VIEW_COMFY_FILE_NAME environment variable to the right path.`;

export const ComfyUIConnRefusedError = (comfyUrl: string) => {
    return `Cannot connect to ComfyUI using ${comfyUrl}, make sure that you have a ComfyUI instance running and that the URL is correct \nor you can change the ComfyUI URL in the .env file using the variables COMFYUI_API_URL and if you're using SSL/TLS set COMFYUI_SECURE to true`
}

export const SEED_LIKE_INPUT_VALUES = ["seed", "noise_seed", "rand_seed"];

export const UPLOAD_PREVIEW_IMAGES_PATH = "preview_images";