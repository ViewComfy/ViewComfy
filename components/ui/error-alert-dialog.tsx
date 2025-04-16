import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function ErrorAlertDialog(props: { open: boolean, errorTitle?: string, errorDescription: React.ReactNode, onClose: () => void }) {
    return (
        <AlertDialog open={props.open}>
            <AlertDialogContent className="w-full max-w-[90vw] md:max-w-[60vw] lg:max-w-[50vw]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{props.errorTitle || "Error"}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {props.errorDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col items-start">
                    <p className={cn("text-sm text-muted-foreground w-full mb-4")}>
                        If you find any bug or need help, you can join our&nbsp;
                        <Link href="https://discord.gg/DXubrz5R7E" target="_blank" rel="noopener noreferrer" className="underline">Discord</Link> or <br/> create an issue on <Link href="https://github.com/ViewComfy/ViewComfy" target="_blank" rel="noopener noreferrer" className="underline">GitHub</Link>
                    </p>
                    <AlertDialogAction onClick={props.onClose}>Ok</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}