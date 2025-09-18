import { IBase } from "@/app/interfaces/base";
import { IUser } from "@/app/interfaces/user";
import { S3FilesData } from "@/app/models/prompt-result";

export interface IWorkflowHistoryFileModel extends IBase {
    id: number;
    filename: string;
    contentType: string;
    size: number;
    filepath: string;
}

export interface IWorkflowHistoryWorkflowModel extends IBase {
    name: string;
}

export interface IWorkflowHistoryModel extends IBase {
    workflowId: number;
    promptId: string;
    status: string;
    completed: boolean;
    executionTimeSeconds: number;
    prompt: Record<string, unknown>;
    outputs: IWorkflowHistoryFileModel[] | undefined;
    workflow: IWorkflowHistoryWorkflowModel;
    createdAt: Date;
    user: IUser;
    errorData: string | undefined;
}

export interface IWorkflowResult {
    promptId: string;
    status: string;
    completed: boolean;
    executionTimeSeconds: number;
    prompt: Record<string, unknown>;
    outputs: S3FilesData[] | undefined;
    errorData?: string | undefined;
}
