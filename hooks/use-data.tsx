import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import { useCallback } from "react";
import { UTCDate } from "@date-fns/utc";

import { IWorkflowHistoryModel } from "@/app/interfaces/workflow-history";
import { SettingsService } from "@/app/services/settings-service";

const settingsService = new SettingsService();

const fetcherWithAuth = async (
    resource: string,
    getToken: ({ template }: { template: string }) => Promise<string | null>,
) => {
    const token = await getToken({ template: "long_token" });

    if (!token) {
        throw new Error("No token");
    }

    const url = `${settingsService.getApiUrl()}/${resource}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        // If we get a 401/403, it likely means our token is expired
        if (response.status === 401 || response.status === 403) {
            // This will trigger a revalidation of all SWR hooks
            throw new Error("Token expired");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

export function useFetchWithToken() {
    const { getToken } = useAuth();

    return useCallback(
        (resource: string) => fetcherWithAuth(resource, getToken),
        [getToken],
    );
}

export function useWorkflowHistory(params: {
    apiEndpoint: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const fetchWithToken = useFetchWithToken();

    let urlParams = `${params.apiEndpoint.replace("https://", "")}?`;

    if (params.startDate && params.endDate) {
        const utcStartDate = new UTCDate(params.startDate);
        utcStartDate.setHours(0, 0, 0, 0);
        const utcEndDate = new UTCDate(params.endDate);
        utcEndDate.setHours(23, 59, 59, 999);
        urlParams += `&start_date=${utcStartDate.toISOString()}&end_date=${utcEndDate.toISOString()}`;
    }

    const { data, error, isLoading } = useSWR(
        params.apiEndpoint ? `team/workflow-history/playground/${urlParams}` : null,
        fetchWithToken,
        {
            refreshInterval: 0,
        },
    );

    let result: IWorkflowHistoryModel[] | null = null;

    if (data && !error) {
        result = data as IWorkflowHistoryModel[];
    } else {
        result = null;
    }

    return {
        workflowHistory: result,
        isLoading,
        isError: error,
    };
}

export function useRunningWorkflow() {
    const fetchWithToken = useFetchWithToken();
    const { data, error, isLoading } = useSWRImmutable(
        "workflow/infer/running",
        fetchWithToken
    );

    let result: IWorkflowHistoryModel[] = [];

    if (data && !error) {
        result = data as IWorkflowHistoryModel[];
    }

    return {
        runningWorkflows: result,
        isLoading,
        isError: error,
    };
}

export function useWorkflowByPromptIds(params: {
    promptIds: string[];
}) {
    const fetchWithToken = useFetchWithToken();
    const { promptIds } = params;

    const urlParams = promptIds.length > 0
        ? `?${promptIds.map(id => `prompt_ids=${encodeURIComponent(id)}`).join('&')}`
        : '';

    const { data, error, isLoading } = useSWR(
        params.promptIds.length > 0 ? `workflow/infer/${urlParams}` : null,
        fetchWithToken,
    );

    let result: IWorkflowHistoryModel[] = [];

    if (data && !error) {
        result = data as IWorkflowHistoryModel[];
    }

    return {
        workflows: result,
        isLoading,
        isError: error,
    };
}
