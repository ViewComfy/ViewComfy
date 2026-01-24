/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AppInputFieldOutputDTO } from './AppInputFieldOutputDTO';
/**
 * Output DTO for an App.
 */
export type AppOutputDTO = {
    id: number;
    name: string;
    description: string;
    falModelUrl: string;
    inputs: Array<AppInputFieldOutputDTO>;
    generationPrice: number;
    createdAt: string;
    updatedAt?: (string | null);
};

