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
import { Trash2, Info } from "lucide-react";
import { Dropzone } from "../ui/dropzone";
import { ChevronsUpDown } from "lucide-react"
import { AutosizeTextarea } from "../ui/autosize-text-area"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState, useEffect } from "react";
import { getComfyUIRandomSeed, cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface IInputForm extends IInputField {
    id: string;
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
    return (
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
                                                render={({ field }) => (
                                                    <FormItem key="viewcomfyEndpoint" className="m-1">
                                                        <FormLabel>
                                                            ViewComfy Endpoint (optional)
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
                                                                        You can run your workflow on a cloud GPU by deploying it on ViewComfy first. To get started, select deploy on the left hand side menu.
                                                                        <br /><br />
                                                                        If you don&apos;t have an endpoint, please leave this field empty.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </FormLabel>
                                                        <FormControl>
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
                                            <legend className="-ml-1 px-1 text-sm font-medium">
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

                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="text-muted-foreground"
                                                                    onClick={() => inputFieldArray.remove(index)}
                                                                >
                                                                    <Trash2 className="size-5" />
                                                                </Button>
                                                            </legend>
                                                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" />
                                                        </fieldset>
                                                    )
                                                }

                                                return (
                                                    <fieldset disabled={isLoading} key={field.id} className="grid gap-4">
                                                        <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="inputs" />
                                                    </fieldset>
                                                )
                                            }
                                            return undefined;
                                        })}
                                    </fieldset>
                                    {advancedFieldArray.fields.length > 0 && (
                                        <AdvancedInputSection advancedFieldArray={advancedFieldArray} form={form} editMode={editMode} isLoading={isLoading} />
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
                        <Button type="submit" className="w-full mb-2" onClick={form.handleSubmit(onSubmit)}>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvancedInputSection(args: { advancedFieldArray: UseFieldArrayReturn<any>, form: UseFormReturn<IViewComfyBase, any, undefined>, editMode: boolean, isLoading: boolean }) {
    const { advancedFieldArray, form, editMode, isLoading } = args;
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
                        <legend className="-ml-1 px-1 text-sm font-medium">
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
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground"
                                        onClick={() => advancedFieldArray.remove(index)}
                                    >
                                        <Trash2 className="size-5" />
                                    </Button>
                                )}
                            </legend>
                            <NestedInputField form={form} nestedIndex={index} editMode={editMode} formFieldName="advancedInputs" />
                        </fieldset>
                    ))}
                </fieldset>
            </CollapsibleContent>
        </Collapsible>
    </>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NestedInputField(args: { form: UseFormReturn<IViewComfyBase, any, undefined>, nestedIndex: number, editMode: boolean, formFieldName: string }) {
    const { form, nestedIndex, editMode, formFieldName } = args;
    const nestedFieldArray = useFieldArray({
        control: form.control,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        name: `${formFieldName}[${nestedIndex}].inputs`
    });
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
                        render={({ field }) => (
                            <>
                                <InputFieldToUI key={input.id} input={input} field={field} editMode={editMode} remove={nestedFieldArray.remove} index={k} />
                            </>
                        )}
                    />
                )
            })}
        </>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InputFieldToUI(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;

    if (input.valueType === "long-text") {
        return (
            <FormTextAreaInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    if (input.valueType === "boolean") {
        return (
            <FormCheckboxInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    if (input.valueType === "video" || input.valueType === "image" || input.valueType === "audio") {
        return (
            <FormMediaInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    if (input.valueType === "seed" || input.valueType === "noise_seed" || input.valueType === "rand_seed") {
        return (
            <FormSeedInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    if (input.valueType === "select") {
        return (
            <FormSelectInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    if (input.valueType === "slider") {
        return (
            <FormSliderInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
        )
    }

    return (
        <FormBasicInput input={input} field={field} editMode={editMode} remove={remove} index={index} />
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSeedInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
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
function FormMediaInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
                )}
            </FormLabel>
            <FormControl>
                {media.src ? (
                    <div key={input.id} className="flex flex-col items-center gap-2">
                        <div className="max-w-full h-48 flex items-center justify-center overflow-hidden border rounded-md">
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
                        </div>
                        <Button
                            variant="secondary"
                            className="border-2 text-muted-foreground"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-5 mr-2" /> Remove {input.valueType}
                        </Button>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormTextAreaInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;

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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormCheckboxInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;
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
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground self-center"
                    onClick={remove ? () => remove(index) : undefined}
                >
                    <Trash2 className="size-5" />
                </Button>
            )}
        </FormItem>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormBasicInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
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
function FormSelectInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
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
                        {input.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormControl>
        </FormItem>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSliderInput(args: { input: IInputForm, field: any, editMode?: boolean, remove?: UseFieldArrayRemove, index: number }) {
    const { input, field, editMode, remove, index } = args;

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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={remove ? () => remove(index) : undefined}
                    >
                        <Trash2 className="size-5" />
                    </Button>
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
