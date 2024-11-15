import type { IViewComfyBase } from "@/app/providers/view-comfy-provider";

export interface IInputField {
    title: string;
    placeholder: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    workflowPath: string[];
    helpText?: string;
    valueType: InputValueType | "long-text" | "video";
    validations: { required: boolean };
    key: string;
}

export interface IMultiValueInput {
    title: string;
    inputs: IInputField[];
    key: string;
}

export interface WorkflowApiJSON {
    [key: string]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputs: { [key: string]: any };
        class_type: string;
        _meta: { title: string };
    };
}


export function workflowAPItoViewComfy(source: WorkflowApiJSON): IViewComfyBase {
    let basicInputs: IMultiValueInput[] = [];
    let advancedInputs: IMultiValueInput[] = [];

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
                        basicInputs.push({
                            title: getTitleFromValue(value.class_type, value),
                            inputs: inputs,
                            key: `${key}-${value.class_type}`
                        });
                    }
                    break;
                    
                case "LoadImage":
                case "LoadImageMask":
                    const uploadInput = inputs.find(input => input.title === "Upload");
                    if (uploadInput) {
                        const input = inputs[0];
                        input.valueType = "image";
                        input.title = getTitleFromValue(value.class_type, value);
                        input.placeholder = getTitleFromValue(value.class_type, value);
                        input.value = null;
                        basicInputs.push({
                            title: getTitleFromValue(value.class_type, value),
                            inputs: [input],
                            key: `${key}-${value.class_type}`
                        });
                    }
                    break;

                case "VHS_LoadVideo":
                    const uploadInputIndex = inputs.findIndex(input => input.title === "Video");
                    if (typeof uploadInputIndex !== "undefined") {
                        inputs[uploadInputIndex].valueType = "video"
                        inputs[uploadInputIndex].value = null
                    }
                    basicInputs.push({
                        title: getTitleFromValue(value.class_type, value),
                        inputs: inputs,
                        key: `${key}-${value.class_type}`
                    });
                    break;

                default:

                    Object.keys(inputs).forEach((key) => {
                        switch(inputs[key].title.toLowerCase()) {
                            case "seed":
                            case "noise_seed":
                            case "rand_seed":
                                inputs[key].valueType = "seed";
                                break;
                        }
                    });
                   
                    if (inputs.length > 0) {
                        advancedInputs.push({
                            title: getTitleFromValue(value.class_type, value),
                            inputs: inputs,
                            key: `${key}-${value.class_type}`
                        });
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

    return { inputs: basicInputs, advancedInputs, title: "", description: "" };

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInputField(args: { node: { key: string, value: any }, path: string[] }): IInputField | undefined {
    const { node, path } = args;
    let input: IInputField | undefined = undefined;

    if (Array.isArray(node.value)) {
        return undefined;
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
                valueType: parseValueType(node.value),
                validations: { required: true },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return value._meta?.title || class_type;
}
