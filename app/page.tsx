"use client"
import { Sidebar, TabValue } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav"
import { useState } from "react"
import PlaygroundPage from "@/components/pages/playground/playground-page";
import ViewComfyPage from "@/components/pages/view-comfy/view-comfy-page";
import { ViewComfyProvider } from "@/app/providers/view-comfy-provider";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

// export const description =
//     "An AI playground with a sidebar navigation and a main content area. The playground has a header with a settings drawer and a share button. The sidebar has navigation links and a user menu. The main content area shows a form to configure the model and messages."

export default function Page() {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [currentTab, setCurrentTab] = useState(viewMode ? TabValue.Playground : TabValue.WorkflowApi);
    const [deployWindow, setDeployWindow] = useState<boolean>(false);
    return (
        <TooltipProvider>
        <ViewComfyProvider>
            <div className="flex flex-col h-screen w-full overflow-x-auto overflow-y-hidden">
                <TopNav />
                <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
                    <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} deployWindow={deployWindow} onDeployWindow={setDeployWindow}/>
                    <main className="flex-1 overflow-x-auto overflow-y-hidden">
                        {currentTab === TabValue.Playground && <PlaygroundPage />}
                        {currentTab === TabValue.WorkflowApi && <ViewComfyPage />}
                    </main>
                </div>
            </div>
            {deployWindow &&
            <>
                <Button className="absolute inset-0 bg-black/50 z-10" 
                    onClick={() => setDeployWindow(false)}
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-20">
                    <h2 className="text-xl font-bold mb-4 text-center">Deploy your workflow in the cloud</h2>
                    <p className="text-sm mb-4 text-center">Want to run your app on the hardware of your choice? ViewComfy&apos;s deployment service is the easiest way to host ComfyUI workflow. Once deployed, you can call your workflow from the app with the API endpoint.</p>
                    <div className="flex justify-center py-2 space-x-4">
                    <Button 
                            className="mt-4 px-4 w-[150px]"
                            onClick={() => {
                                window.open('https://youtu.be/pIODXFU9sHw', '_blank');
                                setDeployWindow(false)
                            }}
                        >
                            Deployment guide
                        </Button>     
                        <Button 
                            className="mt-4 px-4 w-[150px]"
                            onClick={() => {
                                window.open('https://app.viewcomfy.com/', '_blank');
                                setDeployWindow(false)
                            }}
                        >
                            Deploy now
                        </Button>
                    </div>
                </div>
            </>
            }
            <Toaster />
        </ViewComfyProvider>
        </TooltipProvider>
    )
}
