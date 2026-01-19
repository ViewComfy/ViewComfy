"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AppInputFieldOutputDTO, AppOutputDTO } from "@/src/generated";

import { Form, FormField } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AppFormField } from "./app-form-field";
import {
  buildFormSchema,
  getDefaultValues,
  type AppFormValues,
} from "./schema-builder";

interface AppFormProps {
  /** The app definition containing input field configurations */
  app: AppOutputDTO;
  /** Callback when form is submitted with valid data */
  onSubmit: (data: AppFormValues) => void | Promise<void>;
  /** Additional class names for the form container */
  className?: string;
}

interface AppFormSkeletonProps {
  /** Number of skeleton fields to show */
  fieldCount?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Loading skeleton for the AppForm
 */
export function AppFormSkeleton({
  fieldCount = 4,
  className,
}: AppFormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

AppFormSkeleton.displayName = "AppFormSkeleton";

/**
 * Dynamic form component that renders fields based on AppOutputDTO input definitions.
 *
 * @example
 * ```tsx
 * <AppForm
 *   app={appData}
 *   onSubmit={(data) => console.log(data)}
 *   submitLabel="Generate"
 * />
 * ```
 */
export function AppForm({
  app,
  onSubmit,
  className,
}: AppFormProps) {
  const inputs = app.inputs;

  // Memoize schema and defaults to avoid recreation on every render
  const schema = React.useMemo(() => buildFormSchema(inputs), [inputs]);
  const defaultValues = React.useMemo(() => getDefaultValues(inputs), [inputs]);

  const form = useForm<AppFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  if (inputs.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        No input fields configured for this app.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form id="app-form" onSubmit={handleSubmit} className={cn("space-y-6 min-w-0", className)}>
        {inputs.map((inputDef: AppInputFieldOutputDTO) => (
          <FormField
            key={inputDef.name}
            control={form.control}
            name={inputDef.name}
            render={({ field }) => (
              <AppFormField field={field} inputDef={inputDef} appId={app.id} />
            )}
          />
        ))}

      </form>
    </Form>
  );
}

AppForm.displayName = "AppForm";
