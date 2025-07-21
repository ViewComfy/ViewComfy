import { IBase } from "@/app/interfaces/base";
import { IUser } from "@/app/interfaces/user";

export interface IWorkflowHistoryFileModel extends IBase {
    id: number;
    filename: string;
    contentType: string;
    size: number;
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
    outputs: IWorkflowHistoryFileModel[] | null;
    workflow: IWorkflowHistoryWorkflowModel;
    createdAt: Date;
    user: IUser;
}
