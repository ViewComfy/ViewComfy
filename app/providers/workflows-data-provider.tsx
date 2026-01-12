"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IWorkflowHistoryModel, IWorkflowResult } from "@/app/interfaces/workflow-history";
import { useRunningWorkflow, useWorkflowByPromptIds } from "@/hooks/use-data";

interface WorkflowDataContextType {
    runningWorkflows: IWorkflowHistoryModel[];
    cancellingWorkflows: string[];
    workflowsCompleted: IWorkflowResult[];
    addRunningWorkflow: (w: IWorkflowHistoryModel) => void;
    addCompletedWorkflow: (w: IWorkflowResult) => void;
    setCancellingWorkflow: (promptId: string) => void;
    removeRunningWorkflow: (promptId: string) => void;
    removeCancellingWorkflow: (promptId: string) => void;
}

const WorkflowDataContext = createContext<WorkflowDataContextType>({
    runningWorkflows: [],
    cancellingWorkflows: [],
    workflowsCompleted: [],
    addRunningWorkflow: () => { },
    addCompletedWorkflow: () => { },
    setCancellingWorkflow: () => { },
    removeRunningWorkflow: () => { },
    removeCancellingWorkflow: () => { },
});

export const useWorkflowData = () => {
    return useContext(WorkflowDataContext);
};

export const WorkflowDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [promptIds, setPromptIds] = useState<string[]>([]);
    const [runningWorkflowsState, setRunningWorkflows] = useState<IWorkflowHistoryModel[]>([]);
    const [workflowsCompleted, setWorkflowsCompleted] = useState<IWorkflowResult[]>([]);
    const [cancellingWorkflows, setCancellingWorkflowsState] = useState<string[]>([]);
    const {
        runningWorkflows
    } = useRunningWorkflow();

    const { workflows } = useWorkflowByPromptIds({ promptIds });


    useEffect(() => {
        if (runningWorkflows.length > 0) {
            setRunningWorkflows(runningWorkflows);
        }
    }, [runningWorkflows]);

    useEffect(() => {
        const completed = workflows.filter(w => w.completed);
        const newIds = completed.map((w) => w.promptId).sort();
        const changed = newIds.length !== workflowsCompleted.length ||
            newIds.some((promptId, i) => promptId !== workflowsCompleted[i].promptId);
        if (changed) {
            setWorkflowsCompleted(completed);
        }
    }, [workflows, workflowsCompleted])

    useEffect(() => {
        if (runningWorkflowsState.length === 0) {
            if (promptIds.length !== 0) {
                setPromptIds([]);
            }
            return;
        }

        const newIds = runningWorkflowsState.map((w) => w.promptId).sort();
        const changed =
            newIds.length !== promptIds.length ||
            newIds.some((id, i) => id !== promptIds[i]);

        if (changed) {
            setPromptIds(newIds);
        }
    }, [runningWorkflowsState, promptIds]);

    useEffect(() => {

        const stillRunning: IWorkflowHistoryModel[] = [];
        for (const running of runningWorkflowsState) {
            const isPresent = workflowsCompleted.some(w => w.promptId === running.promptId && w.completed);
            if (!isPresent) {
                stillRunning.push({ ...running });
            }
        }
        const sameLength = stillRunning.length === runningWorkflowsState.length;
        const sameOrder = sameLength && stillRunning.every((w, i) => w.promptId === runningWorkflowsState[i]?.promptId);
        if (!sameOrder) {
            setRunningWorkflows(stillRunning);
            setPromptIds(stillRunning.map(w => w.promptId));
        }
    }, [workflowsCompleted, runningWorkflowsState]);

    const addRunningWorkflow = (w: IWorkflowHistoryModel) => {
        setRunningWorkflows((prevState) => ([{ ...w }, ...prevState]));
    }

    const addCompletedWorkflow = (w: IWorkflowResult) => {
        if (runningWorkflows.every(r => r.promptId !== w.promptId)) {
            setWorkflowsCompleted((prevState) => ([...prevState, { ...w }]));
        }
    }

    const setCancellingWorkflow = (promptId: string) => {
        setCancellingWorkflowsState(prev => [...prev, promptId]);
    };

    const removeCancellingWorkflow = (promptId: string) => {
        setCancellingWorkflowsState(prev => prev.filter(id => id !== promptId));
    };

    const removeRunningWorkflow = (promptId: string) => {
        setRunningWorkflows(prev => prev.filter(w => w.promptId !== promptId));
        removeCancellingWorkflow(promptId);
    };

    return (
        <WorkflowDataContext.Provider value={{
            runningWorkflows: runningWorkflowsState,
            cancellingWorkflows,
            workflowsCompleted,
            addRunningWorkflow,
            addCompletedWorkflow,
            setCancellingWorkflow,
            removeRunningWorkflow,
            removeCancellingWorkflow,
        }}>
            {children}
        </WorkflowDataContext.Provider>
    );
};
