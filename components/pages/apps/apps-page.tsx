"use client"
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Trash2, LayoutGrid } from "lucide-react";
import { useViewComfy, ActionType } from "@/app/providers/view-comfy-provider";

interface SavedApp {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    workflowData: any;
    createdAt: string;
}

export default function AppsPage() {
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [apps, setApps] = useState<SavedApp[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('viewcomfy-apps');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const deleteApp = (id: string) => {
        const updated = apps.filter(app => app.id !== id);
        setApps(updated);
        localStorage.setItem('viewcomfy-apps', JSON.stringify(updated));
    };

    const loadApp = (app: SavedApp) => {
        // Load the app's workflow into the editor
        if (app.workflowData) {
            viewComfyStateDispatcher({
                type: ActionType.UPDATE_CURRENT_VIEW_COMFY,
                payload: app.workflowData
            });
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Apps</h1>
                        <p className="text-sm text-muted-foreground">
                            Saved workflows ready to run
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {apps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No apps yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create a workflow in the Editor and save it as an app
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {apps.map((app) => (
                            <Card key={app.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-video bg-muted relative overflow-hidden">
                                    {app.thumbnail ? (
                                        <img
                                            src={app.thumbnail}
                                            alt={app.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <LayoutGrid className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">{app.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {app.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => loadApp(app)}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Run
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteApp(app.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
