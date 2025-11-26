import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app";
import { useRouter } from "next/navigation";

export function AppCard({
    className,
    app
}: { app: IViewComfyApp, className?: string }) {
    const router = useRouter();

    const onAppButtonClick = () => {
        router.push(`/playground?appId=${app.appId}`)
    }

    return (
        <Card
            className={cn("w-full h-[260px] flex flex-col", className)}
        >
            <CardHeader className="p-3 pb-2 flex-shrink-0">
                <CardTitle className="text-base line-clamp-1">{app.name}</CardTitle>
            </CardHeader>
            <div className="relative w-full h-[140px] flex-shrink-0 px-3">
                <img
                    src={app.viewComfyJson["appImg"] as string || "/view_comfy_logo.svg"}
                    alt={"an image"}
                    className="w-full h-full object-cover rounded-lg"
                />
            </div>
            <CardContent className="flex-1 p-3 pt-2 min-h-0">
                <CardDescription className="text-xs line-clamp-2">
                    {app.description}
                </CardDescription>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex-shrink-0">
                <Button onClick={onAppButtonClick} className="w-full h-8 text-sm"> Use App </Button>
            </CardFooter>
        </Card>
    );
}
