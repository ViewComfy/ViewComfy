import { SquareTerminal, LifeBuoy, FileJson, Cloud, SquarePlay } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipButton } from "@/components/ui/tooltip-button"
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query"
import { SettingsService } from "@/app/services/settings-service";

export enum TabValue {
    Playground = 'playground',
    Apps = 'apps',
    Editor = 'editor'
}

interface SidebarProps {
    currentTab: TabValue;
    onTabChange: (tab: TabValue) => void;
    deployWindow: boolean;
    onDeployWindow: (deployWindow: boolean) => void;
}

const settingsService = new SettingsService();

const SidebarButton = ({ icon, label, isActive, onClick, isSmallScreen }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, isSmallScreen: boolean }) => {
    if (isSmallScreen) {
        return (
            <TooltipButton
                icon={icon}
                label={label}
                tooltipContent={label}
                className={isActive ? 'bg-muted' : ''}
                onClick={onClick}
            />
        )
    }
    return (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={onClick}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </Button>
    )
}

export function Sidebar({ currentTab, onTabChange, deployWindow, onDeployWindow }: SidebarProps) {
    // const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const isSmallScreen = useMediaQuery("(max-width: 1024px)");

    return (
        <aside className={`flex flex-col h-full overflow-y-auto border-r bg-background transition-all duration-300 ${isSmallScreen ? 'w-12' : 'w-48'}`}>
            <nav className="grow space-y-2 p-2">
                {settingsService.getIsViewMode() ? (
                    <>
                        {settingsService.getIsRunningInViewComfy() &&
                            <SidebarButton
                                icon={<SquarePlay className="size-5" />}
                                label="Apps"
                                isActive={currentTab === TabValue.Apps}
                                onClick={() => onTabChange(TabValue.Apps)}
                                isSmallScreen={isSmallScreen}
                            />
                        }
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => onTabChange(TabValue.Playground)}
                            isSmallScreen={isSmallScreen}
                        />
                    </>
                ) : (
                    <>
                        <SidebarButton
                            icon={<FileJson className="size-5" />}
                            label="Editor"
                            isActive={currentTab === TabValue.Editor}
                            onClick={() => onTabChange(TabValue.Editor)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => onTabChange(TabValue.Playground)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<Cloud className="size-5" />}
                            label="Deploy"
                            isActive={deployWindow === true}
                            onClick={() => onDeployWindow(!deployWindow)}
                            isSmallScreen={isSmallScreen}
                        />
                    </>
                )}
            </nav>
            <nav className="sticky bottom-0 p-2 bg-background border-t">
                <Link href="https://github.com/ViewComfy/ViewComfy" target="_blank" rel="noopener noreferrer">
                    {isSmallScreen ? (
                        <TooltipButton
                            icon={<LifeBuoy className="size-5" />}
                            label="Help"
                            tooltipContent="Help"
                            variant="outline-solid"
                        />
                    ) : (
                        <Button variant="outline" className="w-full justify-start">
                            <LifeBuoy className="size-5 mr-2" />
                            Help
                        </Button>
                    )}
                </Link>
            </nav>
        </aside>
    )
}
