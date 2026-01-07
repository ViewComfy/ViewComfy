import type React from 'react';

/**
 * Interface for media data used in drag-and-drop operations.
 */
export interface DraggableMediaData {
    url: string;
    filename: string;
    contentType: string;
}

/**
 * Custom MIME type for ViewComfy media drag-and-drop.
 */
export const DRAG_MEDIA_MIME_TYPE = 'application/x-viewcomfy-media';

/**
 * Creates a drag start handler for media outputs.
 * Sets up the data transfer with media information for drag-and-drop.
 */
export const createMediaDragHandler = (media: DraggableMediaData) =>
    (e: React.DragEvent<HTMLElement>) => {
        e.dataTransfer.setData(DRAG_MEDIA_MIME_TYPE, JSON.stringify(media));
        e.dataTransfer.effectAllowed = 'copy';
    };
