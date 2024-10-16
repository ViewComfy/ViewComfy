import { useFieldArray, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button";
import type { IViewComfyJSON } from "@/app/providers/view-comfy-provider";
import { cn } from "@/lib/utils";
import { ViewComfyForm } from "@/components/view-comfy/view-comfy-form";
import { WandSparkles } from "lucide-react";
import "./PlaygroundForm.css";

export function PlaygroundForm(props: {
    viewComfyJSON: IViewComfyJSON, onSubmit: (data: IViewComfyJSON) => void, loading: boolean
}) {
    const { viewComfyJSON, onSubmit, loading } = props;
    const defaultValues = {
        title: viewComfyJSON.title,
        description: viewComfyJSON.description,
        inputs: viewComfyJSON.inputs,
        advancedInputs: viewComfyJSON.advancedInputs,
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

    return (
        <>
            <ViewComfyForm form={form} onSubmit={onSubmit} inputFieldArray={inputFieldArray} advancedFieldArray={advancedFieldArray} isLoading={loading}>
                <div className={cn("sticky bottom-0 p-4 bg-background w-full  rounded-md")}>
                    <Button type="submit" className="w-full" disabled={loading}>
                        Generate <WandSparkles className={cn("size-5 ml-2")} />
                    </Button>
                </div>
            </ViewComfyForm>
        </>
    )
}

