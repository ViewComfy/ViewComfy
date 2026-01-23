import type { IWorkflowHistoryFileModel } from "./workflow-history";
import type { AppExecutionResultOutputDTO } from "@/src/generated";

/**
 * Unified file output type that handles both ViewComfy and API App results.
 * Both types have compatible shapes: id, filename, contentType, size, filepath
 */
export type UnifiedHistoryFile = IWorkflowHistoryFileModel | (AppExecutionResultOutputDTO & { size: number });

/**
 * Unified history item that can represent either ViewComfy or API App execution history.
 */
export interface IUnifiedHistoryItem {
    /** Unique identifier - promptId for ViewComfy, executionId for API apps */
    id: string;
    /** Display type for conditional rendering */
    type: "viewcomfy" | "api";
    /** Status of the execution */
    status: string;
    /** Whether execution completed successfully */
    completed: boolean;
    /** Execution time in seconds (null for API apps that don't track this) */
    executionTimeSeconds: number | null;
    /** Output files */
    outputs: UnifiedHistoryFile[];
    /** When the execution was created */
    createdAt: Date;
    /** Original input data (for "copy prompt" functionality) */
    inputData: Record<string, unknown>;
    /** App/workflow name for display */
    appName?: string;
}
