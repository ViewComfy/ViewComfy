import type { IViewComfyApp } from "./viewcomfy-app";
import type { AppOutputDTO } from "@/src/generated";

/**
 * Wrapper for ViewComfy apps (workflow-based)
 */
export interface ViewComfyAppWrapper {
  type: "viewcomfy";
  data: IViewComfyApp;
}

/**
 * Wrapper for API apps (input field-based)
 */
export interface ApiAppWrapper {
  type: "api";
  data: AppOutputDTO;
}

/**
 * Discriminated union of all app types.
 * Use type guards `isViewComfyApp` and `isApiApp` to narrow the type.
 */
export type UnifiedApp = ViewComfyAppWrapper | ApiAppWrapper;

/**
 * Type guard for ViewComfy apps
 */
export function isViewComfyApp(app: UnifiedApp): app is ViewComfyAppWrapper {
  return app.type === "viewcomfy";
}

/**
 * Type guard for API apps
 */
export function isApiApp(app: UnifiedApp): app is ApiAppWrapper {
  return app.type === "api";
}

/**
 * App type identifier for URL routing
 */
export type AppType = "viewcomfy" | "api";

/**
 * Common display properties extracted from any app type.
 * Used by UI components to render apps uniformly.
 */
export interface AppDisplayInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: AppType;
}

/**
 * Extracts common display information from any app type.
 * Provides a unified interface for UI components.
 */
export function getAppDisplayInfo(app: UnifiedApp): AppDisplayInfo {
  if (isViewComfyApp(app)) {
    return {
      id: app.data.appId,
      name: app.data.name,
      description: app.data.description,
      imageUrl:
        (app.data.viewComfyJson["appImg"] as string) || "/view_comfy_logo.svg",
      type: "viewcomfy",
    };
  }

  // API apps - use `id` (number) converted to string
  return {
    id: String(app.data.id),
    name: app.data.name,
    description: app.data.description,
    imageUrl: app.data.thumbnailUrl || "/view_comfy_logo.svg",
    type: "api",
  };
}

/** Prefix used to identify API apps in URL parameters */
export const API_APP_PREFIX = "api-";

/**
 * Result of parsing an appId URL parameter.
 */
export interface ParsedAppId {
  type: AppType;
  id: string;
}

/**
 * Parses an appId URL parameter to determine app type and extract the actual ID.
 * API apps use "api-" prefix (e.g., "api-123"), ViewComfy apps use plain UUIDs.
 */
export function parseAppIdParam(appIdParam: string): ParsedAppId {
  if (appIdParam.startsWith(API_APP_PREFIX)) {
    return {
      type: "api",
      id: appIdParam.slice(API_APP_PREFIX.length),
    };
  }
  return {
    type: "viewcomfy",
    id: appIdParam,
  };
}

/**
 * Builds the playground URL for an app.
 * API apps get "api-" prefix to distinguish from ViewComfy UUIDs.
 */
export function getAppPlaygroundUrl(app: UnifiedApp): string {
  if (isViewComfyApp(app)) {
    return `/playground?appId=${app.data.appId}`;
  }
  // API apps use "api-" prefix
  return `/playground?appId=${API_APP_PREFIX}${app.data.id}`;
}

/**
 * Gets the unique identifier for an app regardless of type.
 */
export function getAppId(app: UnifiedApp): string {
  return isViewComfyApp(app) ? app.data.appId : String(app.data.id);
}
