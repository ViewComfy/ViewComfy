"use client"
import { Sidebar, TabValue } from "@/components/sidebar";

import { useState } from "react"
import { PlaygroundPage } from "../pages/playground/playground-page"
import { WorkflowApiPage } from "@/pages/workflow-api/workflow-api-page";
import { ViewComfyProvider } from "@/app/providers/view-comfy-provider";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

export const description =
    "An AI playground with a sidebar navigation and a main content area. The playground has a header with a settings drawer and a share button. The sidebar has navigation links and a user menu. The main content area shows a form to configure the model and messages."

export default function Page() {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";

    const [currentTab, setCurrentTab] = useState(viewMode ? TabValue.Playground : TabValue.WorkflowApi);
    const [popUp, setPopUp] = useState<boolean>(false);
    const [deploymentMessage, setDeploymentMessage] = useState<boolean>(false);

    return (
        <ViewComfyProvider>
            <div className="grid h-screen w-full pl-[53px]">
                <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} popUp={popUp} onPopUp={setPopUp} />
                <div className={`
                flex flex-col
                ${popUp ? 'opacity-50' : 'opacity-100'}
                `}>
                    {currentTab === TabValue.Playground && <PlaygroundPage />}
                    {currentTab === TabValue.WorkflowApi && <WorkflowApiPage />}
                </div>
            </div>
            {popUp && !deploymentMessage &&
                <>
                <div className="absolute inset-0 bg-black/50 z-10" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-20">
                <h2 className="text-xl font-bold mb-4">Menu</h2>
                    <span className="text-sm mb-4">Deployment name</span>
                        <input type="text" placeholder="My ViewComfy App" className="w-full mb-4 p-2 border rounded" />
                    <span className="text-sm mb-4">Hardware</span>
                    <select className="w-full mb-4 p-2 border rounded">
                        <option value="" disabled>Select Hardware</option>
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                        <option>X-Large</option>
                    </select>
                    <div className="flex gap-4 mb-4">
                        <div className="w-1/2">
                            <span className="text-sm mb-4">Minimum instances</span>
                            <input
                                type="number"
                                placeholder="Min value"
                                className="w-full p-2 border rounded"
                                />
                        </div>
                        <div className="w-1/2">
                            <span className="text-sm mb-4">Maximum instances</span>
                            <input
                                type="number"
                                placeholder="Max value"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                    <Button 
                        className="mt-4 px-4 py-2"
                        onClick={() => {
                            setTimeout(() => {
                                setPopUp(false)
                                setDeploymentMessage(true)
                            }, 500)
                        }}
                    >
                        Deploy
                    </Button>
                </div>
            </>
            }
            {deploymentMessage && <DeploymentMessage setPopUp={setPopUp} setDeploymentMessage={setDeploymentMessage} />}
            <Toaster />
        </ViewComfyProvider>
    )
}


function DeploymentMessage({setPopUp, setDeploymentMessage}: {setPopUp: (value: boolean) => void, setDeploymentMessage: (value: boolean) => void}) {
    return (
        <>
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-20">
                <h2 className="text-xl font-bold mb-4">Deployment successful</h2>
                <p className="text-sm mb-4">Your ViewComfy app is being deployed.</p>
                <div className="flex items-center bg-gray-100 p-2 rounded w-[420px]">
                    <input 
                        type="text" 
                        value="https://your-viewcomfy-app.example.com" 
                        readOnly 
                        className="bg-transparent flex-grow outline-none"
                    />
                    <Button 
                        onClick={() => navigator.clipboard.writeText("https://n6royv7y39x7fx-8000.proxy.runpod.net/")}
                        className="ml-2 px-2 py-1"
                    >
                        Copy
                    </Button>
                </div>
                <Button 
                        className="mt-4 px-4 py-2"
                        onClick={() => {
                            setPopUp(false)
                            setDeploymentMessage(false)
                        }}
                    >
                        Ok
                    </Button>
            </div>
        </>
    )
}
