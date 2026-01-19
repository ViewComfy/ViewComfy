/**
 * Authentication configuration for OpenAPI client.
 * This file is NOT generated and should be manually maintained.
 * 
 * Call `initializeOpenAPIAuth` from a React component that has access
 * to Clerk's `useAuth()` hook to set up authentication for all API calls.
 */

import { OpenAPI } from './core/OpenAPI';
import { SettingsService } from '@/app/services/settings-service';

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

/**
 * Initialize OpenAPI client with Clerk authentication.
 * Call this from a React component/provider that has access to useAuth().
 * 
 * @example
 * ```tsx
 * const { getToken } = useAuth();
 * 
 * useEffect(() => {
 *   initializeOpenAPIAuth(async () => {
 *     return await getToken({ template: "long_token" });
 *   });
 * }, [getToken]);
 * ```
 */
export function initializeOpenAPIAuth(getter: TokenGetter) {
  tokenGetter = getter;
  
  // Set the TOKEN resolver on the OpenAPI config
  OpenAPI.TOKEN = async () => {
    if (!tokenGetter) {
      throw new Error('OpenAPI auth not initialized. Call initializeOpenAPIAuth first.');
    }
    
    const token = await tokenGetter();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return token;
  };
  
  // Update BASE URL with settings service
  const settingsService = new SettingsService();
  const urlWithApi = settingsService.getApiUrl();
  const url = urlWithApi.replace("/api", "")
  OpenAPI.BASE = url; 
}

/**
 * Clear the token getter (useful for logout or testing)
 */
export function clearOpenAPIAuth() {
  tokenGetter = null;
  OpenAPI.TOKEN = undefined;
}
