"use client";
import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import { useCallback, useEffect, useMemo } from "react";
import { UTCDate } from "@date-fns/utc";

import { IWorkflowHistoryModel } from "@/app/interfaces/workflow-history";
import { SettingsService } from "@/app/services/settings-service";
import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app";
import { useRouter } from "next/navigation";
import { IUser } from "@/app/interfaces/user";
import { ApiResponseError } from "@/app/models/errors";
import { IWorkflow } from "@/app/interfaces/workflow";
import { AppsService } from "@/src/generated";
import type { AppOutputDTO } from "@/src/generated";
import type { UnifiedApp } from "@/app/interfaces/unified-app";
import { initializeOpenAPIAuth } from "@/src/generated/auth-config";

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

/**
 * Hook to initialize OpenAPI authentication with Clerk.
 * Call this once in your app (e.g., in a layout or provider) to enable
 * authentication for all OpenAPI-generated service calls.
 * 
 * @example
 * ```tsx
 * function MyLayout({ children }) {
 *   useInitializeOpenAPIAuth();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useInitializeOpenAPIAuth() {
    const { getToken } = useAuth();

    useEffect(() => {
        initializeOpenAPIAuth(async () => {
            return await getToken({ template: "long_token" });
        });
    }, [getToken]);
}

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
    page?: number;
    pageSize?: number;
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

    if (params.page) {
        urlParams += `&page=${params.page}`;
    }

    if (params.pageSize) {
        urlParams += `&page_size=${params.pageSize}`;
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

export function useViewComfyApps({
    teamId
}: { teamId: number | undefined; }) {
    const fetchWithToken = useFetchWithToken();

    const { data, error, isLoading, mutate } = useSWR(teamId ? `viewcomfy-app/playground/apps/${teamId}` : undefined,
        fetchWithToken,
        {
            refreshInterval: 5000,
        },
    );

    let result: IViewComfyApp[] | null = null;

    if (data && !error) {
        result = data as IViewComfyApp[];
    } else {
        result = null;
    }

    return {
        viewComfyApps: result,
        isLoading,
        isError: error,
        mutateViewComfyApps: mutate,
    };
}

export function useUser() {
    const fetchWithToken = useFetchWithToken();
    const router = useRouter();
    const { signOut } = useAuth();

    const { data, error, isLoading } = useSWR(
        `user/playground/me`,
        fetchWithToken,
        {
            refreshInterval: 60000,
        },
    );

    useEffect(() => {
        if (error) {
            if (error instanceof ApiResponseError) {
                const logout = async () => {
                    await signOut();
                    router.push("/login");
                };
                logout();
            }
        }
    }, [error, router, signOut]);

    return {
        user: data as IUser | null,
        isLoading,
        isError: error,
    };
}

export function useWorkflows({
    teamId
}: { teamId: number | undefined; }) {
    const fetchWithToken = useFetchWithToken();

    const { data, error, isLoading, mutate } = useSWR(teamId ? `viewcomfy-app/playground/workflows?team_id=${teamId}` : undefined,
        fetchWithToken,
        {
            refreshInterval: 15000,
        },
    );

    let result: IWorkflow[] | null = null;

    if (data && !error) {
        result = data as IWorkflow[];
    } else {
        result = null;
    }

    return {
        workflows: result,
        isLoading,
        isError: error,
        mutateWorkflows: mutate,
    };
}

export function useGetTeamByAppId({
    appId
}: { appId: string | null | undefined; }) {
    const fetchWithToken = useFetchWithToken();
    const { data, error, isLoading, mutate } = useSWRImmutable(appId ? `viewcomfy-app/app/team/${appId}` : undefined,
        fetchWithToken,
    );

    let result: { teamId: number } | null = null;

    if (data && !error) {
        result = data as { teamId: number };
    } else {
        result = null;
    }

    return {
        teamId: result?.teamId,
        isLoading,
        isError: error,
        mutateWorkflows: mutate,
    };
}

/**
 * Fetches API apps for a project using the generated AppsService.
 * projectId is equivalent to teamId in the current architecture.
 */
export function useApiApps({
    projectId
}: { projectId: number | undefined; }) {
    const { data, error, isLoading, mutate } = useSWR(
        projectId ? ["api-apps", projectId] : null,
        () => AppsService.listAppsApiAppsGet(projectId!),
        {
            refreshInterval: 5000,
        },
    );

    let result: AppOutputDTO[] | null = null;

    if (data && !error) {
        result = data.apps;
    } else {
        result = null;
    }

    return {
        apiApps: result,
        isLoading,
        isError: error,
        mutateApiApps: mutate,
    };
}

/**
 * Combines ViewComfy apps and API apps into a unified list.
 * Returns apps wrapped with type discriminator for easy type narrowing.
 */
export function useAllApps({
    teamId
}: { teamId: number | undefined; }) {
    const { viewComfyApps, isLoading: vcLoading, isError: vcError } = useViewComfyApps({ teamId });
    const { apiApps, isLoading: apiLoading, isError: apiError } = useApiApps({ projectId: teamId });

    const apps = useMemo((): UnifiedApp[] | null => {
        // Return null only if both are still loading with no data
        if (!viewComfyApps && !apiApps) {
            return null;
        }

        const unified: UnifiedApp[] = [];

        if (viewComfyApps) {
            unified.push(
                ...viewComfyApps.map((app): UnifiedApp => ({
                    type: "viewcomfy",
                    data: app,
                }))
            );
        }

        if (apiApps) {
            unified.push(
                ...apiApps.map((app): UnifiedApp => ({
                    type: "api",
                    data: app,
                }))
            );
        }

        return unified;
    }, [viewComfyApps, apiApps]);

    return {
        apps,
        isLoading: vcLoading || apiLoading,
        isError: vcError || apiError,
    };
}
