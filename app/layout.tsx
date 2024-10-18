import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";



const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ViewComfy",
  description: "From ComfyUI to beatiful web apps",
};

import { ThemeProvider } from "@/components/theme-provider"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function RootLayout({ children }: any) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
