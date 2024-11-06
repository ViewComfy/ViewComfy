"use client"

import * as React from "react"
import {
    CaretSortIcon,
    CheckIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import type { IViewComfy } from "@/app/providers/view-comfy-provider";
import { useEffect } from "react"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface WorkflowSwitcherProps extends PopoverTriggerProps {
    viewComfys: IViewComfy[];
    currentViewComfy: IViewComfy;
    onSelectChange: (data: IViewComfy) => void;

}

export default function WorkflowSwitcher({ className, currentViewComfy, viewComfys, onSelectChange }: WorkflowSwitcherProps) {
    const [open, setOpen] = React.useState(false);
    const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
    const [currentWorkflow, setCurrentWorkflow] = React.useState<IViewComfy>(currentViewComfy);

    useEffect(() => {
        setCurrentWorkflow(currentViewComfy);
    }, [currentViewComfy]);

    const groups = [
        {
            label: "Workflows",
            viewComfys
        },
    ];

    return (
        <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a team"
                        className={cn("w-full max-w-[300px] justify-between", className)}
                    >
                        {currentWorkflow.viewComfyJSON.title}
                        <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search team..." />
                        <CommandList>
                            <CommandEmpty>No team found.</CommandEmpty>
                            {groups.map((group) => (
                                <CommandGroup key={group.label} heading={group.label}>
                                    {group.viewComfys.map((viewComfy) => (
                                        <CommandItem
                                            key={viewComfy.viewComfyJSON.id}
                                            onSelect={() => {
                                                onSelectChange(viewComfy)
                                                setOpen(false)
                                            }}
                                            className="text-sm"
                                        >
                                            {viewComfy.viewComfyJSON.title}
                                            <CheckIcon
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    currentWorkflow.viewComfyJSON.id === viewComfy.viewComfyJSON.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </CommandList>
                        <CommandSeparator />
                        {/* <CommandList>
                            <CommandGroup>
                                <DialogTrigger asChild>
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false)
                                            setShowNewTeamDialog(true)
                                        }}
                                    >
                                        <PlusCircledIcon className="mr-2 h-5 w-5" />
                                        Add Workflow
                                    </CommandItem>
                                </DialogTrigger>
                            </CommandGroup>
                        </CommandList> */}
                    </Command>
                </PopoverContent>
            </Popover>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create team</DialogTitle>
                    <DialogDescription>
                        Add a new team to manage products and customers.
                    </DialogDescription>
                </DialogHeader>
                <div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
                        Cancel
                    </Button>
                    <Button type="submit">Continue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
