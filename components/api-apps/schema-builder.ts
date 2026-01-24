import { z } from "zod";
import type {
  AppInputFieldOutputDTO,
  AppInputDataTypeEnum,
} from "@/src/generated";
import { isMediaDataType, isMediaArrayDataType } from "@/lib/file-extensions";

/**
 * Builds a zod schema field based on the input field definition.
 */
function buildFieldSchema(field: AppInputFieldOutputDTO): z.ZodTypeAny {
  let schema: z.ZodTypeAny;
  const dataType = field.dataType as AppInputDataTypeEnum;

  // Handle media array types - validate as array of URL strings
  if (isMediaArrayDataType(dataType)) {
    const minItems = field.minValue ?? 0;
    const maxItems = field.maxValue ?? Infinity;

    let arraySchema = z.array(z.url("Invalid file URL"));

    if (minItems > 0) {
      arraySchema = arraySchema.min(minItems, `At least ${minItems} file(s) required`);
    }
    if (maxItems < Infinity) {
      arraySchema = arraySchema.max(maxItems, `Maximum ${maxItems} file(s) allowed`);
    }

    if (field.required && minItems > 0) {
      schema = arraySchema;
    } else {
      schema = arraySchema.optional();
    }
    return schema;
  }

  // Handle single file/media types - validate as URL string (S3 URL)
  if (isMediaDataType(dataType)) {
    if (field.required) {
      schema = z.url("Please upload a file");
    } else {
      schema = z.url().nullable().optional();
    }
    return schema;
  }

  // Base schema based on dataType
  switch (dataType) {
    case "string":
      schema = field.required
        ? z.string().min(3, "This field is required")
        : z.string();
      break;
    case "integer":
      schema = z.coerce.number().int();
      if (field.minValue != null) {
        schema = (schema as z.ZodNumber).min(field.minValue);
      }
      if (field.maxValue != null) {
        schema = (schema as z.ZodNumber).max(field.maxValue);
      }
      break;
    case "float":
      schema = z.coerce.number();
      if (field.minValue != null) {
        schema = (schema as z.ZodNumber).min(field.minValue);
      }
      if (field.maxValue != null) {
        schema = (schema as z.ZodNumber).max(field.maxValue);
      }
      break;
    case "boolean":
      schema = z.boolean();
      break;
    default:
      schema = z.any();
  }

  // Handle required/optional (string already handled above)
  if (!field.required && dataType !== "string") {
    schema = schema.optional();
  }

  return schema;
}

/**
 * Generates a zod schema from an array of AppInputFieldOutputDTO.
 * Returns both the schema and a type-safe default values object.
 */
export function buildFormSchema(inputs: AppInputFieldOutputDTO[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of inputs) {
    shape[field.name] = buildFieldSchema(field);
  }

  return z.object(shape);
}

/**
 * Extracts default values from input field definitions.
 */
export function getDefaultValues(
  inputs: AppInputFieldOutputDTO[]
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const field of inputs) {
    const dataType = field.dataType as AppInputDataTypeEnum;

    // Media array types default to empty array
    if (isMediaArrayDataType(dataType)) {
      defaults[field.name] = [];
      continue;
    }

    // Single file/media types default to null
    if (isMediaDataType(dataType)) {
      defaults[field.name] = null;
      continue;
    }

    if (field.default !== null && field.default !== undefined) {
      defaults[field.name] = field.default;
    } else {
      // Provide sensible defaults based on dataType
      switch (dataType) {
        case "string":
          defaults[field.name] = "";
          break;
        case "integer":
        case "float":
          // Only set a default value for required fields
          defaults[field.name] = field.required ? (field.minValue ?? 0) : undefined;
          break;
        case "boolean":
          defaults[field.name] = false;
          break;
        default:
          defaults[field.name] = undefined;
      }
    }
  }

  return defaults;
}

export type AppFormValues = Record<string, unknown>;
