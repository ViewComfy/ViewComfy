"use client"
import { Sidebar, TabValue } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav"
import { useState } from "react"
import PlaygroundPage from "@/components/pages/playground/playground-page";
import ViewComfyPage from "@/components/pages/view-comfy/view-comfy-page";
import { ViewComfyProvider } from "@/app/providers/view-comfy-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DeployDialog } from "@/components/deploy/deploy-dialog";

export default function AppContent() {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [currentTab, setCurrentTab] = useState(viewMode ? TabValue.Playground : TabValue.WorkflowApi);
    const [deployWindow, setDeployWindow] = useState<boolean>(false);

    return (
        <TooltipProvider>
            <ViewComfyProvider>
                <div className="flex flex-col h-screen w-full overflow-x-auto overflow-y-hidden">
                    <TopNav />
                    <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
                        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} deployWindow={deployWindow} onDeployWindow={setDeployWindow} />
                        <main className="flex-1 overflow-x-auto overflow-y-hidden">
                            {currentTab === TabValue.Playground && <PlaygroundPage />}
                            {currentTab === TabValue.WorkflowApi && <ViewComfyPage />}
                        </main>
                    </div>
                </div>
                <DeployDialog open={deployWindow} setOpen={setDeployWindow} />
                <Toaster />
            </ViewComfyProvider>
        </TooltipProvider>
    );
}