# OpenAPI Generated Client

This directory contains TypeScript client code generated from OpenAPI specifications.

## Authentication Setup

Authentication is **NOT** configured in the generated files directly. Instead, it's configured at runtime via a separate auth configuration file that survives regeneration.

### How It Works

1. **`auth-config.ts`** - This file is **NOT generated** and should be manually maintained
   - Contains `initializeOpenAPIAuth()` function that sets up Clerk authentication
   - Sets the `OpenAPI.TOKEN` resolver to dynamically fetch tokens on each request

2. **Integration** - Auth is initialized in `components/auth/authenticated-wrapper.tsx`
   - Calls `useInitializeOpenAPIAuth()` hook
   - Automatically provides authentication for all OpenAPI service calls

3. **Usage** - All generated service methods automatically use authentication:
   ```typescript
   import { AppsService } from '@/src/generated';
   
   // This call will automatically include Bearer token authentication
   const data = await AppsService.listAppsApiAppsGet(projectId);
   ```

## Regenerating OpenAPI Client

When regenerating the OpenAPI client code:

### Do NOT Delete/Modify
- ✅ `auth-config.ts` - Custom authentication configuration

### Safe to Regenerate
- ✅ `core/` - All core files
- ✅ `models/` - All model files  
- ✅ `services/` - All service files
- ✅ `index.ts` - Main export file

### After Regeneration

1. **Check `core/OpenAPI.ts`**:
   - If the comment about auth-config.ts is missing, add it back:
   ```typescript
   // NOTE: Authentication is configured at runtime via auth-config.ts
   // The TOKEN resolver is set up in AuthenticatedWrapper component
   export const OpenAPI: OpenAPIConfig = {
       // ...
       TOKEN: undefined, // Set at runtime by initializeOpenAPIAuth()
   };
   ```

2. **Ensure BASE URL uses SettingsService** (if needed):
   ```typescript
   import { SettingsService } from '@/app/services/settings-service';
   const settings = new SettingsService();
   const API_URL = settings.getApiUrl();
   ```

3. **Test authentication** by calling any service method in a component wrapped by `AuthenticatedWrapper`

## Example Regeneration Command

```bash
# Example using openapi-typescript-codegen
npx openapi-typescript-codegen --input ./openapi.json --output ./src/generated --client fetch
```

After running this:
1. `auth-config.ts` will still exist ✅
2. All service methods will work with authentication ✅
3. No manual changes needed in generated files ✅

## Troubleshooting

### "No authentication token available" Error
- Ensure `useInitializeOpenAPIAuth()` is called in a component that:
  - Is wrapped by `AuthenticatedWrapper`  
  - Has access to Clerk's `useAuth()` hook

### Services not using authentication
- Check that `initializeOpenAPIAuth()` was called before making API calls
- Verify the `OpenAPI.TOKEN` field is set (can console.log it)

### After regeneration, auth stops working
- Check if `auth-config.ts` still exists
- Verify the import path in `hooks/use-data.tsx` is correct
- Ensure `useInitializeOpenAPIAuth()` is still called in `AuthenticatedWrapper`
