"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useUser } from "@/hooks/use-data"
import { useEffect, useState } from "react"
import { ITeam } from "@/app/interfaces/user"
import { useBoundStore } from "@/stores/bound-store"

export function TeamSwitch() {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { currentTeam, setCurrentTeam } = useBoundStore();
    const { user, isLoading } = useUser();

    useEffect(() => {
        if (user && user?.teams.length > 0 && !currentTeam) {
            setCurrentTeam(user.teams[0]);
        }
    }, [user, currentTeam, setCurrentTeam]);

    if (isLoading || !user) {
        return <></>
    }

    if (user && user.teams.length === 1) {
        return <></>
    }

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[170px] justify-start">
                        {currentTeam ? <>{currentTeam.name}</> : <>+ Set status</>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <StatusList setOpen={setOpen} setCurrentTeam={setCurrentTeam} teams={user.teams} />
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start">
                    {currentTeam ? <>{currentTeam.name}</> : <></>}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t">
                    <StatusList setOpen={setOpen} setCurrentTeam={setCurrentTeam} teams={user.teams} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function StatusList({
    setOpen,
    setCurrentTeam,
    teams,
}: {
    setOpen: (open: boolean) => void
    setCurrentTeam: (value: ITeam) => void
    teams: ITeam[]
}) {

    const onSelectFind = (value: string) => {
        const found = teams.find((priority) => priority.name === value);
        if (found) {
            setCurrentTeam(found);
            setOpen(false)
        }
    }

    return (
        <Command>
            <CommandInput placeholder="Filter status..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {teams.map((team) => (
                        <CommandItem
                            key={team.id}
                            value={team.name}
                            onSelect={onSelectFind}
                        >
                            {team.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
