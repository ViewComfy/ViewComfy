import { useEffect, useState } from 'react';
import { useViewComfy, type IViewComfyBase } from "@/app/providers/view-comfy-provider";
import { useForm, useFieldArray } from 'react-hook-form';
import { ViewComfyForm } from '@/components/view-comfy/view-comfy-form';
import { toast } from "sonner";
import { buildViewComfyJSON } from '@/lib/utils';

interface ViewComfyFormEditorProps {
    onSubmit: (data: IViewComfyBase) => void;
    viewComfyJSON: IViewComfyBase;
}


export default function ViewComfyFormEditor({ onSubmit, viewComfyJSON }: ViewComfyFormEditorProps) {

    const { viewComfyState } = useViewComfy();
    const [downloadJson, setDownloadJson] = useState<boolean>(false);

    const defaultValues: IViewComfyBase = {
        title: viewComfyJSON.title,
        description: viewComfyJSON.description,
        textOutputEnabled: viewComfyJSON.textOutputEnabled,
        viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint,
        showOutputFileName: viewComfyJSON.showOutputFileName,
        previewImages: viewComfyJSON.previewImages,
        inputs: viewComfyJSON.inputs,
        advancedInputs: viewComfyJSON.advancedInputs,
    }

    const form = useForm<IViewComfyBase>({
        defaultValues,
        mode: "onChange",
        reValidateMode: "onChange"
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
                showOutputFileName: viewComfyJSON.showOutputFileName,
                previewImages: viewComfyJSON.previewImages,
                inputs: viewComfyJSON.inputs,
                advancedInputs: viewComfyJSON.advancedInputs,
            }, { keepErrors: true });
        }
    }, [viewComfyJSON, form]);


    function submitOnCLick(data: IViewComfyBase) {
        onSubmit(data);

        toast.success(
            "Form Saved!", {
            description: "Go to the Playground to run it",
            duration: 3000,
        })
    }


    function downloadViewComfyJSON(data: any) {
        onSubmit(data);
        setDownloadJson(true);
    }

    useEffect(() => {
        if (downloadJson) {
            const viewComfyJSON = buildViewComfyJSON({ viewComfyState });
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
    }, [downloadJson, viewComfyState]);

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

