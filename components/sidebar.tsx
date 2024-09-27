import { Triangle, SquareTerminal, Bot, Code2, Book, Settings2, LifeBuoy, SquareUser, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipButton } from "@/components/ui/tooltip-button"
import Link from "next/link";


export enum TabValue {
    Playground = 'playground',
    Models = 'models',
    API = 'api',
    Documentation = 'documentation',
    Settings = 'settings',
    Help = 'help',
    Account = 'account',
    WorkflowApi = 'workflow_api'
}


interface SidebarProps {
    currentTab: TabValue;
    onTabChange: (tab: TabValue) => void;
}

const PlaygroundButton = ({ currentTab, onTabChange }: SidebarProps) => {
    return (
        <TooltipButton
            icon={<SquareTerminal className="size-5" />}
            label="Playground"
            tooltipContent="Playground"
            className={currentTab === TabValue.Playground ? 'bg-muted' : ''}
            onClick={() => onTabChange(TabValue.Playground)}
        />
    )
}
export function Sidebar({ currentTab, onTabChange }: SidebarProps) {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true" ? true : false;
    return (
        <aside className="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
            <div className="border-b p-2">
                <Button variant="outline" size="icon" aria-label="Home">
                    <Triangle className="size-5 fill-foreground" />
                </Button>
            </div>
            <nav className="grid gap-1 p-2">
                {viewMode ? (<PlaygroundButton currentTab={currentTab} onTabChange={onTabChange} />) : (
                    <>
                        <TooltipButton
                            icon={<FileJson className="size-5" />}
                            label="Workflow_api.json"
                            tooltipContent="Form Editor"
                            className={currentTab === TabValue.WorkflowApi ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.WorkflowApi)}
                        />
                        <PlaygroundButton currentTab={currentTab} onTabChange={onTabChange} />
                        {/* <TooltipButton
                            icon={<Bot className="size-5" />}
                            label="Models"
                            tooltipContent="Models"
                            className={currentTab === TabValue.Models ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.Models)}
                        />
                        <TooltipButton
                            icon={<Code2 className="size-5" />}
                            label="API"
                            tooltipContent="API"
                            className={currentTab === TabValue.API ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.API)}
                        />
                        <TooltipButton
                            icon={<Book className="size-5" />}
                            label="Documentation"
                            tooltipContent="Documentation"
                            className={currentTab === TabValue.Documentation ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.Documentation)}
                        />
                        <TooltipButton
                            icon={<Settings2 className="size-5" />}
                            label="Settings"
                            tooltipContent="Settings"
                            className={currentTab === TabValue.Settings ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.Settings)}
                        /> */}
                    </>
                )}
            </nav>
            <nav className="mt-auto grid gap-1 p-2">
                <Link href="https://github.com/ViewComfy/ViewComfy" target="_blank" rel="noopener noreferrer">
                    <TooltipButton
                        icon={<LifeBuoy className="size-5" />}
                        label="Help"
                        tooltipContent="Help"
                        className={`mt-auto ${currentTab === TabValue.Help ? 'bg-muted' : ''}`}
                    />
                </Link>
                {/* <TooltipButton
                    icon={<SquareUser className="size-5" />}
                    label="Account"
                    tooltipContent="Account"
                    className={`mt-auto ${currentTab === TabValue.Account ? 'bg-muted' : ''}`}
                    onClick={() => onTabChange(TabValue.Account)}
                /> */}
            </nav>
        </aside>
    )
}