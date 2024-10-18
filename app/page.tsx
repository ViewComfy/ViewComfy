"use client"
import { Sidebar, TabValue } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav"
import { useState } from "react"
import { PlaygroundPage } from "../pages/playground/playground-page"
import { ViewComfyPage } from "@/pages/view-comfy/view-comfy-page";
import { ViewComfyProvider } from "@/app/providers/view-comfy-provider";
import { Toaster } from "@/components/ui/toaster";

export const description =
    "An AI playground with a sidebar navigation and a main content area. The playground has a header with a settings drawer and a share button. The sidebar has navigation links and a user menu. The main content area shows a form to configure the model and messages."

export default function Page() {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [currentTab, setCurrentTab] = useState(viewMode ? TabValue.Playground : TabValue.WorkflowApi);

    return (
        <ViewComfyProvider>
            <div className="flex flex-col h-screen w-full overflow-x-auto overflow-y-hidden">
                <TopNav />
                <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
                    <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
                    <main className="flex-1 overflow-x-auto overflow-y-hidden">
                        {currentTab === TabValue.Playground && <PlaygroundPage />}
                        {currentTab === TabValue.WorkflowApi && <ViewComfyPage />}
                    </main>
                </div>
            </div>
            <Toaster />
        </ViewComfyProvider>
    )
}
