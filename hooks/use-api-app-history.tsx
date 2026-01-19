import useSWR from "swr";
import { AppsService } from "@/src/generated";

export interface UseApiAppHistoryParams {
    appId: number | null;
    limit?: number;
    offset?: number;
}

export function useApiAppHistory(params: UseApiAppHistoryParams) {
    const { appId, limit = 50, offset = 0 } = params;

    const { data, error, isLoading, mutate } = useSWR(
        appId ? ["api-app-history", appId, limit, offset] : null,
        () => AppsService.listExecutionsApiAppsAppIdHistoryGet(appId!, limit, offset),
    );

    return {
        executions: data?.executions ?? null,
        total: data?.total ?? 0,
        isLoading,
        isError: !!error,
        mutate,
    };
}
