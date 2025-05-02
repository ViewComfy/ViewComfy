import React, { useEffect, useState } from 'react';
import 'react18-json-view/src/style.css'
import { IViewComfyJSON, useViewComfy, type IViewComfyBase } from "@/app/providers/view-comfy-provider";
import { useForm, useFieldArray } from 'react-hook-form';
import { ViewComfyForm } from '@/components/view-comfy/view-comfy-form';
import { ToastAction } from "@/components/ui/toast"
import { useToast } from '@/hooks/use-toast';
import { CheckIcon } from 'lucide-react';

interface ViewComfyFormEditorProps {
    onSubmit: (data: IViewComfyBase) => void;
    viewComfyJSON: IViewComfyBase;
}


export default function ViewComfyFormEditor({ onSubmit, viewComfyJSON }: ViewComfyFormEditorProps) {

    const { viewComfyState } = useViewComfy();
    const { toast } = useToast();

    const [downloadJson, setDownloadJson] = useState<boolean>(false);

    const defaultValues: IViewComfyBase = {
        title: viewComfyJSON.title,
        description: viewComfyJSON.description,
        textOutputEnabled: viewComfyJSON.textOutputEnabled,
        viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint,
        previewImages: viewComfyJSON.previewImages,
        inputs: viewComfyJSON.inputs,
        advancedInputs: viewComfyJSON.advancedInputs,
    }

    const form = useForm<IViewComfyBase>({
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
        if (viewComfyJSON) {
            form.reset({
                title: viewComfyJSON.title,
                description: viewComfyJSON.description,
                textOutputEnabled: viewComfyJSON.textOutputEnabled,
                viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint,
                previewImages: viewComfyJSON.previewImages,
                inputs: viewComfyJSON.inputs,
                advancedInputs: viewComfyJSON.advancedInputs,
            });
        }
    }, [viewComfyJSON, form]);


    function submitOnCLick(data: IViewComfyBase) {
        onSubmit(data);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function downloadViewComfyJSON(data: any) {
        onSubmit(data);
        setDownloadJson(true);
    }

    useEffect(() => {
        if (downloadJson) {
            const workflows = viewComfyState.viewComfys.map((item) => {
                return {
                    viewComfyJSON: { ...item.viewComfyJSON },
                    workflowApiJSON: { ...item.workflowApiJSON }
                }
            });

            const viewComfyJSON: IViewComfyJSON = {
                "file_type": "view_comfy",
                "file_version": "1.0.0",
                "version": "0.0.1",
                "appTitle": viewComfyState.appTitle || "",
                "appImg": viewComfyState.appImg || "",
                workflows
            };

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
            setDownloadJson(false);
        }
    }, [downloadJson, viewComfyState.viewComfys, viewComfyState.appTitle, viewComfyState.appImg]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <ViewComfyForm
                form={form}
                onSubmit={submitOnCLick}
                inputFieldArray={inputFieldArray}
                advancedFieldArray={advancedFieldArray}
                editMode={true}
                downloadViewComfyJSON={downloadViewComfyJSON}
            >
            </ViewComfyForm>
        </div>
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

