export const viewComfyFileName = process.env.VIEW_COMFY_FILE_NAME || "view_comfy.json";
export const workflowApiFileName = process.env.WORKFLOW_API_FILE_NAME || "workflow_api.json";

export const missingViewComfyFileError = `The ${viewComfyFileName} file is missing from the root of your project, \nor set the VIEW_COMFY_FILE_NAME environment variable to the correct path.`;
export const missingWorkflowApiFileError = `The ${workflowApiFileName} file is missing from the root of your project, \nor set the WORKFLOW_API_FILE_NAME environment variable to the correct path.`