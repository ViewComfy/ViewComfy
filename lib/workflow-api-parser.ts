import * as constants from "@/app/constants";
import type { IViewComfyBase } from "@/app/providers/view-comfy-provider";

const VC_BASIC_INPUT = "VC_BASIC";
const VC_ADVANCED_INPUT = "VC_ADV";

export interface IInputField {
    title: string;
    placeholder: string;
     
    value: any;
    workflowPath: string[];
    helpText?: string;
    valueType: InputValueType | "long-text" | "video" | "seed" | "noise_seed" | "rand_seed" | "select" | "audio" | "slider" | "image-mask";
    validations: { required: boolean, errorMsg?: string };
    key: string;
    options?: { label: string, value: string }[];
    slider?: { min: number, max: number, step: number };
    tooltip?: string;
}

export interface IMultiValueInput {
    title: string;
    inputs: IInputField[];
    key: string;
}

export interface WorkflowApiJSON {
    [key: string]: {
         
        inputs: { [key: string]: any };
        class_type: string;
        _meta: { title: string };
    };
}


export function workflowAPItoViewComfy(source: WorkflowApiJSON): IViewComfyBase {
    let basicInputs: IMultiValueInput[] = [];
    let advancedInputs: IMultiValueInput[] = [];

    let basicViewComfyInputs: IMultiValueInput[] = [];
    let advancedViewComfyInputs: IMultiValueInput[] = [];
    let finalInput;

    for (const [key, value] of Object.entries(source)) {
        const inputs: IInputField[] = [];
        for (const node of Object.entries(value.inputs)) {
            const input = parseInputField({ node: { key: node[0], value: node[1] }, path: [key, "inputs"] });
            if (input) {
                inputs.push(input);
            }
        }
        try {

            switch (value.class_type) {

                case 'CLIPTextEncode':
                    if (inputs.length > 0) {
                        const input = inputs[0];
                        input.valueType = "long-text";
                        input.title = getTitleFromValue(value.class_type, value);
                        input.placeholder = getTitleFromValue(value.class_type, value);
                        const finalInput = {
                            title: getTitleFromValue(value.class_type, value),
                            inputs: inputs,
                            key: `${key}-${value.class_type}`
                        };

                        if (isViewComfyInput(value._meta?.title)) {
                            basicViewComfyInputs.push(finalInput)
                        } else {
                            basicInputs.push(finalInput);
                        }
                    }
                    break;

                case "LoadImage":
                case "LoadImageMask":
                case "LoadImage_ViewComfy":
                    const input = inputs[0];
                    input.valueType = "image";
                    input.title = getTitleFromValue(value.class_type, value);
                    input.placeholder = getTitleFromValue(value.class_type, value);
                    input.value = null;
                    finalInput = {
                        title: getTitleFromValue(value.class_type, value),
                        inputs: [input],
                        key: `${key}-${value.class_type}`
                    };

                    if (isViewComfyInput(value._meta?.title)) {
                        basicViewComfyInputs.push(finalInput)
                    } else {
                        basicInputs.push(finalInput);
                    }

                    break;

                case "VHS_LoadVideo":
                    const uploadInputIndex = inputs.findIndex(input => input.title === "Video");
                    if (typeof uploadInputIndex !== "undefined") {
                        inputs[uploadInputIndex].valueType = "video"
                        inputs[uploadInputIndex].value = null
                    }

                    finalInput = {
                        title: getTitleFromValue(value.class_type, value),
                        inputs: inputs,
                        key: `${key}-${value.class_type}`
                    };

                    if (isViewComfyInput(value._meta?.title)) {
                        basicViewComfyInputs.push(finalInput)
                    } else {
                        basicInputs.push(finalInput);
                    }

                    break;
                case "LoadVideo":
                    const videoInput = inputs[0];
                    videoInput.valueType = "video";
                    videoInput.title = getTitleFromValue(value.class_type, value);
                    videoInput.placeholder = getTitleFromValue(value.class_type, value);
                    videoInput.value = null;
                    finalInput = {
                        title: getTitleFromValue(value.class_type, value),
                        inputs: [videoInput],
                        key: `${key}-${value.class_type}`
                    };

                    if (isViewComfyInput(value._meta?.title)) {
                        basicViewComfyInputs.push(finalInput)
                    } else {
                        basicInputs.push(finalInput);
                    }

                    break;

                case "LoadAudio":
                    const audioInput = inputs[0];
                    audioInput.valueType = "audio";
                    audioInput.value = null;
                    finalInput = {
                        title: getTitleFromValue(value.class_type, value),
                        inputs: [audioInput],
                        key: `${key}-${value.class_type}`
                    };

                    if (isViewComfyInput(value._meta?.title)) {
                        basicViewComfyInputs.push(finalInput)
                    } else {
                        basicInputs.push(finalInput);
                    }

                    break;

                default:

                    for (const input of inputs) {
                        if (constants.SEED_LIKE_INPUT_VALUES.some(str => input.title.toLowerCase().includes(str))) {
                            input.valueType = "seed";
                        }
                    }

                    if (inputs.length > 0) {
                        finalInput = {
                            title: getTitleFromValue(value.class_type, value),
                            inputs: inputs,
                            key: `${key}-${value.class_type}`
                        }

                        if (isViewComfyInput(value._meta?.title)) {
                            advancedViewComfyInputs.push(finalInput)
                        } else {
                            advancedInputs.push(finalInput);
                        }
                    }
                    break;
            }

        } catch (e) {
            console.log("Error", e);
        }
    }

    if (basicInputs.length === 0) {
        basicInputs = [...advancedInputs];
        advancedInputs = [];
    }

    if (basicViewComfyInputs.length === 0) {
        basicViewComfyInputs = [...advancedViewComfyInputs];
        advancedViewComfyInputs = [];
    }

    if (basicViewComfyInputs.length > 0) {
        basicInputs = [...basicViewComfyInputs];
        advancedInputs = [...advancedViewComfyInputs];
    }

    return { inputs: basicInputs, advancedInputs, title: "", description: "", previewImages: [] };

}

 
function parseInputField(args: { node: { key: string, value: any }, path: string[] }): IInputField | undefined {
    const { node, path } = args;
    let input: IInputField | undefined = undefined;

    if (Array.isArray(node.value)) {
        return undefined;
    }

    const valueType = parseValueType(node.value);
    const isRequired = () => {
        return valueType !== "boolean";
    }
    // TODO: Add error field to add errors like local urls for image inputs.
    try {
        if (node.value !== null && node.value !== undefined && typeof node.value !== 'object') {
            const workflowPath = [...path, node.key];
            input = {
                title: capitalize(node.key),
                placeholder: capitalize(node.key),
                value: node.value,
                workflowPath,
                helpText: "Helper Text",
                tooltip: "",
                valueType,
                validations: { required: isRequired() },
                key: workflowPath.join("-"),
            };
        }
        else if (typeof node.value === 'object' && node.value !== null) {
            // TODO: Handle nested objects
            console.log("Nested object", node.value);
        }
    } catch (e) {
        console.log("Error", e);
    }

    return input;
}

export type InputValueType = "string" | "number" | "bigint" | "boolean" | "float" | "image";

 
function parseValueType(value: any): InputValueType {
    switch (typeof value) {
        case 'string':
            return 'string';
        case 'number':
            if (value.toString().indexOf('.') !== -1) {
                return 'float';
            }
            return 'number';
        case 'bigint':
            return 'bigint';
        case 'boolean':
            return 'boolean';
        default:
            return 'string';
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTitleFromValue(class_type: string, value: { _meta?: { title: string } }): string {
    if (!value._meta?.title) {
        return class_type;
    }

    if (value._meta.title.startsWith(VC_BASIC_INPUT)) {
        return value._meta.title.replace(VC_BASIC_INPUT, "").trim();
    }
    else if (value._meta.title.startsWith(VC_ADVANCED_INPUT)) {
        return value._meta.title.replace(VC_ADVANCED_INPUT, "").trim();
    } else {
        return value._meta.title;
    }
}

function isViewComfyInput(title: string) {
    if (!title) {
        return false;
    }

    return (title.startsWith(VC_BASIC_INPUT) || title.startsWith(VC_ADVANCED_INPUT))
}