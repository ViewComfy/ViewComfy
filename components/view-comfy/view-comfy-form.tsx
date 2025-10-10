/* eslint-disable @next/next/no-img-element */
import React from "react";
import { useFieldArray, type UseFieldArrayRemove, type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form"
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
import { Trash2, Info, Check, SquarePen, MoveUp, MoveDown, Eraser } from "lucide-react";
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

interface IInputForm extends IInputField {
    id: string;
}


const settingsService = new SettingsService();
const validateViewComfyEndpoint = (endpoint: string | undefined) => {
    if (!settingsService.getIsRunningInViewComfy()) {
        return true;
    }

    return endpoint && endpoint.startsWith("https://viewcomfy");
}

export function ViewComfyForm(args: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<IViewComfyBase, any, undefined>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputFieldArray: UseFieldArrayReturn<any>, advancedFieldArray: UseFieldArrayReturn<any>,
    editMode?: boolean,
    downloadViewComfyJSON?: (data: IViewComfyBase) => void,
    children?: React.ReactNode,
    isLoading?: boolean

}) {
    const { form, onSubmit, inputFieldArray, advancedFieldArray, editMode = false, isLoading = false, downloadViewComfyJSON } = args;
    const [editDialogInput, setShowEditDialogInput] = useState<IEditFieldDialog | undefined>(undefined);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [maskEditorState, setMaskEditorState] = useState<{
        isOpen: boolean;
        imageUrl: string;
        existingMask: File | null;
        fieldOnChange: (maskFile: File) => void;
    } | null>(null);

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

    const handleMaskEditorOpen = (imageUrl: string, existingMask: File | null, fieldOnChange: (file: File) => void) => {
        setMaskEditorState({
            isOpen: true,
            imageUrl,
            existingMask,
            fieldOnChange,
        });
    };

    const handleMaskEditorSave = (maskFile: File) => {
        if (maskEditorState) {
            maskEditorState.fieldOnChange(maskFile);
            setMaskEditorState(null);
        }
    };

    const handleMaskEditorCancel = () => {
        setMaskEditorState(null);
    };

    return (
        <>
            {!editMode && maskEditorState?.isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-[5%]"
                    onClick={handleMaskEditorCancel}
                >
                    <div 
                        className="w-full h-full border bg-background rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MaskEditor 
                            imageUrl={maskEditorState.imageUrl}
                            existingMask={maskEditorState.existingMask}
                            onSave={handleMaskEditorSave}
                            onCancel={handleMaskEditorCancel}
                        />
                    </div>
                </div>
            )}
            <EditFieldDialog showEditDialog={editDialogInput} setShowEditDialog={setShowEditDialogInput} form={form} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full w-full">

                    <div className="flex flex-row gap-x-2 flex-1 min-h-0">
                        <div className='flex-col flex-1 items-start gap-4 flex mr-1 min-h-0'>
                            <div id="inputs-form" className="flex flex-col w-full h-full">
                                <ScrollArea className={!editMode ? "flex-1 px-[5px] pr-4 pb-24" : "flex-1 px-[5px] pr-4"}>
                                    <div className="grid w-full items-start gap-4">
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
                                                        <FormItem key="description" className="ml-0.5 mr-0.5">
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
                                                        required: settingsService.getIsRunningInViewComfy() ? "Enter your API Endpoint, you can find it under 'Your Workflows' in the Dashboard" : false,
                                                        validate: {
                                                            endpoint: (value) => (validateViewComfyEndpoint(value)) || "The API endpoint URL looks wrong, you can find it under 'Your Workflows' in the Dashboard",
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <FormItem key="viewcomfyEndpoint" className="m-1">
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
                                                                <Input
                                                                    placeholder="ViewComfy endpoint" {...field} />
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
                                                            <FormDescription className="pb-2">
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
                                                            <FormDescription className="pb-2">
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
                                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                // @ts-ignore
                                                if (field.inputs.length > 0) {
                                                    if (editMode) {
                                                        return (
                                                            <fieldset disabled={isLoading} key={field.id} className="grid gap-4 rounded-lg border p-4">
                                                                <legend className="-ml-1 px-1 text-sm font-medium">
                                                                    {
                                                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                                        // @ts-ignore
                                                                        field.title
                                                                    }

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
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
                                                                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                                        const { id, ...rest } = group as { id?: string } & Record<string, unknown>;
                                                                                        advancedFieldArray.append(rest as unknown as never);
                                                                                        inputFieldArray.remove(index);
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
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="text-muted-foreground"
                                                                                onClick={() => inputFieldArray.remove(index)}
                                                                            >
                                                                                <Trash2 className="size-5" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Delete Input</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>


                                                                </legend>
                                                                <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" setShowEditDialog={setShowEditDialogInput} handleMaskEditorOpen={handleMaskEditorOpen} />
                                                            </fieldset>
                                                        )
                                                    }

                                                    return (
                                                        <fieldset disabled={isLoading} key={field.id} className="grid gap-4">
                                                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" setShowEditDialog={setShowEditDialogInput} handleMaskEditorOpen={handleMaskEditorOpen} />
                                                        </fieldset>
                                                    )
                                                }
                                                return undefined;
                                            })}
                                        </fieldset>
                                        {advancedFieldArray.fields.length > 0 && (
                                            <AdvancedInputSection inputFieldArray={inputFieldArray} advancedFieldArray={advancedFieldArray} form={form} editMode={editMode} isLoading={isLoading} setShowEditDialog={setShowEditDialogInput} handleMaskEditorOpen={handleMaskEditorOpen} />
                                        )}
                                        {editMode && (args.children)}
                                    </div>
                                </ScrollArea>
                                {!editMode && (
                                    <div className="sticky bottom-0 mt-auto p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-10">
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
                                <Button variant="secondary" className="w-full" onClick={form.handleSubmit(downloadViewComfyJSON)}>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputFieldArray: UseFieldArrayReturn<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advancedFieldArray: UseFieldArrayReturn<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<IViewComfyBase, any, undefined>,
    editMode: boolean,
    isLoading: boolean,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    handleMaskEditorOpen: (imageUrl: string, existingMask: File | null, fieldOnChange: (file: File) => void) => void
}) {
    const { inputFieldArray, advancedFieldArray, form, editMode, isLoading, setShowEditDialog, handleMaskEditorOpen } = args;
    const [isOpen, setIsOpen] = useState(editMode);
    return (<>
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2 mb-2"
        >
            {!editMode && (<div className="flex items-center space-x-4 px-4">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="default" className="w-full">
                        Advanced Inputs
                        <ChevronsUpDown className="size-5" />
                    </Button>
                </CollapsibleTrigger>
            </div>
            )}
            <CollapsibleContent className="space-y-2">
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
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    advancedField.title
                                }
                                {editMode && (
                                    <>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
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
                                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                            const { id, ...rest } = group as { id?: string } & Record<string, unknown>;
                                                            inputFieldArray.append(rest as unknown as never);
                                                            advancedFieldArray.remove(index);
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
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground"
                                                    onClick={() => advancedFieldArray.remove(index)}
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
                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="advancedInputs" setShowEditDialog={setShowEditDialog} handleMaskEditorOpen={handleMaskEditorOpen} />
                        </fieldset>
                    ))}
                </fieldset>
            </CollapsibleContent>
        </Collapsible>
    </>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NestedInputField(args: { form: UseFormReturn<IViewComfyBase, any, undefined>, nestedIndex: number, editMode: boolean, formFieldName: string, setShowEditDialog: (value: IEditFieldDialog | undefined) => void, handleMaskEditorOpen: (imageUrl: string, existingMask: File | null, fieldOnChange: (file: File) => void) => void }) {
    const { form, nestedIndex, editMode, formFieldName, setShowEditDialog, handleMaskEditorOpen } = args;
    const nestedFieldArray = useFieldArray({
        control: form.control,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        name={`${formFieldName}[${nestedIndex}].inputs[${k}].value`}
                        rules={{
                            required: !editMode && input.validations.required ? getErrorMsg(input) : false
                        }}
                        render={({ field, fieldState: { error } }) => (
                            <>
                                <InputFieldToUI key={input.id} input={input} field={field} editMode={editMode} remove={nestedFieldArray.remove} index={k} setShowEditDialog={openEditDialogWithContext} handleMaskEditorOpen={handleMaskEditorOpen} />
                                {error && <FormMessage>{error.message}</FormMessage>}
                            </>
                        )}
                    />
                )
            })}
        </>
    )
}


function InputFieldToUI(args: {
    input: IInputForm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any,
    editMode?: boolean,
    remove?: UseFieldArrayRemove, index: number, 
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    handleMaskEditorOpen: (imageUrl: string, existingMask: File | null, fieldOnChange: (file: File) => void) => void
}) {
    const { input, field, editMode, remove, index, setShowEditDialog, handleMaskEditorOpen } = args;

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
            <FormMediaInput input={input} field={field} editMode={editMode} remove={remove} index={index} setShowEditDialog={setShowEditDialog} handleMaskEditorOpen={handleMaskEditorOpen} />
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSeedInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
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
        </FormItem>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormMediaInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void, handleMaskEditorOpen: (imageUrl: string, existingMask: File | null, fieldOnChange: (file: File) => void) => void }) {
    const { input, field, editMode, remove, index, setShowEditDialog, handleMaskEditorOpen } = args;
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
                        <SelectableImage imageUrl={media.src} className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md relative">
                            {(input.valueType === "image") && (
                                <img
                                    src={media.src}
                                    alt={media.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}
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
                        </SelectableImage>
                        {(input.valueType === "image") && (
                            <div className="flex flex-row items-center gap-2">
                                <Button
                                    variant="secondary"
                                    className="border-2 text-muted-foreground"
                                    onClick={() => handleMaskEditorOpen(media.src, null, field.onChange)}
                                >
                                    <Eraser className="size-5 mr-2" /> Edit Mask
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="border-2 text-muted-foreground"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="size-5 mr-2" /> Remove {input.valueType}
                                </Button>
                            </div>
                        )}
                        {(input.valueType !== "image") && (
                            <Button
                                variant="secondary"
                                className="border-2 text-muted-foreground"
                                onClick={onDelete}
                            >
                                <Trash2 className="size-5 mr-2" /> Remove {input.valueType}
                            </Button>
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
        </FormItem>
    )
}

function FormTextAreaInput(args: {
    input: IInputForm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any, editMode?: boolean,
    remove?: UseFieldArrayRemove,
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
        </FormItem>
    )
}


function FormCheckboxInput(args: {
    input: IInputForm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any,
    editMode?: boolean,
    remove?: UseFieldArrayRemove,
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
        </FormItem>
    )
}

function FormBasicInput(args: {
    input: IInputForm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any,
    editMode?: boolean,
    remove?: UseFieldArrayRemove,
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
        </FormItem>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSelectInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
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
        </FormItem>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormComboboxInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void }) {
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
        </FormItem>
    )
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSliderInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number, setShowEditDialog: (value: IEditFieldDialog | undefined) => void, }) {

    const { input, field, editMode, remove, index, setShowEditDialog } = args;

    const onSliderChange = (value: number[]) => {
        field.onChange(value[0]);
    };

    return (
        <FormItem key={input.id}>
            <FormLabel className="flex flex-row items-center gap-2"> {input.title}
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
            <FormDescription className="whitespace-pre-wrap">
                Value: {field.value} <br />
                Min: {input.slider?.min} Max: {input.slider?.max} Step: {input.slider?.step}
            </FormDescription>
        </FormItem>
    )
}

function FieldActionButtons(props: {
    remove?: UseFieldArrayRemove, index: number,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    input: IInputForm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any
}) {

    const { remove, index, setShowEditDialog, input, field } = props;

    return (
        <div className="flex items-center gap-1 ml-auto">
            <Button
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any,
    index: number,
    formFieldName?: string,
    nestedIndex?: number,
    applyUpdate?: (patch: Partial<IInputField>) => void,
}

function EditFieldDialog(props: {
    showEditDialog: IEditFieldDialog | undefined,
    setShowEditDialog: (value: IEditFieldDialog | undefined) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form?: UseFormReturn<IViewComfyBase, any, undefined>,
}) {

    const { showEditDialog, setShowEditDialog, form } = props;
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();

    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [selectOptionsText, setSelectOptionsText] = useState<string>("");
    const [sliderMin, setSliderMin] = useState<number>(0);
    const [sliderMax, setSliderMax] = useState<number>(100);
    const [sliderStep, setSliderStep] = useState<number>(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        { label: "Number", value: "number" },
        { label: "Float", value: "float" },
        { label: "Boolean", value: "boolean" },
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
        { label: "Audio", value: "audio" },
        { label: "Seed", value: "seed" },
        { label: "Select", value: "select" },
        // { label: "Combobox", value: "combobox" },
        { label: "Slider", value: "slider" },
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch.value = computedDefault as any;
        if (patch.value === undefined && showEditDialog.field && typeof showEditDialog.field.value !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (form as any).setValue(`${base}.valueType`, patch.valueType);
                if (patch.value !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.value`, patch.value);
                }
                if (patch.title !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.title`, patch.title);
                }
                if (patch.options !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.options`, patch.options);
                }
                if (patch.slider !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.slider`, patch.slider);
                }
                if (patch.helpText !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.helpText`, patch.helpText);
                }
                if (patch.tooltip !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setValue(`${base}.tooltip`, patch.tooltip);
                }
                if (patch.validations !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
