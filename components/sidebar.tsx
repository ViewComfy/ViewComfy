import { SquareTerminal, LifeBuoy, FileJson, Cloud } from "lucide-react"
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
    popUp: boolean;
    onPopUp: (popUp: boolean) => void;
}

const PlaygroundButton = ({ currentTab, onTabChange }: { currentTab: TabValue, onTabChange: (tab: TabValue) => void }) => {
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
export function Sidebar({ currentTab, onTabChange, popUp, onPopUp }: SidebarProps) {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true" ? true : false;
    return (
        <aside className="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
            <div className="border-b p-2 pb-[7.5px]">
                <Button variant="outline" size="icon" aria-label="Home">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 900 900" version="1.1"><path d="M 124.036 67.244 C 124.056 67.385, 179.297 239.625, 246.793 450 L 369.514 832.500 449.491 832.500 L 529.467 832.500 652.710 450 C 720.493 239.625, 775.963 67.385, 775.976 67.244 C 775.989 67.103, 741.267 67.103, 698.816 67.244 L 621.633 67.500 568.862 253.500 C 539.838 355.800, 507.524 469.650, 497.052 506.500 C 473.710 588.640, 460.304 643.305, 453.029 686 C 451.483 695.075, 449.973 701.825, 449.673 701 C 449.374 700.175, 448.612 696.125, 447.979 692 C 444.357 668.392, 434.033 621.373, 424.485 585 C 415.294 549.987, 407.822 523.569, 343.163 297.500 L 277.379 67.500 200.690 67.244 C 158.510 67.103, 124.016 67.103, 124.036 67.244" stroke="none" fill="#143434" fillRule="evenodd" /><path d="M 49 1.571 C 45.975 2.363, 39.690 4.878, 35.034 7.161 C 19.019 15.012, 6.111 31.298, 1.510 49.460 C 0.176 54.726, -0 101.406, -0 450 C -0 798.594, 0.176 845.274, 1.510 850.540 C 7.409 873.823, 26.177 892.591, 49.460 898.490 C 54.726 899.824, 101.406 900, 450 900 C 798.594 900, 845.274 899.824, 850.540 898.490 C 872.890 892.828, 891.309 875.183, 897.503 853.500 C 898.446 850.200, 899.618 846.719, 900.109 845.764 C 901.154 843.726, 901.352 52.314, 900.307 53.360 C 899.926 53.741, 899.023 51.679, 898.302 48.776 C 897.580 45.874, 895.122 39.690, 892.839 35.034 C 884.988 19.019, 868.702 6.111, 850.540 1.510 C 845.272 0.175, 798.690 0.008, 449.540 0.066 C 109.152 0.123, 53.739 0.331, 49 1.571 M 0.495 450 C 0.495 668.075, 0.610 757.288, 0.750 648.250 C 0.890 539.213, 0.890 360.788, 0.750 251.750 C 0.610 142.713, 0.495 231.925, 0.495 450 M 124.036 67.244 C 124.056 67.385, 179.297 239.625, 246.793 450 L 369.514 832.500 449.491 832.500 L 529.467 832.500 652.710 450 C 720.493 239.625, 775.963 67.385, 775.976 67.244 C 775.989 67.103, 741.267 67.103, 698.816 67.244 L 621.633 67.500 568.862 253.500 C 539.838 355.800, 507.524 469.650, 497.052 506.500 C 473.710 588.640, 460.304 643.305, 453.029 686 C 451.483 695.075, 449.973 701.825, 449.673 701 C 449.374 700.175, 448.612 696.125, 447.979 692 C 444.357 668.392, 434.033 621.373, 424.485 585 C 415.294 549.987, 407.822 523.569, 343.163 297.500 L 277.379 67.500 200.690 67.244 C 158.510 67.103, 124.016 67.103, 124.036 67.244" stroke="none" fill="#fbfbfb" fillRule="evenodd" /></svg>
                </Button>
            </div>
            <nav className="grid gap-1 p-2">
                {viewMode ? (<PlaygroundButton currentTab={currentTab} onTabChange={onTabChange} />) : (
                    <>
                        <TooltipButton
                            icon={<FileJson className="size-5"/>}
                            label="Workflow_api.json"
                            tooltipContent="Form Editor"
                            className={currentTab === TabValue.WorkflowApi ? 'bg-muted' : ''}
                            onClick={() => onTabChange(TabValue.WorkflowApi)}
                        />
                        <PlaygroundButton currentTab={currentTab} onTabChange={onTabChange} />
                        <TooltipButton
                            icon={<Cloud className="size-5" />}
                            label="Deploy"
                            tooltipContent="Deploy"
                            className={popUp === true ? 'bg-muted' : ''}
                            onClick={() => onPopUp(!popUp)}
                        />
                        {/* <TooltipButton
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