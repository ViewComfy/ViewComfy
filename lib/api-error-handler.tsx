import { ResponseError } from "@/app/models/errors";
import { Fragment } from "react";

export class ApiErrorHandler {

    public apiErrorToDialog(error: ResponseError): { title?: string, description: React.ReactNode } {
        if (error.errorType) {

            let description: React.ReactNode = <></>;
            if (Array.isArray(error.errorDetails)) {
                description = error.errorDetails.map((detail, index) => (
                    (<Fragment key={index}> {detail} <br /> </Fragment> as React.ReactNode)
                ));
            } else if (typeof error.errorDetails === 'string') {
                description = error.errorDetails
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
