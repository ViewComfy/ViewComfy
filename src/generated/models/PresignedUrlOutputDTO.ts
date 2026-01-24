/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
/**
 * Output DTO for presigned URL response.
 */
export type PresignedUrlOutputDTO = {
    /**
     * Presigned URL for uploading the file to S3
     */
    url: string;
    /**
     * S3 object key (path) where the file will be stored
     */
    key: string;
    /**
     * URL expiration time in seconds
     */
    expiresIn: number;
};

