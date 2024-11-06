import { ComfyWorkflowError } from "@/app/models/errors";

interface ErrorInfo {
    message: string;
    details: string;
}

interface WorkflowNodeError {
    errors: ErrorInfo[];
    class_type: string;
}

type ErrorDict = Record<string, WorkflowNodeError>;

export class ComfyErrorHandler {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public tryToParseWorkflowError(error: any): ComfyWorkflowError | undefined {
        try {
            if (error.node_errors) {
                return new ComfyWorkflowError({
                    message: error.message,
                    errors: this.extractErrors(error.node_errors)
                });
            }
            return new ComfyWorkflowError({
                message: "Error running workflow",
                errors: this.extractErrors(error.message)
            });
        } catch (error) {
            console.error("Error parsing JSON. The extracted string might not be valid JSON.", error);
            return undefined;
        }
    }

    private extractErrors(errorDict: ErrorDict): string[] {
        const errorMessages: string[] = [];

        for (const [, nodeError] of Object.entries(errorDict)) {
            let errorMsgs = "";
            for (const error of nodeError.errors) {
                errorMsgs += `${error.details}: ${error.message}, `;
            }
            errorMessages.push(`${nodeError.class_type}: ${errorMsgs}`);
        }

        return errorMessages;
    }
}
