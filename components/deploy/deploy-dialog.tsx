import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function DeployDialog(args: {
    open: boolean,
    setOpen: (open: boolean) => void
}) {
    const { open, setOpen } = args;
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center">Deploy your workflow in the cloud</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 items-center gap-4">
                        <p className="text-sm mb-4 text-center">Want to run your app on the hardware of your choice? ViewComfy&apos;s deployment service is the easiest way to host ComfyUI workflow. Once deployed, you can call your workflow from the app with the API endpoint.</p>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <Button
                            className="mt-4 px-4 w-[150px]"
                            onClick={() => {
                                window.open('https://youtu.be/pIODXFU9sHw', '_blank');
                                setOpen(false)
                            }}
                        >
                            Deployment guide
                        </Button>
                        <Button
                            className="mt-4 px-4 w-[150px]"
                            onClick={() => {
                                window.open('https://app.viewcomfy.com/', '_blank');
                                setOpen(false)
                            }}
                        >
                            Deploy now
                        </Button>
                    </div>
                   
                </div>
                
            </DialogContent>
        </Dialog>
    )
}
