import { ComfyWorkflowError } from "../models/errors";

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
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public tryToParseWorkflowError(error: any): ComfyWorkflowError | undefined {
        if (!error.stdout) {
            return;
        }
        const stdout = error.stdout;
        const errorIndex = stdout.indexOf("Error running workflow");
        if (errorIndex === -1) {
            return;
        }

        let jsonStr = stdout.slice(errorIndex + "Error running workflow".length).trim();

        // Remove any newline characters and escape any that are within string values
        jsonStr = jsonStr.replace(/\n/g, "")
            .replace(/\\n/g, "\\n")
            .replace(/\r/g, "")
            .replace(/\\r/g, "\\r");

        try {
            // Parse the JSON string into a JavaScript object
            const errorDict = JSON.parse(jsonStr);
            return new ComfyWorkflowError({
                message: "Error running workflow",
                errors: this.extractErrors(errorDict)
            });
        } catch (error) {
            console.error("Error parsing JSON. The extracted string might not be valid JSON.", error);
            return undefined;
        }
    }

    private extractErrors(errorDict: ErrorDict): string[] {
        const errorMessages: string[] = [];

        for (const [_, nodeError] of Object.entries(errorDict)) {
            let errorMsgs = "";
            for (const error of nodeError.errors) {
                errorMsgs += `${error.details}: ${error.message}, `;
            }
            errorMessages.push(`${nodeError.class_type}: ${errorMsgs}`);
        }

        return errorMessages;
    }
}
