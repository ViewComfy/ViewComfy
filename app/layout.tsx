import * as Sentry from '@sentry/nextjs';
import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import ClientRootLayout from './layout-client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ViewComfyProvider } from './providers/view-comfy-provider';
import { Suspense } from 'react';

const metadata: Metadata = {
  title: "ViewComfy",
  description: "From ComfyUI to beautiful web apps",
};

export function generateMetadata(): Metadata {
  return {
    ...metadata,
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userManagementEnabled = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ViewComfyProvider>
          <Suspense>
          <ClientRootLayout>
            {children}
            </ClientRootLayout>
          </Suspense>
        </ViewComfyProvider>
      </TooltipProvider>
    </ThemeProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        {userManagementEnabled ? (
          <ClerkProvider
            signInUrl="/login"
            afterSignOutUrl="/login"
          >{content}</ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
