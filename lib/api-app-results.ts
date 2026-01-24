import type { AppExecutionResultOutputDTO } from "@/src/generated";
import { S3FilesData } from "@/app/models/prompt-result";

/**
 * Converts API app execution results to S3FilesData format.
 * This allows API app outputs to use the same OutputRenderer component
 * as ViewComfy workflow outputs.
 */
export function convertApiAppResults(
  results: AppExecutionResultOutputDTO[]
): S3FilesData[] {
  return results.map(
    (result) =>
      new S3FilesData({
        filename: result.filename,
        contentType: result.contentType,
        filepath: result.filepath,
        size: result.size ?? 0,
      })
  );
}

/**
 * Creates a pseudo promptId for API app executions.
 * Used to key results in the same IResults state as ViewComfy workflows.
 * The prefix ensures no collision with ViewComfy prompt IDs.
 */
export function getApiAppPromptId(executionId: number): string {
  return `api-exec-${executionId}`;
}
