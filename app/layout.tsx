import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "ViewComfy",
  description: "From ComfyUI to beautiful web apps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userManagementEnabled = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

  // Conditionally wrap the app with ClerkProvider based on the environment variable
  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );

  // Only wrap with ClerkProvider if user management is enabled
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
