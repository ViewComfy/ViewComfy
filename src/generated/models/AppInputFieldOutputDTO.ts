/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AppInputDataTypeEnum } from './AppInputDataTypeEnum';
import type { AppInputTypeEnum } from './AppInputTypeEnum';
/**
 * Output DTO for a single input field definition.
 */
export type AppInputFieldOutputDTO = {
    name: string;
    label: string;
    description: string;
    dataType: AppInputDataTypeEnum;
    inputType: AppInputTypeEnum;
    required: boolean;
    default?: null;
    minValue?: (number | null);
    maxValue?: (number | null);
    step?: (number | null);
    options?: (Array<string> | null);
};

