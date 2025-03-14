import { IViewComfy } from "@/app/interfaces/comfy-input";
import type { ResponseError } from "@/app/models/errors";
import { useState, useCallback } from "react"

// const url = "/api/comfy"
const url = "/api/viewcomfy"

export interface IUsePostPlayground {
    viewComfy: IViewComfy,
    workflow?: object,
    onSuccess: (outputs: Blob[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => void,
}

export const usePostPlayground = () => {
    const [loading, setLoading] = useState(false);

    const doPost = useCallback(async ({ viewComfy, workflow, onSuccess, onError }: IUsePostPlayground) => {
        setLoading(true);
        try {
            const formData = new FormData();
            const viewComfyJSON: IViewComfy = { 
                    inputs:[],
                    textOutputEnabled: viewComfy.textOutputEnabled ?? false
                };
            for (const { key, value } of viewComfy.inputs) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else {
                    viewComfyJSON.inputs.push({ key, value });
                }
            }

            formData.append('workflow', JSON.stringify(workflow));
            formData.append('viewComfy', JSON.stringify(viewComfyJSON));

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const output: Blob[] = [blob];


            onSuccess(output);
        } catch (error) {
            onError(error);
        }
        setLoading(false);
    }, []);

    return { doPost, loading };
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function findSubarray(arr: Uint8Array, separator: Uint8Array): number {
    outer: for (let i = 0; i <= arr.length - separator.length; i++) {
        for (let j = 0; j < separator.length; j++) {
            if (arr[i + j] !== separator[j]) {
                continue outer;
            }
        }
        return i;
    }
    return -1;
}
