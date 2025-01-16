import { ResponseError } from "@/app/models/errors";

export class ApiErrorHandler {

    public apiErrorToDialog(error: ResponseError): { title?: string, description: React.ReactNode } {
        if (error.errorType) {

            let description: React.ReactNode = <></>;
            if (Array.isArray(error.errorDetails)) {
                description = error.errorDetails.map((detail, index) => (
                    (<> <p key={index}>{detail}</p> <br /> </> as React.ReactNode)
                ));
            } else {
                description = <p>error.errorDetails</p>;
            }

            return {
                title: error.errorMsg,
                description: description
            }
        }
        return {
            description: error.errorMsg
        }
    }
}
