/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
/**
 * Output DTO for an execution result (image, video, audio, etc.).
 *
 * Follows the same pattern as WorkflowHistoryFileDB for consistency.
 */
export type AppExecutionResultOutputDTO = {
    id: number;
    filename: string;
    contentType: string;
    size?: (number | null);
    filepath: string;
};

