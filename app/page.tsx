"use client"
import { Sidebar, TabValue } from "@/components/sidebar";

import { useState } from "react"
import { PlaygroundPage } from "../pages/playground/playground-page"
import { WorkflowApiPage } from "@/pages/workflow-api/workflow-api-page";
import { ViewComfyProvider } from "@/app/providers/view-comfy-provider";
import { Toaster } from "@/components/ui/toaster";

export const description =
    "An AI playground with a sidebar navigation and a main content area. The playground has a header with a settings drawer and a share button. The sidebar has navigation links and a user menu. The main content area shows a form to configure the model and messages."

export default function Page() {

    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true" ? true : false;

    const [currentTab, setCurrentTab] = useState(viewMode ? TabValue.Playground : TabValue.WorkflowApi);

    return (
        <ViewComfyProvider>
            <div className="grid h-screen w-full pl-[53px]">
                <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
                <div className="flex flex-col">
                    {currentTab === TabValue.Playground && <PlaygroundPage />}
                    {currentTab === TabValue.WorkflowApi && <WorkflowApiPage />}
                </div>
            </div>
            <Toaster />
        </ViewComfyProvider>
    )
}
