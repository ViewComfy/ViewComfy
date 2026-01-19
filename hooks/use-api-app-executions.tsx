
"use client";

import useSWR from "swr";
import { AppsService } from "@/src/generated";
import type { AppExecutionOutputDTO, AppExecutionStatusEnum } from "@/src/generated";

/**
 * Represents a running API app execution to track.
 */
export interface ApiAppExecutionRef {
  executionId: number;
  appId: number;
}

/**
 * Fetches multiple API app executions concurrently.
 */
async function fetchExecutions(
  executions: ApiAppExecutionRef[]
): Promise<AppExecutionOutputDTO[]> {
  if (executions.length === 0) {
    return [];
  }

  const results = await Promise.all(
    executions.map(({ executionId, appId }) =>
      AppsService.getExecutionApiAppsAppIdHistoryExecutionIdGet(executionId, appId)
    )
  );

  return results;
}

/**
 * Checks if an execution is still in progress (should continue polling).
 */
export function isExecutionInProgress(status: AppExecutionStatusEnum): boolean {
  return status === "pending" || status === "running";
}

/**
 * Checks if an execution has completed (successfully or failed).
 */
export function isExecutionComplete(status: AppExecutionStatusEnum): boolean {
  return status === "completed" || status === "failed";
}

/**
 * Hook to poll multiple API app executions.
 * 
 * Uses SWR with a 2-second refresh interval while any execution is in progress.
 * Stops refreshing when all executions are complete.
 * 
 * @param executions Array of execution references to poll
 * @returns Object with execution data, loading state, and error state
 */
export function useApiAppExecutions({
  executions,
}: {
  executions: ApiAppExecutionRef[];
}) {
  // Create a stable key based on execution IDs
  const key =
    executions.length > 0
      ? ["api-app-executions", ...executions.map((e) => `${e.appId}:${e.executionId}`)]
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetchExecutions(executions),
    {
      // Poll every 2 seconds while we have executions to track
      refreshInterval: (latestData) => {
        // If no data yet or any execution is in progress, keep polling
        if (!latestData) return 2000;
        
        const anyInProgress = latestData.some((exec) =>
          isExecutionInProgress(exec.status)
        );
        
        return anyInProgress ? 2000 : 0;
      },
      // Revalidate on focus to catch updates if user was away
      revalidateOnFocus: true,
      // Don't revalidate on reconnect during active polling
      revalidateOnReconnect: false,
    }
  );

  return {
    executionsData: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
