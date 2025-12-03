import { useBoundStore } from "@/stores/bound-store";
import { useAuth } from "@clerk/nextjs";
import { Loader2, CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { buildViewComfyJSON } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IViewComfyState } from "@/app/providers/view-comfy-provider";
import { ResponseError } from "@/app/models/errors";
import { IViewComfyApp } from "@/app/interfaces/viewcomfy-app";
import { toast } from "sonner"

const formSchema = z.object({
    description: z
        .string()
        .min(2, {
            error: "Description must be at least 2 characters.",
        })
        .max(255, {
            error: "Description must be at most 255 characters.",
        }),
    name: z
        .string()
        .min(2, {
            error: "ViewComfy App name must be at least 2 characters.",
        })
        .max(255, {
            error: "ViewComfy App name must be at most 255 characters.",
        }),
    appHub: z.boolean(),
    projectId: z.string().min(1, { error: "Please select a project" }),
})

interface IDeployAppDialogProps {
    viewComfyState: IViewComfyState;
}

export function DeployAppDialog(props: IDeployAppDialogProps) {
    const { viewComfyState } = props;
    const { currentTeam, createViewComfyApp, isCRUDViewComfyAppLoading, isCRUDViewComfyAppError } = useBoundStore();
    const { getToken } = useAuth();
    const [isFormDisabled] = useState(isCRUDViewComfyAppLoading);
    const [projectIdP] = useState(currentTeam ? currentTeam.projects[0].id.toString() : "");
    const [error, setError] = useState<ResponseError | undefined>(
        undefined,
    );
    const [viewComfyApp, setViewComfyApp] = useState<IViewComfyApp | undefined>(undefined);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        values: {
            description: "",
            name: "",
            appHub: false,
            projectId: projectIdP,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const token = await getToken({ template: "long_token" });
        const viewComfyJson = buildViewComfyJSON({ viewComfyState });
        if (!token || !currentTeam || !values.projectId || !viewComfyJson) {
            return;
        }

        const response = await createViewComfyApp({
            name: values.name,
            description: values.description,
            teamId: currentTeam.id,
            token: token,
            projectId: Number(values.projectId),
            viewComfyJson: viewComfyJson,
            isActiveInAppHub: values.appHub,
        });

        if (response) {
            setViewComfyApp(response.viewComfyApp);
        }
    }

    const onCloseDialog = () => {
        form.reset();
        setError(undefined);
        setViewComfyApp(undefined);
    }

    const getAppUrl = () => {
        if (!viewComfyApp) {
            return "";
        }
        return `https://playground.viewcomfy.com/playground?appId=${viewComfyApp.appId}`;
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast.success("Copied to clipboard");
    };

    useEffect(() => {
        setError(isCRUDViewComfyAppError);
    }, [isCRUDViewComfyAppError]);

    if (!currentTeam) {
        return;
    }

    return (
        <Dialog onOpenChange={onCloseDialog}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="form-deplopy-app">
                <DialogTrigger asChild>
                    <Button type="button" className="w-full">Deploy App</Button>
                </DialogTrigger>
                <DialogContent className="min-w-[700px]">
                    {viewComfyApp ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Deployment Successful</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="rounded-full bg-emerald-100 p-3">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {viewComfyApp.name}
                                    </h3>
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <Button
                                            variant="link"
                                            className=""
                                            onClick={() => {
                                                window.open(getAppUrl(), "_blank");
                                            }}
                                        >
                                            App
                                            <ExternalLink size={12} className="hover:underline" />
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                copyLink(getAppUrl());
                                            }}
                                        >
                                            App Url
                                            <Copy size={12} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button onClick={onCloseDialog}>Done</Button>
                                </DialogClose>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Deploy Your ViewComfy App</DialogTitle>
                            </DialogHeader>
                            <FieldGroup>
                                <div className="flex gap-x-6">
                                    <div className="flex-1 space-y-2">
                                        <Controller
                                            control={form.control}
                                            name="name"
                                            render={({ field, fieldState }) => {
                                                const isInvalid = fieldState.invalid
                                                return (
                                                    <FieldSet data-invalid={isInvalid} disabled={isFormDisabled}>
                                                        <Field>
                                                            <FieldLabel htmlFor="form-deplopy-app">
                                                                Name
                                                            </FieldLabel>
                                                            <Input
                                                                placeholder="e.g. Marketing Campaigns"
                                                                id="form-deplopy-app"
                                                                aria-invalid={fieldState.invalid}
                                                                {...field}
                                                            />
                                                        </Field>
                                                        {isInvalid && <FieldError errors={[fieldState.error]} />}
                                                    </FieldSet>
                                                )
                                            }}
                                        />
                                        <Controller
                                            control={form.control}
                                            name="description"
                                            render={({ field, fieldState }) => {
                                                const isInvalid = fieldState.invalid
                                                return (
                                                    <FieldSet data-invalid={isInvalid} disabled={isFormDisabled}>
                                                        <Field>
                                                            <FieldLabel htmlFor="form-deplopy-app">
                                                                Description
                                                            </FieldLabel>

                                                            <Input
                                                                placeholder="e.g. Marketing Tools for campaign creation"
                                                                id="form-deplopy-app"
                                                                aria-invalid={fieldState.invalid}
                                                                {...field}
                                                            />
                                                        </Field>
                                                        {isInvalid && <FieldError errors={[fieldState.error]} />}
                                                    </FieldSet>
                                                )
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                    <Controller
                                            name="projectId"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="form-deplopy-app">
                                                        Project
                                                    </FieldLabel>
                                                    <Select
                                                        name={field.name}
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger
                                                            id="form-deplopy-app"
                                                            aria-invalid={fieldState.invalid}
                                                        >
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {currentTeam.projects.map((p) => (
                                                                <SelectItem key={p.id.toString()} value={p.id.toString()}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                        <Controller
                                            control={form.control}
                                            name="appHub"
                                            render={({ field, fieldState }) => {
                                                const isInvalid = fieldState.invalid
                                                return (
                                                    <FieldSet data-invalid={isInvalid} disabled={isFormDisabled}>
                                                        <Field orientation="horizontal">
                                                            <FieldContent>
                                                                <FieldLabel htmlFor="form-deplopy-app">
                                                                    App Hub
                                                                </FieldLabel>
                                                                <FieldDescription>
                                                                    Show App in the App Hub
                                                                </FieldDescription>
                                                            </FieldContent>
                                                            <Switch
                                                                id="form-rhf-switch-twoFactor"
                                                                name={field.name}
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                aria-invalid={fieldState.invalid}
                                                                disabled={isFormDisabled}
                                                                className="data-[state=checked]:bg-green-500"
                                                            />
                                                        </Field>
                                                        {isInvalid && <FieldError errors={[fieldState.error]} />}
                                                    </FieldSet>
                                                )
                                            }}
                                        />
                                    </div>
                                </div>
                            </FieldGroup>
                            <DialogFooter>
                                <div>
                                    {error && <p className="text-red-500 text-sm">{error.errorMsg}</p>}
                                    {error && <p className="text-red-500 text-sm">{error.errorDetails}</p>}
                                </div>
                                <DialogClose asChild>
                                    <Button variant="outline" onClick={onCloseDialog}>Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={isFormDisabled}
                                >
                                    {isCRUDViewComfyAppLoading && (
                                        <Loader2 className="animate-spin" />
                                    )}
                                    Deploy
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </form>
        </Dialog>
    );
}

export function validateOrThrowViewComfyJson(
    viewComfyJson: Record<string, unknown>,
) {
    if (!viewComfyJson) {
        throw new Error("Workflow is required");
    }

    if (viewComfyJson.last_node_id) {
        throw new Error(
            "This is a workflow.json you need to use view_comfy.json",
        );
    }

    for (const key in viewComfyJson) {
        const node = viewComfyJson[key] as { [key: string]: unknown };
        if (node["inputs"] || node["class_type"]) {
            throw new Error(
                "This is a workflow_api.json you need to use view_comfy.json",
            );
        }
        break;
    }

    const workflowData = viewComfyJson as { file_type?: string } | undefined;
    if (workflowData?.file_type !== "view_comfy") {
        throw new Error(
            "We cannot parse this file, please use a valid view_comfy.json",
        );
    }

    return true;
}