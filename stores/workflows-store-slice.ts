
import { IWorkflow } from "@/app/interfaces/workflow";
import { StateCreator } from "zustand";

export interface IWorkflowSlice {
    workflows: IWorkflow[] | undefined;
    setWorkflows: (workflows: IWorkflow[]) => void;
}

const workflowInitState = {
    workflows: undefined,
};

export const createWorkflowSlice: StateCreator<IWorkflowSlice, [], [], IWorkflowSlice> = (
    set,
) => ({
    ...workflowInitState,
    setWorkflows: (workflows: IWorkflow[]) => {
        set({ workflows });
    },
});
