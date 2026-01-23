
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
 * Groups executions by appId for batch queries.
 */
function groupExecutionsByAppId(
  executions: ApiAppExecutionRef[]
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();
  for (const { appId, executionId } of executions) {
    const existing = grouped.get(appId);
    if (existing) {
      existing.push(executionId);
    } else {
      grouped.set(appId, [executionId]);
    }
  }
  return grouped;
}

/**
 * Fetches multiple API app executions using batch queries.
 * Groups executions by appId and makes one request per unique app.
 */
async function fetchExecutions(
  executions: ApiAppExecutionRef[]
): Promise<AppExecutionOutputDTO[]> {
  if (executions.length === 0) {
    return [];
  }

  // Group executions by appId
  const groupedByApp = groupExecutionsByAppId(executions);

  // Make one batch request per unique appId
  const batchPromises = Array.from(groupedByApp.entries()).map(
    ([appId, executionIds]) =>
      AppsService.getExecutionsApiAppsAppIdHistoryRunningGet(appId, executionIds)
  );

  // Execute all batch requests in parallel
  const batchResults = await Promise.all(batchPromises);

  // Flatten all results into a single array
  return batchResults.flat();
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
