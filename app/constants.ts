export const viewComfyFileName = process.env.VIEW_COMFY_FILE_NAME || "view_comfy.json";
export const workflowApiFileName = process.env.WORKFLOW_API_FILE_NAME || "workflow_api.json";

export const missingViewComfyFileError = `The ${viewComfyFileName} file is missing from the root of your project, \nor set the VIEW_COMFY_FILE_NAME environment variable to the right path.`;
export const missingWorkflowApiFileError = `The ${workflowApiFileName} file is missing from the root of your project, \nor set the WORKFLOW_API_FILE_NAME environment variable to the right path.`

export const ComfyUIConnRefusedError = (comfyUrl: string) => {
    return `Cannot connect to ComfyUI using ${comfyUrl}, make sure that you have a ComfyUI instance running and that the URL is correct \nor you can change the ComfyUI URL in the .env file using the variables COMFYUI_BASE_URL, COMFYUI_PORT and if you're using SSL/TLS set COMFYUI_SECURE to true`
}
