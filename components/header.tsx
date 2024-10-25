import Link from "next/link";
import { ModeToggle } from "./toggle";
import { Button } from "./ui/button";

export function Header({ title, children }: { title: string, children?: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-10 flex h-[53px] items-center gap-1 bg-background px-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            {children}
        </header>
    )
}
