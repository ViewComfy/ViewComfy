import type { ResponseError } from "@/app/models/errors";
import { useState, useCallback } from "react"

const url = "/api/comfy"

export interface IUsePostPlayground {
    viewComfy: { key: string, value: string | File }[],
    workflow?: object,
    onSuccess: (outputs: Blob[]) => void,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => void,
}

export const usePostPlayground = () => {
    const [loading, setLoading] = useState(false);

    const doPost = useCallback(async ({ viewComfy, workflow, onSuccess, onError }: IUsePostPlayground) => {
        setLoading(true);
        try {
            const formData = new FormData();
            const viewComfyJSON: { key: string, value: unknown }[] = [];
            for (const { key, value } of viewComfy) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else {
                    viewComfyJSON.push({ key, value });
                }
            }
            formData.append('workflow', JSON.stringify(workflow));
            formData.append('viewComfy', JSON.stringify(viewComfyJSON));
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const responseError: ResponseError = await response.json();
                throw responseError;
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            let buffer = new Uint8Array(0);
            const output: Blob[] = [];
            const separator = new TextEncoder().encode('--BLOB_SEPARATOR--');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer = concatUint8Arrays(buffer, value);

                let separatorIndex: number;
                // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
                while ((separatorIndex = findSubarray(buffer, separator)) !== -1) {
                    const outputPart = buffer.slice(0, separatorIndex);
                    buffer = buffer.slice(separatorIndex + separator.length);

                    const mimeEndIndex = findSubarray(outputPart, new TextEncoder().encode('\r\n\r\n'));
                    if (mimeEndIndex !== -1) {
                        const mimeType = new TextDecoder().decode(outputPart.slice(0, mimeEndIndex)).split(': ')[1];
                        const outputData = outputPart.slice(mimeEndIndex + 4);
                        const blob = new Blob([outputData], { type: mimeType });
                        output.push(blob);
                    }
                }
            }

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
