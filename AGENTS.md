# AGENTS.md (ViewComfy)

This file is for agentic coding assistants operating in this repo.
It summarizes how to build/lint/typecheck, how the project is structured, and the
local code conventions/rules to follow.

## Project overview
- Next.js App Router project (`app/`) with React 19 + TypeScript (strict).
- UI is largely shadcn/ui + Radix primitives (`components/ui/`).
- Shared helpers live in `lib/`, app-specific logic in `app/`.
- Path alias: import from `@/*` maps to repo root (see `tsconfig.json`).
- OpenAPI-generated client in `src/generated/` with Clerk authentication (see below).

## Quick commands

### Install
```bash
npm install
# or (CI-style)
npm ci
```

### Dev
```bash
npm run dev
```
Note: `dev` runs `next dev` with Node inspector enabled.

### Build / start
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
npm run lint-fix
```

### Lint a single file
```bash
npx eslint "components/ui/button.tsx"
# fix only that file
npx eslint "components/ui/button.tsx" --fix
```

### Typecheck (no emit)
There is no `typecheck` script yet; use `tsc` directly:
```bash
npx tsc -p tsconfig.json --noEmit
```

### Tests
- There is currently **no** `test` script and no test runner dependency in `package.json`.
- Treat `npm run lint` + `npx tsc -p tsconfig.json --noEmit` + `npm run build` as the local verification suite.

## CI / Docker builds
GitHub Actions primarily build Docker images (see `.github/workflows/*`):
- `viewcomfy-nextjs-build.yml` → `Dockerfile`
- `viewcomfy-editor-modal-build.yml` → `ViewComfy-modal.dockerfile`
- `viewcomfy-playground-modal-build copy.yml` → `ViewComfy-modal.dockerfile`

Local Docker (minimal):
```bash
docker build -t viewcomfy .
docker run -it --name viewcomfy-container -p 3000:3000 viewcomfy
```

## Cursor rules in this repo (MUST FOLLOW)
Cursor rules are stored in `.cursor/rules/` and marked `alwaysApply: true`.
If these conflict with your personal defaults, prefer the Cursor rules.

### `.cursor/rules/front-end-cursor-rules.mdc`
Key requirements (interpret in a React/Next.js context):
- Fully implement requested functionality; no TODOs/placeholders.
- Prefer readable, DRY code with early returns.
- Accessibility: keyboard nav, ARIA labels/roles, focus states.
- Components: use `React.forwardRef` for interactive UI; define props interfaces; use CVA variants; set `displayName`.
- Styling: Tailwind + shadcn tokens/CSS vars; use `cn()`; support dark mode via CSS variables.
- Handlers: name event handlers with `handle*` (e.g., `handleClick`).

### `.cursor/rules/view-comfy-json-rules.mdc`
These rules apply when editing `view_comfy.json` / “ViewComfy JSON” structures:
- `view_comfy.json` contains `workflows[]` entries with:
  - `viewComfyJSON` (safe to edit; controls UI)
  - `workflowApiJSON` (**DO NOT EDIT**)
- **Never touch `workflowApiJSON`; only modify `viewComfyJSON`.**
- When moving/removing inputs, move/remove the entire object (not partial).
- For `valueType: "select"`, `options[]` is required (label/value pairs).

## Code style (pragmatic, repo-aligned)
This repo contains a mix of formatting styles across files. Follow these rules:
- Avoid drive-by formatting changes; keep existing file style unless you are
  already making substantial edits in that file.
- Use ESLint to catch issues (`npm run lint`) and `npm run lint-fix` for safe
  auto-fixes.

### Imports
Preferred order (match common shadcn/ui patterns in `components/ui/*`):
1. React imports (`import * as React from "react"`) when needed.
2. External libraries (Radix, zod, zustand, etc.).
3. Internal absolute imports via alias (`@/lib/...`, `@/app/...`).
4. Relative imports (`./...`).

Guidelines:
- Use type-only imports where it improves clarity (`import type { X } ...`).
- Prefer `@/` alias over deep relative paths.

### Formatting
- Use Tailwind utility classes; prefer `cn()` for conditional composition.
- Prefer small, composable functions and early returns.
- Keep JSX readable: avoid deeply nested ternaries in render.

### Types
- TypeScript is `strict: true` (`tsconfig.json`). Don’t weaken types.
- Prefer:
  - `interface` for object-shaped props and API shapes.
  - `type` for unions/literals (`type Status = "a" | "b"`).
- This repo often prefixes interfaces with `I` (e.g., `IComfyUIError`). Keep
  consistency within the file/module you touch.
- ESLint allows `any`, but prefer `unknown` + narrowing in new code.
- `@ts-ignore` is only allowed with a description (see `eslint.config.mjs`).

### Naming
- Components: `PascalCase` (e.g., `WorkflowSidebar`).
- Hooks: `useSomething`.
- Booleans: `isLoading`, `hasError`, `canEdit`.
- Handlers: `handleClick`, `handleSubmit`, `handleKeyDown`.
- Files/folders: follow existing naming in the area you’re editing.

## Error handling patterns
Prefer existing patterns instead of inventing new ones:
- API routes often return typed JSON errors via `ErrorResponseFactory`
  (`app/models/errors.ts`) and `NextResponse.json(...)`.
- For workflow/Comfy errors, use `ComfyWorkflowError` and/or
  `ComfyErrorHandler` (`app/helpers/comfy-error-handler.ts`).
- When catching `unknown`, convert to a structured response rather than
  returning raw strings (except for simple endpoints like `text-proxy`).

## Next.js / App Router conventions
- Mark client components explicitly with `'use client'`.
- Keep server-only code in route handlers (`app/api/**/route.ts`) and services
  that run server-side.
- Be careful with environment variables:
  - `NEXT_PUBLIC_*` is safe for client bundles.
  - Non-`NEXT_PUBLIC_*` should stay server-side.

## OpenAPI Client & Authentication

The project uses an OpenAPI-generated TypeScript client in `src/generated/`.

### How Authentication Works
Authentication is configured **at runtime** (not in generated files) so it survives regeneration:

1. **`src/generated/auth-config.ts`** (NOT generated, manually maintained)
   - Contains `initializeOpenAPIAuth()` function
   - Sets up Clerk JWT authentication for all API calls

2. **Integration in `components/auth/authenticated-wrapper.tsx`**
   - Calls `useInitializeOpenAPIAuth()` hook on mount
   - Automatically injects Bearer tokens into all OpenAPI service calls

3. **Usage** - Simply use the generated services:
   ```typescript
   import { AppsService } from '@/src/generated';
   
   // Automatically authenticated via OpenAPI.TOKEN resolver
   const data = await AppsService.listAppsApiAppsGet(projectId);
   ```

4. **With SWR** - Use directly in hooks:
   ```typescript
   const { data, error, isLoading } = useSWR(
       projectId ? ["api-apps", projectId] : null,
       () => AppsService.listAppsApiAppsGet(projectId!),
   );
   ```

### Regenerating OpenAPI Client

When regenerating (e.g., `npx openapi-typescript-codegen ...`):

**✅ Keep these files (not regenerated):**
- `src/generated/auth-config.ts`
- `src/generated/README.md`

**✅ Safe to regenerate:**
- `src/generated/core/`
- `src/generated/models/`
- `src/generated/services/`
- `src/generated/index.ts`

**After regeneration:**
- Authentication continues to work automatically ✅
- No manual changes needed in generated files ✅
- See `src/generated/README.md` for details

## Before you open a PR
Run the closest available checks:
```bash
npm run lint && npx tsc -p tsconfig.json --noEmit && npm run build
```

## Design Philosophy

This project targets designers and creatives - prioritize beautiful, tasteful UI.