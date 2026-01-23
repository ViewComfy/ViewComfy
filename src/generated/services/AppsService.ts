/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AppExecuteDTO } from '../models/AppExecuteDTO';
import type { AppExecutionListOutputDTO } from '../models/AppExecutionListOutputDTO';
import type { AppExecutionOutputDTO } from '../models/AppExecutionOutputDTO';
import type { AppListOutputDTO } from '../models/AppListOutputDTO';
import type { AppOutputDTO } from '../models/AppOutputDTO';
import type { PresignedUrlOutputDTO } from '../models/PresignedUrlOutputDTO';
import type { PresignedUrlRequestDTO } from '../models/PresignedUrlRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AppsService {
    /**
     * List Apps
     * List all Apps for a project.
     * @param teamId Project ID to list apps for
     * @returns AppListOutputDTO Successful Response
     * @throws ApiError
     */
    public static listAppsApiAppsGet(
        teamId: number,
    ): CancelablePromise<AppListOutputDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/apps',
            query: {
                'team_id': teamId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get App
     * Get an App by its public app_id.
     * @param appId
     * @returns AppOutputDTO Successful Response
     * @throws ApiError
     */
    public static getAppApiAppsAppIdGet(
        appId: number,
    ): CancelablePromise<AppOutputDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/apps/{app_id}',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Presigned Upload Url
     * Generate a presigned URL for uploading files to S3.
     *
     * This endpoint allows clients to upload files directly to S3 by:
     * 1. Requesting a presigned URL with the file metadata
     * 2. Using the returned URL to PUT the file directly to S3
     * 3. The file will be stored under apps/{app_id}/uploads/
     *
     * The presigned URL expires in 1 hour.
     * @param appId
     * @param requestBody
     * @returns PresignedUrlOutputDTO Successful Response
     * @throws ApiError
     */
    public static getPresignedUploadUrlApiAppsAppIdUploadUrlPost(
        appId: number,
        requestBody: PresignedUrlRequestDTO,
    ): CancelablePromise<PresignedUrlOutputDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/apps/{app_id}/upload-url',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute App
     * Execute an App by calling fal.ai with the provided input data.
     *
     * Supports both JWT authentication (with team_id query param) and
     * client_id/client_secret header authentication.
     *
     * Returns an execution record with status RUNNING. The actual results
     * will be available once the fal webhook callback is processed.
     * @param appId
     * @param teamId
     * @param requestBody
     * @param clientId
     * @param clientSecret
     * @returns AppExecutionOutputDTO Successful Response
     * @throws ApiError
     */
    public static executeAppApiAppsAppIdExecutePost(
        appId: number,
        teamId: (number | null),
        requestBody: AppExecuteDTO,
        clientId?: (string | null),
        clientSecret?: (string | null),
    ): CancelablePromise<AppExecutionOutputDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/apps/{app_id}/execute',
            path: {
                'app_id': appId,
            },
            headers: {
                'client_id': clientId,
                'client_secret': clientSecret,
            },
            query: {
                'team_id': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Executions
     * Get an execution by its public execution_id, including results.
     * @param appId
     * @param executionIds
     * @returns AppExecutionOutputDTO Successful Response
     * @throws ApiError
     */
    public static getExecutionsApiAppsAppIdHistoryRunningGet(
        appId: number,
        executionIds: Array<number>,
    ): CancelablePromise<Array<AppExecutionOutputDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/apps/{app_id}/history/running',
            path: {
                'app_id': appId,
            },
            query: {
                'execution_ids': executionIds,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Executions
     * List execution history for an App.
     * @param appId
     * @param limit
     * @param offset
     * @returns AppExecutionListOutputDTO Successful Response
     * @throws ApiError
     */
    public static listExecutionsApiAppsAppIdHistoryGet(
        appId: number,
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<AppExecutionListOutputDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/apps/{app_id}/history',
            path: {
                'app_id': appId,
            },
            query: {
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
