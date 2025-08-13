
/**
 * Represents the output file data from a prompt execution
 */
export interface FilesData {
    filename: string;
    content_type: string;
    data: string;
    size: number;
}

/**
 * Represents the output file with a link to download the data from a prompt execution
 */
export class S3FilesData {
    filename: string;
    content_type: string;
    filepath: string;
    size: number;

    constructor(data: {
        filename: string;
        content_type: string;
        filepath: string;
        size: number;
    }) {
        this.filename = data.filename;
        this.content_type = data.content_type;
        this.filepath = data.filepath;
        this.size = data.size;
    }
}


/**
 * Creates a PromptResult object from the response
 *
 * @param data Raw prompt result data
 * @returns A properly formatted PromptResult with File objects
 */
export class PromptResult {
    /** Unique identifier for the prompt */
    prompt_id: string;

    /** Current status of the prompt execution */
    status: string;

    /** Whether the prompt execution is complete */
    completed: boolean;

    /** Time taken to execute the prompt in seconds */
    execution_time_seconds: number;

    /** The original prompt configuration */
    prompt: Record<string, unknown>;

    /** List of output files */
    outputs: (File | S3FilesData)[];

    constructor(data: {
        prompt_id: string;
        status: string;
        completed: boolean;
        execution_time_seconds: number;
        prompt: Record<string, unknown>;
        outputs?: FilesData[] | S3FilesData[];
    }) {
        const {
            prompt_id,
            status,
            completed,
            execution_time_seconds,
            prompt,
            outputs = [],
        } = data;

        // Convert output data to File objects
        const fileOutputs: (File | S3FilesData)[] = outputs.map((output: FilesData | S3FilesData) => {
            if (output instanceof S3FilesData) {
                return output;
            } else {
                const binaryData = atob(output.data);
                const arrayBuffer = new ArrayBuffer(binaryData.length);
                const uint8Array = new Uint8Array(arrayBuffer);

                for (let i = 0; i < binaryData.length; i++) {
                    uint8Array[i] = binaryData.charCodeAt(i);
                }

                const blob = new Blob([arrayBuffer], { type: output.content_type });

                // Create File object from Blob
                return new File([blob], output.filename, {
                    type: output.content_type,
                    lastModified: new Date().getTime(),
                });
            }
        });

        this.prompt_id = prompt_id;
        this.status = status;
        this.completed = completed;
        this.execution_time_seconds = execution_time_seconds;
        this.prompt = prompt;
        this.outputs = fileOutputs;
    }
}
