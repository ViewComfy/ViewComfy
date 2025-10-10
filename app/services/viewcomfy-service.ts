import { IViewComfyApp, IViewComfyAppSecrets } from "@/app/models/viewcomfy-app";
import { SettingsService } from "@/app/services/settings-service";
import { ErrorTypes, ErrorBase } from "@/app/models/errors";

const settingsService = new SettingsService();

export class ViewComfyService {

    public async getViewComfyApp(appId: string, token: string): Promise<IViewComfyApp> {

        const response = await fetch(`${settingsService.getViewComfyCloudApiUrl()}/viewcomfy-app/app/${appId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                const body = await response.json();
                const message = body.errorMsg || "ViewComfy app not found";
                const errors = body.errorDetails ? [body.errorDetails] : ["ViewComfy app not found"];
                const error = new ErrorBase({
                    message: message,
                    errorType: ErrorTypes.VIEW_MODE_MISSING_APP_ID,
                    errors: errors
                });
                console.error(error);
                throw error;
            } else {
                const error = new ErrorBase({
                    message: 'Failed to fetch ViewComfy app',
                    errorType: ErrorTypes.VIEW_MODE_MISSING_APP_ID,
                    errors: ['Failed to fetch ViewComfy app']
                });
                console.error(error);
                throw error;
            }
        }

        const viewComfyApp = await response.json() as IViewComfyApp;
        return viewComfyApp;
    }

    public async getViewComfyAppSecrets(appId: string, token: string): Promise<IViewComfyAppSecrets> {
        const response = await fetch(`${settingsService.getViewComfyCloudApiUrl()}/viewcomfy-app/secrets/${appId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const body = await response.json();
            const message = body.errorMsg || "Failed to fetch ViewComfy app secrets";
            const errors = body.errorDetails ? [body.errorDetails] : ["Failed to fetch ViewComfy app secrets"];
            const error = new ErrorBase({
                message: message,
                errorType: ErrorTypes.VIEW_MODE_MISSING_APP_ID,
                errors: errors
            });
            console.error(error);
            throw error;
        }

        const viewComfyAppSecrets = await response.json() as IViewComfyAppSecrets;
        return viewComfyAppSecrets;
    }
}

