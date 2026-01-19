/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Healthz
     * @returns string Successful Response
     * @throws ApiError
     */
    public static healthzApiHealthzGet(): CancelablePromise<'OK'> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/healthz',
        });
    }
}
