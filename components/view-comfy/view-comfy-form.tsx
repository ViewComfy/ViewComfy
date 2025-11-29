
import React from "react";
import { useFieldArray, type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import type { IViewComfyBase } from "@/app/providers/view-comfy-provider";
import type { IInputField } from "@/lib/workflow-api-parser";
import { parseWorkflowApiTypeToInputHtmlType } from "@/components/pages/view-comfy/view-comfy-form-editor";
import { Textarea } from "@/components/ui/textarea";
import { CHECKBOX_STYLE, FORM_STYLE, TEXT_AREA_STYLE } from "@/components/styles";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Info, Check, SquarePen, MoveUp, MoveDown, Brush } from "lucide-react";
import { Dropzone } from "../ui/dropzone";
import { ChevronsUpDown } from "lucide-react"
import { AutosizeTextarea } from "../ui/autosize-text-area"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState, useEffect, useRef } from "react";
import { getComfyUIRandomSeed, cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { SelectableImage } from "@/components/comparison/selectable-image";
import { SettingsService } from "@/app/services/settings-service";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ActionType, useViewComfy } from "@/app/providers/view-comfy-provider";
import { MaskEditor } from "@/components/ui/mask-editor";
import { ImageMasked } from "@/app/models/prompt-result";
import { useBoundStore } from "@/stores/bound-store";
import { IWorkflow } from "@/app/interfaces/workflow";


interface IInputForm extends IInputField {
    id: string;
}


const settingsService = new SettingsService();
const validateViewComfyEndpoint = (endpoint: string | undefined, workflows: IWorkflow[] | undefined) => {
    if (!settingsService.getIsRunningInViewComfy()) {
        return true;
    }

    if (workflows) {
        const found = workflows.some(w => w.apiUrl === endpoint);
        return found;
    }

    return endpoint && endpoint.startsWith("https://viewcomfy");
}

export function ViewComfyForm(args: {

    form: UseFormReturn<IViewComfyBase, any, IViewComfyBase>,

    onSubmit: (data: any) => void,

    inputFieldArray: UseFieldArrayReturn<any>, advancedFieldArray: UseFieldArrayReturn<any>,
    editMode?: boolean,
    downloadViewComfyJSON?: (data: IViewComfyBase) => void,
    children?: React.ReactNode,
    isLoading?: boolean

}) {
    const { form, onSubmit, inputFieldArray, advancedFieldArray, editMode = false, isLoading = false, downloadViewComfyJSON } = args;
    const [editDialogInput, setShowEditDialogInput] = useState<IEditFieldDialog | undefined>(undefined);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const { workflows } = useBoundStore();
    const viewcomfyEndpointRef = useRef<HTMLDivElement>(null);
    const hasInitializedEndpoint = useRef(false);
    const { errors } = form.formState;
    const viewcomfyEndpointError = errors.viewcomfyEndpoint;

    useEffect(() => {
        if (viewcomfyEndpointError && viewcomfyEndpointRef.current) {
            viewcomfyEndpointRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [viewcomfyEndpointError]);



    const handleSaveSubmit = (data: IViewComfyBase) => {
        try {
            if (onSubmit) {
                onSubmit(data);
            }
            const current = viewComfyState.currentViewComfy;
            if (current) {
                const id = current.viewComfyJSON.id;
                viewComfyStateDispatcher({
                    type: ActionType.UPDATE_VIEW_COMFY,
                    payload: {
                        id,
                        viewComfy: {
                            viewComfyJSON: { ...data, id },
                            file: viewComfyState.viewComfyDraft?.file,
                            workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON,
                        }
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (hasInitializedEndpoint.current) {
            return;
        }
        const value = form.getValues("viewcomfyEndpoint");
        if (settingsService.getIsRunningInViewComfy() && workflows) {
            hasInitializedEndpoint.current = true;
            if (!value) {
                const newEndpoint = workflows[0].apiUrl;
                form.setValue("viewcomfyEndpoint", newEndpoint, {
                    shouldDirty: true,
                    shouldValidate: true
                });
                handleSaveSubmit({
                    ...form.getValues(),
                    viewcomfyEndpoint: newEndpoint
                });
            } else {
                const found = workflows.some(w => w.apiUrl === value);
                if (!found) {
                    form.setError("viewcomfyEndpoint", { type: "custom", message: "The API endpoint URL belongs to another team, you can switch the team in the bottom left or pick a new endpoint" }, { shouldFocus: true })
                }
            }
        }
    }, [workflows]);


    // Custom remove handlers that use replace() to avoid value sync issues
    // When using remove(), indices shift and form field registrations can get out of sync
    // If inputIndex is provided, removes a specific input within the group; otherwise removes the entire group
    const handleRemoveInput = ({ groupIndex, inputIndex }: { groupIndex: number, inputIndex?: number }) => {
        if (inputIndex !== undefined) {
            const currentInputs = form.getValues(`inputs.${groupIndex}.inputs`) as any[];
            const remainingInputs = currentInputs.filter((_, idx) => idx !== inputIndex);
            form.setValue(`inputs.${groupIndex}.inputs`, remainingInputs);
        } else {
            const currentFields = inputFieldArray.fields;
            const remainingFields = currentFields.filter((_, idx) => idx !== groupIndex);
            const cleanedFields = remainingFields.map(({ id, ...rest }) => rest);
            inputFieldArray.replace(cleanedFields as any);
        }
        handleSaveSubmit(form.getValues());
    };

    const handleRemoveAdvanced = ({ groupIndex, inputIndex }: { groupIndex: number, inputIndex?: number }) => {
        if (inputIndex !== undefined) {
            const currentInputs = form.getValues(`advancedInputs.${groupIndex}.inputs`) as any[];
            const remainingInputs = currentInputs.filter((_, idx) => idx !== inputIndex);
            form.setValue(`advancedInputs.${groupIndex}.inputs`, remainingInputs);
        } else {
            const currentFields = advancedFieldArray.fields;
            const remainingFields = currentFields.filter((_, idx) => idx !== groupIndex);
            const cleanedFields = remainingFields.map(({ id, ...rest }) => rest);
            advancedFieldArray.replace(cleanedFields as any);
        }
        handleSaveSubmit(form.getValues());
    };

    const getDefaultValue = () => {
        if (workflows) {
            return workflows[0].apiUrl
        }
    }
    return (
        <>
            <EditFieldDialog showEditDialog={editDialogInput} setShowEditDialog={setShowEditDialogInput} form={form} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full w-full">

                    <div className="flex flex-row gap-x-2 flex-1 min-h-0">
                        <div className='flex-col flex-1 items-start gap-4 flex mr-1 min-h-0'>
                            <div id="inputs-form" className="flex flex-col w-full h-full">
                                <ScrollArea className={"flex-1 px-[5px] pr-4"}>
                                    <div className={cn("grid w-full items-start gap-4", !editMode && "pb-24")}>
                                        {editMode && (
                                            <div className="grid gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name="title"
                                                    render={({ field }) => (
                                                        <FormItem key="title" className="m-1">
                                                            <FormLabel>Title</FormLabel>
                                                            <FormControl>
                                                                <Input className="" placeholder="The name of your workflow" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="description"
                                                    render={({ field }) => (
                                                        <FormItem key="description" className="m-1">
                                                            <FormLabel>Description</FormLabel>
                                                            <FormControl>
                                                                <Textarea placeholder="The description of your workflow" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="viewcomfyEndpoint"
                                                    rules={{
                                                        required: settingsService.getIsRunningInViewComfy() ? "Please pick a workflow to connect to the App" : false,
                                                        validate: {
                                                            endpoint: (value) => (validateViewComfyEndpoint(value, workflows)) || "The API endpoint URL belongs to another team, you can switch the team in the bottom left or pick a new endpoint",
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <FormItem key="viewcomfyEndpoint" className="m-1" ref={viewcomfyEndpointRef}>
                                                            <FormLabel>
                                                                ViewComfy Endpoint {!settingsService.getIsRunningInViewComfy() && <span>(optional)</span>}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="text-muted-foreground"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                        >
                                                                            <Info className="size-5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="max-w-[300px]">
                                                                        <p>
                                                                            You can run your workflow on a cloud GPU by deploying it on ViewComfy first.
                                                                            To get started, select deploy on the left hand side menu.
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </FormLabel>
                                                            <FormControl
                                                            >
                                                                {settingsService.getIsRunningInViewComfy() ? (
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value || getDefaultValue()}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className={"max-h-[300px]"}>
                                                                            {workflows?.map((workflow) => {
                                                                                return <SelectItem key={workflow.id} value={workflow.apiUrl}>{workflow.name}</SelectItem>
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>

                                                                ) : (
                                                                    <Input placeholder="ViewComfy endpoint" {...field} />
                                                                )}
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="textOutputEnabled"
                                                    render={({ field }) => (
                                                        <FormItem key="textOutputEnabled" className="">
                                                            <FormControl>
                                                                <div className={"flex ml-0.5 space-x-2 pt-2 mb-[-5px]"}>
                                                                    <FormLabel>Enable text output</FormLabel>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormDescription className="pt-2 pb-2">
                                                                Text output is in beta and can lead to unexpected text being rendered
                                                            </FormDescription>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="showOutputFileName"
                                                    render={({ field }) => (
                                                        <FormItem key="showOutputFileName" className="">
                                                            <FormControl>
                                                                <div className={"flex ml-0.5 space-x-2 mb-[-5px]"}>
                                                                    <FormLabel>
                                                                        Show file names on output
                                                                    </FormLabel>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormDescription className="pt-2 pb-2">
                                                                Show the filename below the file, you can parse the display by surrounding the filename with __
                                                                <br />
                                                                __example__123.png =&gt; example
                                                            </FormDescription>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {!editMode && (
                                            <div id="workflow-title-description">
                                                <h1 className="text-xl font-semibold">{form.getValues("title")}</h1>
                                                <p className="text-md text-muted-foreground whitespace-pre-wrap">{form.getValues("description")}</p>
                                            </div>
                                        )}
                                        <fieldset disabled={isLoading} className="grid gap-4 rounded-lg p-1">
                                            {editMode && (
                                                <legend className="-ml-1 px-1 text-md font-medium">
                                                    Basic Inputs
                                                </legend>
                                            )}
                                            {inputFieldArray.fields.map((field, index) => {

                                                // @ts-ignore
                                                if (field.inputs.length > 0) {
                                                    if (editMode) {
                                                        return (
                                                            <fieldset disabled={isLoading} key={field.id} className="grid gap-4 rounded-lg border p-4">
                                                                <legend className="-ml-1 px-1 text-sm font-medium">
                                                                    {

                                                                        // @ts-ignore
                                                                        field.title
                                                                    }

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="text-muted-foreground"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    try {
                                                                                        const group = inputFieldArray.fields[index] as unknown as Record<string, unknown>;
                                                                                        if (!group) return;
                                                                                        // strip RHF internal id

                                                                                        const { id, ...rest } = group as { id?: string } & Record<string, unknown>;
                                                                                        advancedFieldArray.append(rest as unknown as never);
                                                                                        handleRemoveInput({ groupIndex: index });
                                                                                    } catch (err) {
                                                                                        console.error("Failed to move to advanced inputs", err);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <MoveDown />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Move to Advanced Inputs</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="text-muted-foreground"
                                                                                onClick={() => handleRemoveInput({ groupIndex: index })}
                                                                            >
                                                                                <Trash2 className="size-5" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Delete Input</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                </legend>
                                                                <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" setShowEditDialog={setShowEditDialogInput} handleRemove={(inputIndex) => handleRemoveInput({ groupIndex: index, inputIndex })} />
                                                            </fieldset>
                                                        )
                                                    }

                                                    return (
                                                        <fieldset disabled={isLoading} key={field.id} className="grid gap-4">
                                                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" setShowEditDialog={setShowEditDialogInput} handleRemove={(inputIndex) => handleRemoveInput({ groupIndex: index, inputIndex })} />
                                                        </fieldset>
                                                    )
                                                }
                                                return undefined;
                                            })}
                                        </fieldset>
                                        {advancedFieldArray.fields.length > 0 && (
                                            <AdvancedInputSection inputFieldArray={inputFieldArray} advancedFieldArray={advancedFieldArray} form={form} editMode={editMode} isLoading={isLoading} setShowEditDialog={setShowEditDialogInput} handleRemoveInput={handleRemoveInput} handleRemoveAdvanced={handleRemoveAdvanced} />
                                        )}
                                        {editMode && (args.children)}
                                    </div>
                                </ScrollArea>
                                {!editMode && (
                                    <div className="sticky bottom-0 mt-auto p-4 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-t z-10">
                                        {args.children}
                                    </div>
                                )}
                            </div>
                        </div>
                        {editMode && (
                            <ScrollArea className="h-full flex-1 rounded-md px-[5px] pr-4">
                                <div className="">
                                    <PreviewImagesInput form={form} />
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    {editMode && (
                        <div className={cn("sticky bottom-0 p-4 bg-background w-full flex flex-row gap-x-4 rounded-md")}>
                            <Button type="submit" className="w-full mb-2" onClick={form.handleSubmit(handleSaveSubmit)}>
                                Save Changes
                            </Button>
                            {downloadViewComfyJSON && (
                                <Button type="button" variant="secondary" className="w-full" onClick={form.handleSubmit(downloadViewComfyJSON)}>
                                    Download as ViewComfy JSON
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </Form>
        </>
    )
}

function PreviewImagesInput({ form }: { form: UseFormReturn<IViewComfyBase> }) {
    const [inputValues, setInputValues] = useState<string[]>(["", "", ""]);
    const [urlErrors, setUrlErrors] = useState<string[]>(["", "", ""]);

    const handleImageLoad = (index: number, url: string) => {
        form.setValue(`previewImages.${index}`, url);
    };

    const handleInputChange = (index: number, value: string) => {
        const newValues = [...inputValues];
        newValues[index] = value;
        setInputValues(newValues);

        // Clear error when user starts typing
        const newErrors = [...urlErrors];
        newErrors[index] = "";
        setUrlErrors(newErrors);
    };

    const handleBlur = (index: number) => {
        try {
            // Only update form value if URL is valid or empty
            if (!inputValues[index]) {
                form.setValue(`previewImages.${index}`, "");
                return;
            }

            new URL(inputValues[index]);
            form.setValue(`previewImages.${index}`, inputValues[index]);

            // Clear error on valid URL
            const newErrors = [...urlErrors];
            newErrors[index] = "";
            setUrlErrors(newErrors);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Invalid URL, set error message but keep the input value
            const newErrors = [...urlErrors];
            newErrors[index] = "Please enter a valid URL";
            setUrlErrors(newErrors);
        }
    };

    return (
        <div className="grid gap-4 p-1">
            {[0, 1, 2].map((index) => (
                <FormField
                    key={index}
                    control={form.control}
                    name={`previewImages.${index}`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preview Image {index + 1}</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    {field.value ? (
                                        <div className="flex flex-col gap-2">
                                            <img
                                                src={field.value}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full object-contain rounded-md max-h-[300px]"
                                                onError={() => {
                                                    form.setValue(`previewImages.${index}`, "");
                                                    setInputValues(prev => {
                                                        const newValues = [...prev];
                                                        newValues[index] = "";
                                                        return newValues;
                                                    });
                                                }}
                                                onLoad={() => handleImageLoad(index, field.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="border-2 text-muted-foreground"
                                                onClick={() => {
                                                    form.setValue(`previewImages.${index}`, "");
                                                    setInputValues(prev => {
                                                        const newValues = [...prev];
                                                        newValues[index] = "";
                                                        return newValues;
                                                    });
                                                }}
                                            >
                                                <Trash2 className="size-5 mr-2" /> Remove image
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Input
                                                placeholder={"https://your-image.com/preview.jpg"}
                                                value={inputValues[index]}
                                                onChange={(e) => handleInputChange(index, e.target.value)}
                                                onBlur={() => handleBlur(index)}
                                                type="text"
                                                className={urlErrors[index] ? "border-red-500" : ""}
                                            />
                                            {urlErrors[index] && (
                                                <p className="text-sm font-medium text-red-500">
                                                    {urlErrors[index]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            ))}
        </div>
    );
}

function AdvancedInputSection(args: {

    inputFieldArray: UseFieldArrayReturn<any>,

    advancedFieldArray: UseFieldArrayReturn<any>,

    form: UseFormReturn<IViewComfyBase, any, IViewComfyBase>,
    editMode: boolean,
    isLoading: boolean,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    handleRemoveInput: (params: { groupIndex: number, inputIndex?: number }) => void,
    handleRemoveAdvanced: (params: { groupIndex: number, inputIndex?: number }) => void,
}) {
    const { inputFieldArray, advancedFieldArray, form, editMode, isLoading, setShowEditDialog, handleRemoveInput, handleRemoveAdvanced } = args;
    const [isOpen, setIsOpen] = useState(editMode);
    return (<>
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2 mb-2"
        >
            {!editMode && (<div className="flex items-center space-x-4 px-4">
                <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="default" className="w-full">
                        Advanced Inputs
                        <ChevronsUpDown className="size-5" />
                    </Button>
                </CollapsibleTrigger>
            </div>
            )}
            <CollapsibleContent className="space-y-2 pb-20">
                <fieldset className="grid gap-2 rounded-lg p-1">
                    {editMode && (
                        <legend className="-ml-1 px-1 text-md font-medium">
                            Advanced Inputs
                        </legend>
                    )}
                    {advancedFieldArray.fields.map((advancedField, index) => (
                        <fieldset disabled={isLoading} key={advancedField.id} className="grid gap-4 rounded-lg border p-4">
                            <legend className="-ml-1 px-1 text-sm font-medium">
                                {

                                    // @ts-ignore
                                    advancedField.title
                                }
                                {editMode && (
                                    <>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        try {
                                                            const group = advancedFieldArray.fields[index] as unknown as Record<string, unknown>;
                                                            if (!group) return;
                                                            // strip RHF internal id

                                                            const { id, ...rest } = group as { id?: string } & Record<string, unknown>;
                                                            inputFieldArray.append(rest as unknown as never);
                                                            handleRemoveAdvanced({ groupIndex: index });
                                                        } catch (err) {
                                                            console.error("Failed to move to basic inputs", err);
                                                        }
                                                    }}
                                                >
                                                    <MoveUp />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Move to Basic Inputs</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground"
                                                    onClick={() => handleRemoveAdvanced({ groupIndex: index })}
                                                >
                                                    <Trash2 className="size-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Delete Input</p>
                                            </TooltipContent>
                                        </Tooltip>

                                    </>

                                )}
                            </legend>
                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="advancedInputs" setShowEditDialog={setShowEditDialog} handleRemove={(inputIndex) => handleRemoveAdvanced({ groupIndex: index, inputIndex })} />
                        </fieldset>
                    ))}
                </fieldset>
            </CollapsibleContent>
        </Collapsible>
    </>)
}


function NestedInputField(args: {
    form: UseFormReturn<IViewComfyBase, any, IViewComfyBase>,
    nestedIndex: number,
    editMode: boolean,
    formFieldName: string,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    handleRemove: (inputIndex: number) => void,
}) {
    const { form, nestedIndex, editMode, formFieldName, setShowEditDialog, handleRemove } = args;
    const nestedFieldArray = useFieldArray({
        control: form.control,

        // @ts-ignore
        name: `${formFieldName}[${nestedIndex}].inputs`
    });

    function getErrorMsg(input: IInputField): string {
        if (input.validations.errorMsg && input.validations.errorMsg != "") {
            return input.validations.errorMsg
        } else {
            return "This field is required"
        }
    }

    const openEditDialogWithContext = (value: IEditFieldDialog | undefined) => {
        if (!value) {
            setShowEditDialog(undefined);
            return;
        }
        const idx = value.index;
        setShowEditDialog({
            ...value,
            formFieldName: formFieldName,
            nestedIndex: nestedIndex,
            applyUpdate: (patch: Partial<IInputField>) => {
                const current = nestedFieldArray.fields[idx] as IInputForm;
                const updated = { ...current, ...patch } as unknown as IInputForm;

                // @ts-ignore
                nestedFieldArray.update(idx, updated);
            }
        });
    };

    return (
        <>
            {nestedFieldArray.fields.map((item, k) => {
                const input = item as IInputForm;
                return (
                    <FormField
                        key={input.id}
                        control={form.control}

                        // @ts-ignore
                        name={`${formFieldName}[${nestedIndex}].inputs[${k}].value`}
                        rules={{
                            required: !editMode && input.validations.required ? getErrorMsg(input) : false
                        }}
                        render={({ field }) => (
                            <InputFieldToUI key={input.id} input={input} field={field} editMode={editMode} remove={handleRemove} index={k} setShowEditDialog={openEditDialogWithContext} />
                        )}
                    />
                )
            })}
        </>
    )
}


function InputFieldToUI(args: {
    input: IInputForm,

    field: any,
    editMode?: boolean,
    remove?: (index: number) => void, index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
}) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;

    if (input.valueType === "long-text") {
        return (
            <FormTextAreaInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    if (input.valueType === "boolean") {
        return (
            <FormCheckboxInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    if (input.valueType === "video" || input.valueType === "image" || input.valueType === "audio") {
        return (
            <FormMediaInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    if (input.valueType === "image-mask") {
        return (
            <FormMaskInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    if (input.valueType === "seed" || input.valueType === "noise_seed" || input.valueType === "rand_seed") {
        return (
            <FormSeedInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    if (input.valueType === "select") {
        if (input.options && input.options.length < 6) {
            return (
                <FormSelectInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
            )
        } else {
            return (
                <FormComboboxInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
            )
        }
    }

    if (input.valueType === "slider") {
        return (
            <FormSliderInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
        )
    }

    return (
        <FormBasicInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} />
    )
}


function FormSeedInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    // The Number.MIN_VALUE is used to indicate that the input has been randomized
    const [isRandomized, setIsRandomized] = useState(field.value === Number.MIN_VALUE);
    const [storedValue] = useState(field.value);

    const toggleRandomize = () => {
        const newValue = !isRandomized;
        setIsRandomized(newValue);
        if (newValue) {
            field.onChange(Number.MIN_VALUE);
        } else {
            // Restore the saved value when reactivating the input
            if (storedValue === Number.MIN_VALUE) {
                field.onChange(getComfyUIRandomSeed());
            } else {
                field.onChange(storedValue);
            }
        }
    };

    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>
                {input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)}
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder={input.placeholder}
                        {...field}
                        type="number"
                        disabled={isRandomized} // Disable input if checkbox is checked
                        value={isRandomized ? "" : field.value} // Display "randomize" if checkbox is checked
                        onChange={(e) => {
                            const value = e.target.value;
                            if (!isRandomized) {
                                field.onChange(value);
                            }
                        }}
                        className="flex-1"
                    />
                    <Checkbox
                        checked={isRandomized}
                        onCheckedChange={toggleRandomize}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <FormLabel className={CHECKBOX_STYLE.checkBoxLabel}>
                            Randomize
                        </FormLabel>
                    </div>
                </div>
            </FormControl>
            {input.helpText !== "Helper Text" && (
                <FormDescription className="whitespace-pre-wrap">
                    {input.helpText}
                </FormDescription>
            )}
            <FormMessage />
        </FormItem>
    );
}


function FormMediaInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    const [media, setMedia] = useState({
        src: "",
        name: "",
    });

    let fileExtensions: string[] = []
    if (input.valueType === "image") {
        fileExtensions = ['png', 'jpg', 'jpeg']
    } else if (input.valueType === "video") {
        fileExtensions = ['mp4', 'avi', 'webm', 'mkv', 'gif']
    } else if (input.valueType === "audio") {
        fileExtensions = ['mp3', 'wav', 'm4b', 'm4p', 'wma', 'webm']
    }

    useEffect(() => {
        if (field.value && field.value instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const name = field.value.name
                    setMedia({
                        src: content,
                        name: name
                    });
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setMedia({
                        src: "",
                        name: ""
                    });
                }
            };
            reader.readAsDataURL(field.value);
        }
    }, [field.value]);

    const onDelete = () => {
        field.onChange(null);
        setMedia({
            src: "",
            name: ""
        });
    }

    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>{input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)}
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                {media.src ? (
                    <div key={input.id} className="flex flex-col items-center gap-2">
                        {(input.valueType === "image") && (
                            <>
                                <SelectableImage imageUrl={media.src} className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md relative">
                                    <img
                                        src={media.src}
                                        alt={media.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </SelectableImage>
                                <div className="flex flex-row items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="border-2 text-muted-foreground"
                                        onClick={onDelete}
                                    >
                                        <Trash2 className="size-5 mr-2" /> Remove {input.valueType}
                                    </Button>
                                </div>
                            </>
                        )}
                        {(input.valueType !== "image") && (
                            <>
                                <div className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md relative">
                                    {(input.valueType === "video") && (
                                        <video
                                            className="max-w-full max-h-full object-contain"
                                            controls
                                        >
                                            <track default kind="captions" srcLang="en" src="" />
                                            <source src={media.src} />
                                        </video>
                                    )}
                                    {(input.valueType === "audio") && (
                                        <audio src={media.src} controls />
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="border-2 text-muted-foreground"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="size-5 mr-2" /> Remove {input.valueType}
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <Dropzone
                        key={input.id}
                        onChange={field.onChange}
                        fileExtensions={fileExtensions}
                        className="form-dropzone"
                        inputPlaceholder={field.value?.name}
                    />
                )}
            </FormControl>
            <FormMessage />
        </FormItem>
    )
}


function FormMaskInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    const [media, setMedia] = useState({
        src: "",
        name: "",
    });

    const [maskFile, setMaskFile] = useState<File | undefined>(undefined);
    const fileExtensions: string[] = ['png', 'jpg', 'jpeg'];
    const [showMaskEditor, setShowMaskEditor] = useState(false);
    const [fileInput, setFileInput] = useState<File | null>(null);
    const [maskImg, setMaskImg] = useState({
        src: "",
        name: "",
    });

    const onSaveMask = (mask: File | undefined) => {
        setMaskFile(mask);
        setShowMaskEditor(false);
    }

    const handleMaskEditorCancel = () => {
        setShowMaskEditor(false);
    };

    const setFieldValue = () => {

        if (fileInput && fileInput instanceof File) {
            if (maskFile && maskFile instanceof File) {
                field.onChange(new ImageMasked({
                    image: fileInput,
                    mask: maskFile,
                }));
                return;
            } else {
                field.onChange(fileInput);
            }
        }
        else {
            field.onChange(null);
        }
    }

    useEffect(() => {
        if (maskFile && maskFile instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const name = maskFile.name
                    setMaskImg({
                        src: content,
                        name: name
                    });
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setMaskImg({
                        src: "",
                        name: ""
                    });
                }
            };
            reader.readAsDataURL(maskFile);
        } else {
            setMaskImg({
                src: "",
                name: ""
            });
        }
        setFieldValue();
    }, [maskFile]);


    useEffect(() => {
        if (!fileInput) {
            setMedia({
                src: "",
                name: ""
            });
            field.onChange(null);
            setMaskImg({
                src: "",
                name: ""
            });
            return;
        }

        if (fileInput && fileInput instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const name = fileInput.name
                    setMedia({
                        src: content,
                        name: name
                    });
                    field.onChange(fileInput);
                    setMaskFile(undefined);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setMedia({
                        src: "",
                        name: ""
                    });
                }
            };
            reader.readAsDataURL(fileInput);
        }
    }, [fileInput]);

    const onDelete = () => {
        setFileInput(null);
    };

    const getDisplayImg = () => {
        return maskImg.src || media.src;
    }

    return (
        <>
            <FormItem key={input.id}>
                <FormLabel className={FORM_STYLE.label}>{input.title}
                    {input.tooltip && (
                        <Tooltip>
                            <TooltipTrigger className="">
                                <Info className="h-4 w-4" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }} />
                            </TooltipTrigger>
                            <TooltipContent className="text-center whitespace-pre-wrap">
                                <p>
                                    {input.tooltip}
                                </p>
                            </TooltipContent>
                        </Tooltip>)}
                    {editMode && (
                        <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                    )}
                </FormLabel>
                <FormControl>
                    {media.src ? (
                        <div key={input.id} className="flex flex-col items-center gap-2">
                            <SelectableImage imageUrl={getDisplayImg()} className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md relative">
                                <img
                                    src={getDisplayImg()}
                                    alt={media.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </SelectableImage>
                            <div className="flex flex-row items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="border-2 text-muted-foreground"
                                    onClick={() => setShowMaskEditor(true)}
                                >
                                    <Brush className="size-5 mr-2" /> Edit Mask
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="border-2 text-muted-foreground"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="size-5 mr-2" /> Remove Image
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Dropzone
                            key={input.id}
                            onChange={setFileInput}
                            fileExtensions={fileExtensions}
                            className="form-dropzone"
                            inputPlaceholder={fileInput?.name}
                        />
                    )}
                </FormControl>
                <FormMessage />
            </FormItem>
            {!editMode && showMaskEditor &&
                (
                    <Dialog open={showMaskEditor}
                        onOpenChange={setShowMaskEditor}
                    >
                        <DialogContent className="w-[calc(80vw-1rem)] h-[calc(80vh-1rem)] max-w-none border bg-background rounded-lg p-0">
                            <MaskEditor
                                imageUrl={media.src}
                                existingMask={maskFile}
                                onSave={onSaveMask}
                                onCancel={handleMaskEditorCancel}
                            />
                        </DialogContent>
                    </Dialog>
                )
            }
        </>
    )
}

function FormTextAreaInput(args: {
    input: IInputForm,

    field: any, editMode?: boolean,
    remove?: (index: number) => void,
    index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
}) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;

    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>
                {input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)
                }
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />

                )}
            </FormLabel>
            <FormControl>
                <AutosizeTextarea
                    placeholder={input.placeholder}
                    className={TEXT_AREA_STYLE}
                    {...field}
                />
            </FormControl>
            {(input.helpText !== "Helper Text") && (
                <FormDescription className="whitespace-pre-wrap">
                    {input.helpText}
                </FormDescription>
            )}
            <FormMessage />
        </FormItem>
    )
}


function FormCheckboxInput(args: {
    input: IInputForm,

    field: any,
    editMode?: boolean,
    remove?: (index: number) => void,
    index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
}) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    return (
        <FormItem className="flex flex-row items-center space-x-3 space-y-0" key={input.id}>
            <FormControl>
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            </FormControl>
            <div className="grid gap-1.5 leading-none">
                <FormLabel className={CHECKBOX_STYLE.checkBoxLabel}>
                    {input.title}
                    {input.tooltip && (
                        <Tooltip>
                            <TooltipTrigger className="">
                                <Info className="h-4 w-4" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }} />
                            </TooltipTrigger>
                            <TooltipContent className="text-center whitespace-pre-wrap">
                                <p>
                                    {input.tooltip}
                                </p>
                            </TooltipContent>
                        </Tooltip>)}
                </FormLabel>
                {/* <FormDescription className="text-sm text-muted-foreground">
                    {input.helpText}
                </FormDescription> */}
            </div>
            {editMode && (
                <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} field={field} input={input} />
            )}
            <FormMessage />
        </FormItem>
    )
}

function FormBasicInput(args: {
    input: IInputForm,

    field: any,
    editMode?: boolean,
    remove?: (index: number) => void,
    index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
}) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>{input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)
                }
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                <Input placeholder={input.placeholder} {...field} type={parseWorkflowApiTypeToInputHtmlType(input.valueType)} />
            </FormControl>
            {(input.helpText !== "Helper Text") && (
                <FormDescription className="whitespace-pre-wrap">
                    {input.helpText}
                </FormDescription>
            )}
            <FormMessage />
        </FormItem>
    )
}


function FormSelectInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>{input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)}
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={input.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {input.options
                            ?.map((option) => ({ label: (option.label ?? "").trim() || (option.value ?? "").trim(), value: (option.value ?? "").trim() }))
                            .filter((option) => option.value && option.value !== "")
                            .map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </FormControl>
            <FormMessage />
        </FormItem>
    )
}


function FormComboboxInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog } = args;
    const [open, setOpen] = useState(false);
    const [buttonWidth, setButtonWidth] = useState<number>(0);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const options = input.options || [{
        label: "Missing Values",
        value: "Missing Values"
    }];
    const defaultLabel = options.find((opt) => opt.value === field.value);
    const [value, setValue] = useState(field.value);
    const [label, setLabel] = useState(defaultLabel?.label);

    const handleOnSelect = (opt: { label: string; value: string }) => {
        setValue(opt.value);
        setLabel(opt.label);
        field.onChange(opt.value);
    }

    useEffect(() => {
        if (buttonRef.current) {
            const width = buttonRef.current.offsetWidth;
            setButtonWidth(width);
        }
    }, [label, open]);

    return (
        <FormItem key={input.id}>
            <FormLabel className={FORM_STYLE.label}>{input.title}
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)}
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            ref={buttonRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="justify-between min-w-[200px]"
                        >
                            {value
                                ? options.find((opt) => opt.value === value)?.label
                                : "Select..."}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="p-0"
                        style={{ width: buttonWidth > 0 ? `${buttonWidth}px` : '400px' }}
                    >
                        <Command>
                            <CommandInput placeholder="Search..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No value found.</CommandEmpty>
                                <CommandGroup>
                                    {options.map((opt) => (
                                        <CommandItem
                                            key={opt.value}
                                            keywords={[opt.label]}
                                            value={opt.value}
                                            onSelect={() => {
                                                handleOnSelect(opt);
                                                setOpen(false)
                                            }}
                                        >
                                            {opt.label}
                                            <Check
                                                className={cn(
                                                    "ml-auto",
                                                    value === opt.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </FormControl>
            <FormMessage />
        </FormItem>
    )
}



function FormSliderInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: (index: number) => void, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void, }) {

    const { input, field, editMode, remove, index, setShowEditDialog } = args;

    const onSliderChange = (value: number[]) => {
        field.onChange(value[0]);
    };

    return (
        <FormItem key={input.id}>
            <FormLabel className="flex flex-row items-center gap-2">
                <div className="flex flex-row w-full justify-between">
                    {input.title}
                    <span className="border border-gray-300 rounded-md px-2 py-1 min-w-[40px] text-center">{field.value}</span>
                </div>
                {input.tooltip && (
                    <Tooltip>
                        <TooltipTrigger className="">
                            <Info className="h-4 w-4" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }} />
                        </TooltipTrigger>
                        <TooltipContent className="text-center whitespace-pre-wrap">
                            <p>
                                {input.tooltip}
                            </p>
                        </TooltipContent>
                    </Tooltip>)}
                {editMode && (
                    <FieldActionButtons remove={remove} index={index} setShowEditDialog={setShowEditDialog} input={input} field={field} />
                )}
            </FormLabel>
            <FormControl>
                <Slider onValueChange={onSliderChange} defaultValue={[field.value]} min={input.slider?.min} max={input.slider?.max} step={input.slider?.step} />
            </FormControl>
            {/* <FormDescription className="whitespace-pre-wrap">
                Value: {field.value} <br />
                Min: {input.slider?.min} Max: {input.slider?.max} Step: {input.slider?.step}
            </FormDescription> */}
            <FormMessage />
        </FormItem>
    )
}

function FieldActionButtons(props: {
    remove?: (index: number) => void, index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    input: IInputForm,

    field: any
}) {

    const { remove, index, setShowEditDialog, input, field } = props;

    return (
        <div className="flex items-center gap-1 ml-auto">
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-muted-foreground"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditDialog({
                        index,
                        input,
                        field
                    })
                }}
            >
                <SquarePen className="size-5" />
            </Button>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-muted-foreground"
                onClick={remove ? () => remove(index) : undefined}
            >
                <Trash2 className="size-5" />
            </Button>
        </div>
    )
}

interface IEditFieldDialog {
    input: IInputForm,

    field: any,
    index: number,
    formFieldName?: string,
    nestedIndex?: number,
    applyUpdate?: (patch: Partial<IInputField>) => void,
}

function EditFieldDialog(props: {
    showEditDialog: IEditFieldDialog | undefined,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,

    form?: UseFormReturn<IViewComfyBase, any, IViewComfyBase>,
}) {

    const { showEditDialog, setShowEditDialog, form } = props;
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();

    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [selectOptionsText, setSelectOptionsText] = useState<string>("");
    const [sliderMin, setSliderMin] = useState<number>(0);
    const [sliderMax, setSliderMax] = useState<number>(100);
    const [sliderStep, setSliderStep] = useState<number>(1);

    const [defaultValue, setDefaultValue] = useState<any>("");
    const [fieldTitle, setFieldTitle] = useState<string>("");
    const [helpText, setHelpText] = useState<string>("");
    const [tooltip, setTooltip] = useState<string>("");
    const [isRequired, setIsRequired] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    useEffect(() => {
        if (!showEditDialog) {
            return;
        }
        const current = showEditDialog.input;
        setSelectedType(current.valueType);
        setFieldTitle(current.title ?? "");
        // initialize meta fields
        setHelpText(current.helpText ?? "");
        setTooltip(current.tooltip ?? "");
        setIsRequired(Boolean(current.validations?.required));
        setErrorMsg(current.validations?.errorMsg ?? "");
        // Prefill select options using `label: "..", value: ".."` format.
        // Do not auto-inject default when options exist; only use default as a single fallback when there are no options.
        if (current.options && current.options.length > 0) {
            setSelectOptionsText(current.options.map(o => `label: "${o.label}", value: "${o.value}"`).join("\n"));
        } else {
            const dv = String(current.value ?? "");
            setSelectOptionsText(dv ? `label: "${dv}", value: "${dv}"` : "");
        }
        if (current.slider) {
            setSliderMin(current.slider.min ?? 0);
            setSliderMax(current.slider.max ?? 100);
            setSliderStep(current.slider.step ?? 1);
        } else {
            setSliderMin(0);
            setSliderMax(100);
            setSliderStep(1);
        }
        // initialize default value based on current type/value
        switch (current.valueType) {
            case "boolean":
                setDefaultValue(Boolean(current.value));
                setIsRequired(false);
                setErrorMsg("");
                break;
            case "number":
            case "float":
            case "seed":
            case "noise_seed":
            case "rand_seed": {
                const num = Number(current.value);
                setDefaultValue(Number.isFinite(num) ? num : 0);
                break;
            }
            case "slider": {
                const min = current.slider?.min ?? 0;
                const max = current.slider?.max ?? 100;
                const num = Number(current.value);
                let next = Number.isFinite(num) ? num : min;
                if (next < min) next = min;
                if (next > max) next = max;
                setDefaultValue(next);
                break;
            }
            case "image":
            case "video":
            case "audio":
                setDefaultValue(null);
                break;
            case "long-text":
            case "string":
            default:
                setDefaultValue(current.value ?? "");
                break;
        }
    }, [showEditDialog]);

    const typeOptions = [
        { label: "Text", value: "string" },
        { label: "Long text", value: "long-text" },
        { label: "Image", value: "image" },
        { label: "Image with Mask Editor", value: "image-mask" },
        { label: "Video", value: "video" },
        { label: "Audio", value: "audio" },
        { label: "Select", value: "select" },
        { label: "Slider", value: "slider" },
        { label: "Number", value: "number" },
        { label: "Float", value: "float" },
        { label: "CheckBox", value: "boolean" },
        { label: "Seed", value: "seed" },
    ];

    const parseSelectOptions = (text: string): { label: string, value: string }[] => {
        const trimQuotes = (s: string) => s.replace(/^\s*["']?\s*/, "").replace(/\s*["']?\s*$/, "");
        const lines = text
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0);
        if (lines.length === 0) {
            return [];
        }
        return lines.map((line) => {
            // Support label/value pair lines in any order, with or without quotes
            const pairRegex1 = /label\s*:\s*(["']?)(.*?)\1\s*,\s*value\s*:\s*(["']?)(.*?)\3/i;
            const pairRegex2 = /value\s*:\s*(["']?)(.*?)\1\s*,\s*label\s*:\s*(["']?)(.*?)\3/i;
            let m = line.match(pairRegex1);
            if (m) {
                const label = m[2].trim();
                const value = m[4].trim();
                return { label: label || value, value: value || label };
            }
            m = line.match(pairRegex2);
            if (m) {
                const value = m[2].trim();
                const label = m[4].trim();
                return { label: label || value, value: value || label };
            }
            // Backwards compatibility: "label, value"
            const commaIndex = line.indexOf(",");
            if (commaIndex !== -1) {
                const rawLabel = line.slice(0, commaIndex).trim();
                const rawValue = line.slice(commaIndex + 1).trim();
                const label = trimQuotes(rawLabel);
                const value = trimQuotes(rawValue);
                return { label: label || value, value: value || label };
            }
            // Single token fallback
            const single = trimQuotes(line);
            return { label: single, value: single };
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEditDialog || !selectedType) {
            setShowEditDialog(undefined);
            return;
        }

        const patch: Partial<IInputField> = { valueType: selectedType as IInputField["valueType"] };

        // clear conflicting configs by default
        patch.options = undefined;
        patch.slider = undefined;

        let localOptions: { label: string, value: string }[] | undefined = undefined;
        let localRange: { min: number, max: number } | undefined = undefined;

        switch (selectedType) {
            case "select": {
                const opts = parseSelectOptions(selectOptionsText);
                const baseOpts = opts.length > 0
                    ? opts
                    : (() => {
                        const currentVal = String(showEditDialog.input.value ?? "Option").trim();
                        return currentVal ? [{ label: currentVal, value: currentVal }] : [{ label: "Option", value: "Option" }];
                    })();
                // Sanitize: trim and drop empty values
                const sanitized = baseOpts
                    .map(o => ({ label: (o.label ?? "").trim() || (o.value ?? "").trim(), value: (o.value ?? "").trim() }))
                    .filter(o => o.value !== "");
                const safeOptions = sanitized.length > 0 ? sanitized : [{ label: "Option", value: "Option" }];
                patch.options = safeOptions;
                localOptions = safeOptions;
                break;
            }
            case "slider": {
                const min = Number.isFinite(sliderMin) ? sliderMin : 0;
                const max = Number.isFinite(sliderMax) ? sliderMax : 100;
                const step = Number.isFinite(sliderStep) && sliderStep > 0 ? sliderStep : 1;
                const normalizedMin = Math.min(min, max);
                const normalizedMax = Math.max(min, max);
                patch.slider = { min: normalizedMin, max: normalizedMax, step };
                localRange = { min: normalizedMin, max: normalizedMax };
                break;
            }
            case "image":
            case "image-mask":
            case "video":
            case "audio": {
                break;
            }
            case "boolean": {
                break;
            }
            case "number":
            case "float": {
                break;
            }
            case "seed":
            case "noise_seed":
            case "rand_seed": {
                break;
            }
            case "long-text": {
                break;
            }
            default: {
                break;
            }
        }

        // compute final default value from dialog state
        let computedDefault: unknown = defaultValue;
        switch (selectedType) {
            case "select": {
                const dv = String(defaultValue ?? showEditDialog.input.value ?? "").trim();
                const opts = localOptions ?? [];
                computedDefault = opts.length > 0
                    ? (opts.some(o => o.value === dv) ? dv : opts[0].value)
                    : "Option";
                break;
            }
            case "slider": {
                const range = localRange ?? { min: 0, max: 100 };
                const num = Number(defaultValue);
                let next = Number.isFinite(num) ? num : range.min;
                if (next < range.min) next = range.min;
                if (next > range.max) next = range.max;
                computedDefault = next;
                break;
            }
            case "boolean": {
                computedDefault = Boolean(defaultValue);
                break;
            }
            case "number":
            case "float":
            case "seed":
            case "noise_seed":
            case "rand_seed": {
                const num = Number(defaultValue);
                computedDefault = Number.isFinite(num) ? num : 0;
                break;
            }
            case "long-text":
            case "string": {
                computedDefault = String(defaultValue ?? "");
                break;
            }
            case "image":
            case "image-mask":
            case "video":
            case "audio": {
                computedDefault = null;
                break;
            }
            default: {
                computedDefault = String(defaultValue ?? "");
                break;
            }
        }

        patch.value = computedDefault as any;
        if (patch.value === undefined && showEditDialog.field && typeof showEditDialog.field.value !== 'undefined') {

            patch.value = showEditDialog.field.value as any;
        }

        // attach common editable props
        if (fieldTitle !== undefined) {
            patch.title = (fieldTitle ?? "").toString();
        }
        patch.helpText = helpText;
        patch.tooltip = tooltip;
        if (selectedType === "boolean") {
            patch.validations = { required: false };
        } else {
            patch.validations = { required: isRequired, errorMsg: errorMsg ? errorMsg : undefined };
        }

        // Apply to field array item (ensures UI re-renders with new type and value)
        showEditDialog.applyUpdate?.(patch);

        // Update RHF form values directly so the editor reflects the change immediately
        try {
            if (form && showEditDialog.formFieldName && typeof showEditDialog.nestedIndex === 'number') {
                const base = `${showEditDialog.formFieldName}[${showEditDialog.nestedIndex}].inputs[${showEditDialog.index}]`;

                (form as any).setValue(`${base}.valueType`, patch.valueType);
                if (patch.value !== undefined) {

                    (form as any).setValue(`${base}.value`, patch.value);
                }
                if (patch.title !== undefined) {

                    (form as any).setValue(`${base}.title`, patch.title);
                }
                if (patch.options !== undefined) {

                    (form as any).setValue(`${base}.options`, patch.options);
                }
                if (patch.slider !== undefined) {

                    (form as any).setValue(`${base}.slider`, patch.slider);
                }
                if (patch.helpText !== undefined) {

                    (form as any).setValue(`${base}.helpText`, patch.helpText);
                }
                if (patch.tooltip !== undefined) {

                    (form as any).setValue(`${base}.tooltip`, patch.tooltip);
                }
                if (patch.validations !== undefined) {

                    (form as any).setValue(`${base}.validations`, patch.validations);
                }
            }
        } catch (err) {
            console.error('Failed to set RHF values:', err);
        }

        try {
            const current = viewComfyState.currentViewComfy;
            if (current && showEditDialog.formFieldName && typeof showEditDialog.nestedIndex === 'number') {
                const baseJson = current.viewComfyJSON;
                const isBasic = showEditDialog.formFieldName === "inputs";
                const list = isBasic ? baseJson.inputs : baseJson.advancedInputs;
                const groupIndex = showEditDialog.nestedIndex as number;
                const inputIndex = showEditDialog.index as number;
                const targetGroup = list[groupIndex];
                if (targetGroup) {
                    const updatedInputs = [...targetGroup.inputs];
                    const currentInput = updatedInputs[inputIndex] as IInputField;
                    const updatedInput: IInputField = { ...currentInput, ...patch } as IInputField;
                    // ensure value is explicitly carried over
                    updatedInput.value = (patch.value !== undefined ? patch.value : currentInput.value) as typeof updatedInput.value;
                    updatedInputs[inputIndex] = updatedInput as unknown as never;
                    const updatedGroup = { ...targetGroup, inputs: updatedInputs };
                    const updatedList = [...list];
                    updatedList[groupIndex] = updatedGroup as unknown as never;
                    const updatedViewComfyJSON: typeof baseJson = {
                        ...baseJson,
                        ...(isBasic ? { inputs: updatedList } : { advancedInputs: updatedList })
                    };

                    viewComfyStateDispatcher({
                        type: ActionType.UPDATE_VIEW_COMFY,
                        payload: {
                            id: current.viewComfyJSON.id,
                            viewComfy: {
                                viewComfyJSON: { ...updatedViewComfyJSON, id: current.viewComfyJSON.id },
                                file: viewComfyState.viewComfyDraft?.file,
                                workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON,
                            }
                        }
                    });
                }
            }
        } catch (err) {
            // swallow provider update errors to avoid blocking UI edits
            console.error('Failed to update provider state:', err);
        }

        setShowEditDialog(undefined);
    };

    return (
        <Dialog open={showEditDialog !== undefined} onOpenChange={() => setShowEditDialog(undefined)}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>Transform input</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4">
                        <div className="grid gap-3">
                            <Label>Label</Label>
                            <Input
                                placeholder={"Field label"}
                                value={fieldTitle}
                                onChange={(e) => setFieldTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Type</Label>
                            <Select value={selectedType} onValueChange={(v) => setSelectedType(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedType === "select" && (
                            <div className="grid gap-3">
                                <Label>Options (one per line)</Label>
                                <Textarea
                                    placeholder={"label: \"Label A\", value: \"Value A\"\nlabel: \"Label B\", value: \"Value B\""}
                                    value={selectOptionsText}
                                    onChange={(e) => setSelectOptionsText(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">Enter one per line as label: &quot;...&quot;, value: &quot;...&quot;. The current default will always be included.</p>
                            </div>
                        )}

                        {selectedType === "slider" && (
                            <div className="grid gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="min">Min</Label>
                                    <Input id="min" type="number" value={sliderMin} onChange={(e) => setSliderMin(parseFloat(e.target.value))} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="max">Max</Label>
                                    <Input id="max" type="number" value={sliderMax} onChange={(e) => setSliderMax(parseFloat(e.target.value))} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="step">Step</Label>
                                    <Input id="step" type="number" value={sliderStep} onChange={(e) => setSliderStep(parseFloat(e.target.value))} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 mt-4">
                        <div className="grid gap-3">
                            <Label>Default value</Label>
                            {(selectedType === "select" || selectedType === "combobox") && (
                                <Select value={String(defaultValue ?? "")} onValueChange={(v) => setDefaultValue(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(() => {
                                            const fromText = parseSelectOptions(selectOptionsText);
                                            const base = fromText.length > 0 ? fromText : (showEditDialog?.input.options ?? []);
                                            return base
                                                .map(o => ({ label: (o.label ?? "").trim() || (o.value ?? "").trim(), value: (o.value ?? "").trim() }))
                                                .filter(o => o.value !== "")
                                                .map(o => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ));
                                        })()}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedType === "boolean" && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={Boolean(defaultValue)} onCheckedChange={(v) => setDefaultValue(Boolean(v))} />
                                    <Label>Checked by default</Label>
                                </div>
                            )}
                            {selectedType === "long-text" && (
                                <Textarea value={String(defaultValue ?? "")} onChange={(e) => setDefaultValue(e.target.value)} />
                            )}
                            {(selectedType === "number" || selectedType === "float" || selectedType === "seed" || selectedType === "noise_seed" || selectedType === "rand_seed") && (
                                <Input type="number" value={String(defaultValue ?? "")} onChange={(e) => setDefaultValue(e.target.value)} />
                            )}
                            {selectedType === "slider" && (
                                <Input type="number" value={String(defaultValue ?? "")} onChange={(e) => setDefaultValue(e.target.value)} min={sliderMin} max={sliderMax} step={sliderStep} />
                            )}
                            {(!selectedType || selectedType === "string") && (
                                <Input type="text" value={String(defaultValue ?? "")} onChange={(e) => setDefaultValue(e.target.value)} />
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 mt-4">
                        <div className="grid gap-3">
                            <Label>Help text</Label>
                            <Textarea
                                placeholder={"Helper text shown under the field"}
                                value={helpText}
                                onChange={(e) => setHelpText(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Tooltip</Label>
                            <Input
                                placeholder={"Short tooltip text"}
                                value={tooltip}
                                onChange={(e) => setTooltip(e.target.value)}
                            />
                        </div>
                        {selectedType !== "boolean" && (
                            <div className="grid gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={isRequired} onCheckedChange={(v) => setIsRequired(Boolean(v))} />
                                    <Label>Required</Label>
                                </div>
                                <div className="grid gap-1">
                                    <Label>Error message (shown when required)</Label>
                                    <Input
                                        placeholder={"This field is required"}
                                        value={errorMsg}
                                        onChange={(e) => setErrorMsg(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-5 gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
