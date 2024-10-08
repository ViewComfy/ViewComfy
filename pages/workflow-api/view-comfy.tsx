import React, { useEffect } from 'react';
import 'react18-json-view/src/style.css'
import { ActionType, useViewComfy } from "@/app/providers/view-comfy-provider";
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ViewComfyForm } from '@/components/view-comfy/view-comfy-form';
import { ToastAction } from "@/components/ui/toast"
import { useToast } from '@/hooks/use-toast';
import { CheckIcon } from 'lucide-react';


export function ViewComfyFormEditor() {

    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const { toast } = useToast();
    if (!viewComfyState?.viewComfyJSON) {
        return null;
    }

    const defaultValues = {
        title: viewComfyState.viewComfyJSON.title,
        description: viewComfyState.viewComfyJSON.description,
        inputs: viewComfyState.viewComfyJSON.inputs,
        advancedInputs: viewComfyState.viewComfyJSON.advancedInputs,
    }

    const form = useForm({
        defaultValues
    });

    const inputFieldArray = useFieldArray({
        control: form.control,
        name: "inputs"
    });

    const advancedFieldArray = useFieldArray({
        control: form.control,
        name: "advancedInputs"
    });

    useEffect(() => {
        if (viewComfyState?.viewComfyJSON) {
            form.reset({
                title: viewComfyState.viewComfyJSON.title,
                description: viewComfyState.viewComfyJSON.description,
                inputs: viewComfyState.viewComfyJSON.inputs,
                advancedInputs: viewComfyState.viewComfyJSON.advancedInputs,
            });
        }
    }, [viewComfyState, form]);

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    function onSubmit(data: any) {
        viewComfyStateDispatcher({
            type: ActionType.SET_VIEW_COMFY_JSON,
            payload: data
        });
        toast({
            title: "Form Saved!",
            description: "Go to the Playground to run it",
            duration: 3000,
            action: (
                <ToastAction altText="Goto schedule to undo">
                    <CheckIcon className="size-5 text-green-500" />
                </ToastAction>
            ),
        });
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    function downloadViewComfyJSON(data: any) {
        viewComfyStateDispatcher({
            type: ActionType.SET_VIEW_COMFY_JSON,
            payload: data
        });

        const viewComfyJSON = {
            "file_type": "view_comfy",
            "file_version": "1.0.0",
            "version": "0.0.1",
            ...data
        }

        const jsonString = JSON.stringify(viewComfyJSON, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'view_comfy.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }


    return (
        <>
            <ViewComfyForm form={form} onSubmit={onSubmit} inputFieldArray={inputFieldArray} advancedFieldArray={advancedFieldArray} editMode={true}>
                <div className={cn("sticky bottom-0 p-4 bg-background w-full rounded-md")}>
                    <Button type="submit" className="w-full mb-2">
                        Save Changes
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={form.handleSubmit(downloadViewComfyJSON)}>
                        Download as ViewComfy JSON
                    </Button>
                </div>
            </ViewComfyForm>
        </>
    )
}

export function parseWorkflowApiTypeToInputHtmlType(type: string): HTMLInputElement["type"] {

    switch (type) {
        case "string":
            return "text";
        case "number":
            return "number";
        case "bigint":
            return "number";
        case "boolean":
            return "checkbox";
        case "float":
            return "number";
        case "long-text":
            return "text";
        default:
            return "text";
    }
}

