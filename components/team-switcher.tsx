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
import { useState } from "react"
import { ITeam } from "@/app/interfaces/user"
import { useBoundStore } from "@/stores/bound-store"
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function TeamSwitch() {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { currentTeam, setCurrentTeam } = useBoundStore();
    const { user, isLoading } = useUser();
    const router = useRouter();

    const onSelectChanged = (team: ITeam) => {
        setCurrentTeam(team);
        router.push("/apps");
    };

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
                        {currentTeam ? <>{currentTeam.slug}</> : <>Loading...</>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <TeamList setOpen={setOpen} onSelectChanged={onSelectChanged} teams={user.teams} />
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
                    <TeamList setOpen={setOpen} onSelectChanged={onSelectChanged} teams={user.teams} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function TeamList({
    setOpen,
    onSelectChanged,
    teams,
}: {
    setOpen: (open: boolean) => void
        onSelectChanged: (value: ITeam) => void
    teams: ITeam[]
}) {

    const { currentTeam } = useBoundStore();
    const onSelectFind = (value: string) => {
        const found = teams.find((priority) => priority.slug === value);
        if (found) {
            onSelectChanged(found);
            setOpen(false);
        }
    }

    return (
        <Command>
            <CommandInput placeholder="Filter teams..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {teams.map((team) => (
                        <CommandItem
                            key={team.id}
                            value={team.slug}
                            onSelect={onSelectFind}
                        >
                            {team.slug}
                            <CheckIcon
                                className={cn(
                                    "ml-auto h-4 w-4",
                                        currentTeam?.id ===
                                        team.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                )}
                            />
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
