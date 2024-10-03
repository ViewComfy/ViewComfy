import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
                <AlertDialogFooter>
                    <AlertDialogAction onClick={props.onClose}>Ok</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}