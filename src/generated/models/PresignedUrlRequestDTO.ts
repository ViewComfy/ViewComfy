/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
/**
 * DTO for requesting a presigned URL for file upload.
 */
export type PresignedUrlRequestDTO = {
    /**
     * Name of the file to upload
     */
    filename: string;
    /**
     * MIME type of the file (e.g., 'image/png', 'video/mp4')
     */
    contentType: string;
};

