/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AppExecutionResultEnum } from './AppExecutionResultEnum';
import type { AppExecutionResultOutputDTO } from './AppExecutionResultOutputDTO';
import type { AppExecutionStatusEnum } from './AppExecutionStatusEnum';
/**
 * Output DTO for an App execution.
 */
export type AppExecutionOutputDTO = {
    id: number;
    inputData: Record<string, any>;
    status: AppExecutionStatusEnum;
    result?: (AppExecutionResultEnum | null);
    errorMessage?: (string | null);
    promptId?: (string | null);
    completedAt?: (string | null);
    results?: Array<AppExecutionResultOutputDTO>;
    generationPrice: number;
    createdAt: string;
    appId: number;
};

