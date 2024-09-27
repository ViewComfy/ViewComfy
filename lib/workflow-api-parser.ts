import { IViewComfyJSON } from "@/app/providers/view-comfy-provider";

export interface IInputField {
    title: string;
    placeholder: string;
    value: any;
    workflowPath: string[];
    helpText?: string;
    valueType: InputValueType | "long-text";
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
        inputs: { [key: string]: any };
        class_type: string;
        _meta: { title: string };
    };
}


export function workflowAPItoViewComfy(source: WorkflowApiJSON): IViewComfyJSON {
    const basicInputs: IInputField[] = [];
    const advancedInputs: IMultiValueInput[] = [];

    for (const [key, value] of Object.entries(source)) {
        const inputs: IInputField[] = [];
        for (const node of Object.entries(value.inputs)) {
            const input = parseInputField({ node: { key: node[0], value: node[1] }, path: [key, "inputs"] });
            if (input) {
                inputs.push(input);
            }
        }
        if (value.class_type === 'CLIPTextEncode') {
            const input = inputs[0];
            input.valueType = "long-text";
            input.title = value._meta.title;
            input.placeholder = value._meta.title;
            basicInputs.push(input);
        } else if (value.class_type === "LoadImage" || value.class_type === "LoadImageMask") {
            const uploadInput = inputs.find(input => input.title === "Upload");
            if (uploadInput) {
                const input = inputs[0];
                input.valueType = "image";
                input.title = value._meta.title;
                input.placeholder = value._meta.title;
                input.value = null;
                basicInputs.push(input);
            }
        } else if (inputs.length > 1) {
            advancedInputs.push({
                title: value._meta.title,
                inputs: inputs,
                key: `${key}-${value.class_type}`
            });
        }
    }

    return { inputs: basicInputs, advancedInputs, title: "", description: "" };

}

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