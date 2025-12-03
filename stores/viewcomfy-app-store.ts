import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app";
import { ResponseError } from "@/app/models/errors";
import { SettingsService } from "@/app/services/settings-service";
import { StateCreator } from "zustand";

const settingsService = new SettingsService();

export interface ICRUDViewComfyAppBase {
    name: string;
    description: string;
    teamId: number;
    projectId: number;
    token: string;
    isActiveInAppHub: boolean;
}

export interface ICreateViewComfyApp extends ICRUDViewComfyAppBase {
    viewComfyJson: object;
}
export interface IViewComfyAppSlice {
    createViewComfyApp: (params: ICreateViewComfyApp) => Promise<{ viewComfyApp: IViewComfyApp; message: string } | undefined>;
    isCRUDViewComfyAppLoading: boolean;
    isCRUDViewComfyAppError: ResponseError | undefined;
}

const viewcomfyAppInitState = {
    isCRUDViewComfyAppLoading: false,
    isCRUDViewComfyAppError: undefined,
};

export const createViewComfyAppSlice: StateCreator<IViewComfyAppSlice, [], [], IViewComfyAppSlice> = (
    set
) => ({
    ...viewcomfyAppInitState,
    createViewComfyApp: async (params: ICreateViewComfyApp) => {
        set({ isCRUDViewComfyAppLoading: true });
        set({ isCRUDViewComfyAppError: undefined })
        try {
            const response = await fetch(
                `${settingsService.getApiUrl()}/viewcomfy-app/create-app`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${params.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: params.name,
                        description: params.description,
                        teamId: params.teamId,
                        projectId: params.projectId,
                        viewComfyJson: params.viewComfyJson,
                        isActiveInAppHub: params.isActiveInAppHub,
                    }),
                },
            );
            if (!response.ok) {
                const responseError: ResponseError = await response.json();
                throw responseError;
            }
            const { data, message } = (await response.json()) as {
                data: { viewComfyApp: IViewComfyApp };
                message: string;
            };
            return { viewComfyApp: data.viewComfyApp, message: message };
        } catch (error) {
            set({ isCRUDViewComfyAppError: error as ResponseError });
        } finally {
            set({ isCRUDViewComfyAppLoading: false });
        }
    },
});
