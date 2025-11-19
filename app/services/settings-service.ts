export class SettingsService {

    public isUserManagementEnabled(): boolean {
        return process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";
    }

    public getViewComfyCloudApiUrl(): string {
        if (!process.env.VIEWCOMFY_CLOUD_API_URL) {
            throw new Error("VIEWCOMFY_CLOUD_API_URL is not set");
        }
        return process.env.VIEWCOMFY_CLOUD_API_URL;
    }

    public getViewComfyCloudApiClientId(): string {
        return process.env.VIEWCOMFY_CLIENT_ID || "";
    }

    public getViewComfyCloudApiClientSecret(): string {
        return process.env.VIEWCOMFY_CLIENT_SECRET || "";
    }

    public getApiUrl(): string {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            throw new Error("NEXT_PUBLIC_API_URL is not set");
        }
        return process.env.NEXT_PUBLIC_API_URL;
    }

    public getComfyOutputDirectory(): string {
        if (!process.env.COMFY_OUTPUT_DIR) {
            throw new Error("COMFY_OUTPUT_DIR is not set, you need to use Full paths not relative paths");
        }
        return process.env.COMFY_OUTPUT_DIR;
    }

    public getIsRunningInViewComfy(): boolean {
        if (process.env.NEXT_PUBLIC_IS_RUNNING_IN_VIEWCOMFY && process.env.NEXT_PUBLIC_IS_RUNNING_IN_VIEWCOMFY === "true") {
            return true;
        }
        return false;
    }

    public getIsViewMode(): boolean {
        return Boolean((process.env.NEXT_PUBLIC_VIEW_MODE && process.env.NEXT_PUBLIC_VIEW_MODE === "true"))
    }
}
