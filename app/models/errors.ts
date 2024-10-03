export class ErrorBase {
    public message: string;
    public errors: string[];
    public errorType: ErrorTypes;

    constructor(args: { message: string, errorType: ErrorTypes, errors?: string[]  }) {
        this.message = args.message;
        this.errorType = args.errorType;
        this.errors = args.errors || [];
    }
}

export class ComfyWorkflowError extends ErrorBase {

    constructor(args: { message: string, errors: string[] }) {
        super({ message: args.message, errorType: ErrorTypes.COMFY_WORKFLOW, errors: args.errors });
    }
}

export class ComfyError extends ErrorBase {

    constructor(args: { message: string, errors: string[] }) {
        super({ message: args.message, errorType: ErrorTypes.COMFY, errors: args.errors });
    }
}



export class ResponseError {

    public errorMsg: string;
    public errorDetails: string | string[];
    public errorType: ErrorTypes;

    constructor(args: { errorMsg: string, error: string | string[], errorType: ErrorTypes }) {
        this.errorMsg = args.errorMsg;
        this.errorDetails = args.error;
        this.errorType = args.errorType;
    }
}

export class ErrorResponseFactory {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public getErrorResponse(error: any): ResponseError {
        if (error.errorType) {
            return new ResponseError({
                errorMsg: error.message,
                error: error.errors,
                errorType: error.errorType
            }); 
        }

        return new ResponseError({
            errorMsg: "Something went wrong",
            error: error.message,
            errorType: ErrorTypes.UNKNOWN
        });
    }
}

export enum ErrorTypes {
    COMFY_WORKFLOW = "ComfyWorkflowError",
    COMFY = "ComfyError",
    UNKNOWN = "UnknownError",
    VIEW_MODE_MISSING_FILES = "ViewModeMissingFilesError",
}

