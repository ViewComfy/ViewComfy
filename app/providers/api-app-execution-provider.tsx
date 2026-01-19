"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppExecutionResultOutputDTO } from "@/src/generated";
import {
  useApiAppExecutions,
  isExecutionComplete,
  type ApiAppExecutionRef,
} from "@/hooks/use-api-app-executions";

/**
 * Represents a running API app execution being tracked.
 */
export interface RunningApiAppExecution {
  executionId: number;
  appId: number;
  submittedAt: string;
}

/**
 * Represents a completed API app execution with results.
 */
export interface CompletedApiAppExecution {
  executionId: number;
  appId: number;
  status: "completed" | "failed";
  results?: AppExecutionResultOutputDTO[];
  errorMessage?: string;
  completedAt: string;
}

interface ApiAppExecutionContextType {
  /** Currently running/pending executions */
  runningExecutions: RunningApiAppExecution[];
  /** Completed executions (success or failure) */
  completedExecutions: CompletedApiAppExecution[];
  /** Add a new execution to track */
  addRunningExecution: (execution: RunningApiAppExecution) => void;
  /** Remove an execution from tracking */
  removeRunningExecution: (executionId: number) => void;
  /** Clear a completed execution from the list */
  clearCompletedExecution: (executionId: number) => void;
}

const ApiAppExecutionContext = createContext<ApiAppExecutionContextType>({
  runningExecutions: [],
  completedExecutions: [],
  addRunningExecution: () => {},
  removeRunningExecution: () => {},
  clearCompletedExecution: () => {},
});

/**
 * Hook to access API app execution tracking state.
 */
export function useApiAppExecutionData() {
  return useContext(ApiAppExecutionContext);
}

/**
 * Provider that manages API app execution tracking with background polling.
 * 
 * Similar to WorkflowDataProvider but for API app executions.
 * Automatically polls for execution status and moves completed ones
 * to the completedExecutions array.
 */
export function ApiAppExecutionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runningExecutions, setRunningExecutions] = useState<RunningApiAppExecution[]>([]);
  const [completedExecutions, setCompletedExecutions] = useState<CompletedApiAppExecution[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<number>>(new Set());

  // Convert running executions to the format expected by the polling hook
  const executionRefs: ApiAppExecutionRef[] = runningExecutions.map((exec) => ({
    executionId: exec.executionId,
    appId: exec.appId,
  }));

  // Poll for execution status
  const { executionsData } = useApiAppExecutions({ executions: executionRefs });

  // Process completed executions
  useEffect(() => {
    if (executionsData.length === 0) return;

    const newCompleted: CompletedApiAppExecution[] = [];
    const stillRunningIds: number[] = [];

    for (const execData of executionsData) {
      // Skip if already processed
      if (processedIds.has(execData.id)) {
        continue;
      }

      if (isExecutionComplete(execData.status)) {
        newCompleted.push({
          executionId: execData.id,
          appId: execData.appId,
          status: execData.status as "completed" | "failed",
          results: execData.results,
          errorMessage: execData.errorMessage ?? undefined,
          completedAt: execData.completedAt ?? new Date().toISOString(),
        });
      } else {
        stillRunningIds.push(execData.id);
      }
    }

    // Add newly completed executions
    if (newCompleted.length > 0) {
      setCompletedExecutions((prev) => [...prev, ...newCompleted]);
      
      // Mark as processed
      setProcessedIds((prev) => {
        const next = new Set(prev);
        newCompleted.forEach((exec) => next.add(exec.executionId));
        return next;
      });

      // Remove completed from running
      const completedIds = new Set(newCompleted.map((e) => e.executionId));
      setRunningExecutions((prev) =>
        prev.filter((exec) => !completedIds.has(exec.executionId))
      );
    }
  }, [executionsData, processedIds]);

  const addRunningExecution = useCallback((execution: RunningApiAppExecution) => {
    setRunningExecutions((prev) => {
      // Avoid duplicates
      if (prev.some((e) => e.executionId === execution.executionId)) {
        return prev;
      }
      return [execution, ...prev];
    });
  }, []);

  const removeRunningExecution = useCallback((executionId: number) => {
    setRunningExecutions((prev) =>
      prev.filter((exec) => exec.executionId !== executionId)
    );
  }, []);

  const clearCompletedExecution = useCallback((executionId: number) => {
    setCompletedExecutions((prev) =>
      prev.filter((exec) => exec.executionId !== executionId)
    );
  }, []);

  return (
    <ApiAppExecutionContext.Provider
      value={{
        runningExecutions,
        completedExecutions,
        addRunningExecution,
        removeRunningExecution,
        clearCompletedExecution,
      }}
    >
      {children}
    </ApiAppExecutionContext.Provider>
  );
}
