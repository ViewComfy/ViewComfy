/**
 * File extension mappings for media data types.
 * Used by form components and dropzones for validation.
 */

export const FILE_EXTENSIONS_BY_DATA_TYPE = {
  image: ["png", "jpg", "jpeg"],
  video: ["mp4", "avi", "webm", "mkv", "gif"],
  audio: ["mp3", "wav", "m4b", "m4p", "wma", "webm"],
} as const;

export type MediaDataType = keyof typeof FILE_EXTENSIONS_BY_DATA_TYPE;

/** Array versions of media types */
export const MEDIA_ARRAY_TO_SINGLE = {
  image_array: "image",
  video_array: "video",
  audio_array: "audio",
} as const;

export type MediaArrayDataType = keyof typeof MEDIA_ARRAY_TO_SINGLE;

/**
 * Returns the allowed file extensions for a given data type.
 * Handles both single and array media types.
 */
export function getFileExtensions(dataType: string): string[] {
  // Handle array types
  if (dataType in MEDIA_ARRAY_TO_SINGLE) {
    const singleType = MEDIA_ARRAY_TO_SINGLE[dataType as MediaArrayDataType];
    return [...FILE_EXTENSIONS_BY_DATA_TYPE[singleType]];
  }
  // Handle single types
  if (dataType in FILE_EXTENSIONS_BY_DATA_TYPE) {
    return [...FILE_EXTENSIONS_BY_DATA_TYPE[dataType as MediaDataType]];
  }
  return [];
}

/**
 * Checks if a data type represents a single file/media type.
 */
export function isMediaDataType(dataType: string): dataType is MediaDataType {
  return dataType in FILE_EXTENSIONS_BY_DATA_TYPE;
}

/**
 * Checks if a data type represents an array of media files.
 */
export function isMediaArrayDataType(dataType: string): dataType is MediaArrayDataType {
  return dataType in MEDIA_ARRAY_TO_SINGLE;
}

/**
 * Gets the base media type for an array type (e.g., "image_array" -> "image").
 */
export function getBaseMediaType(dataType: string): MediaDataType | null {
  if (dataType in MEDIA_ARRAY_TO_SINGLE) {
    return MEDIA_ARRAY_TO_SINGLE[dataType as MediaArrayDataType];
  }
  if (dataType in FILE_EXTENSIONS_BY_DATA_TYPE) {
    return dataType as MediaDataType;
  }
  return null;
}
