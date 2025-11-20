
"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Slider } from './slider';
import {
  Pencil,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MaskEditorProps {
  imageUrl: string;
  existingMask?: File | null;
  onSave: (maskFile: File | undefined) => void;
  onCancel: () => void;
  className?: string;
}

type Tool = 'brush' | 'eraser' | 'pan';

interface HistoryState {
  imageData: ImageData;
}

export function MaskEditor({ imageUrl, existingMask, onSave, onCancel, className }: MaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Mask data (black/white)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null); // Display overlay
  const containerRef = useRef<HTMLDivElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawPositionRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushHardness, setBrushHardness] = useState(1);
  const [eraserOpacity, setEraserOpacity] = useState(1);
  const [eraserHardness, setEraserHardness] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number; size: number } | null>(null);



  const initializeCanvas = async (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!canvas || !displayCanvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    displayCanvas.width = img.width;
    displayCanvas.height = img.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If there's an existing mask, load it
    if (existingMask) {
      const maskImg = new Image();
      maskImg.onload = () => {
        // Create temp canvas to extract alpha channel
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, });
        if (!tempCtx) return;

        // Draw mask image
        tempCtx.drawImage(maskImg, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        // Extract alpha and invert back to mask
        const maskData = ctx.createImageData(canvas.width, canvas.height);

        // ALSO: Create a version of the image without transparency for display
        const opaqueImageData = tempCtx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < imageData.data.length; i += 4) {
          const alpha = imageData.data[i + 3];
          const maskOpacity = 255 - alpha;

          // Set white RGB with restored opacity for mask
          maskData.data[i] = 255;
          maskData.data[i + 1] = 255;
          maskData.data[i + 2] = 255;
          maskData.data[i + 3] = maskOpacity;

          // Copy RGB but make fully opaque for background image
          opaqueImageData.data[i] = imageData.data[i];
          opaqueImageData.data[i + 1] = imageData.data[i + 1];
          opaqueImageData.data[i + 2] = imageData.data[i + 2];
          opaqueImageData.data[i + 3] = 255; // Force fully opaque
        }

        // Update the background image to be opaque
        const opaqueCanvas = document.createElement('canvas');
        opaqueCanvas.width = canvas.width;
        opaqueCanvas.height = canvas.height;
        const opaqueCtx = opaqueCanvas.getContext('2d', { willReadFrequently: true, });
        if (opaqueCtx) {
          opaqueCtx.putImageData(opaqueImageData, 0, 0);
          const opaqueImg = new Image();
          opaqueImg.onload = () => {
            setImage(opaqueImg); // Replace the transparent image with opaque version
          };
          opaqueImg.src = opaqueCanvas.toDataURL();
        }

        ctx.putImageData(maskData, 0, 0);
        saveToHistory(ctx);
      };
      maskImg.src = URL.createObjectURL(existingMask);
    } else {
      // Save initial empty state
      saveToHistory(ctx);
    }
  };

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ imageData });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    // Update display canvas
    updateDisplayCanvas();
  };

  const updateDisplayCanvas = () => {
    const maskCanvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!maskCanvas || !displayCanvas) return;

    const maskCtx = maskCanvas.getContext('2d');
    const displayCtx = displayCanvas.getContext('2d');
    if (!maskCtx || !displayCtx) return;

    // Clear display canvas
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    // Get mask data
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create full white overlay where mask exists
    const overlayData = displayCtx.createImageData(maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      const r = maskData.data[i];
      const g = maskData.data[i + 1];
      const b = maskData.data[i + 2];
      const a = maskData.data[i + 3];

      // Calculate mask opacity: if RGB are white, use alpha; otherwise use RGB brightness
      let maskOpacity;
      if (a > 0 && (r > 0 || g > 0 || b > 0)) {
        // Has content - use alpha channel as the opacity
        maskOpacity = a;
      } else {
        // Empty pixel
        maskOpacity = 0;
      }

      // Show white with opacity matching the mask
      overlayData.data[i] = 255;         // R = white
      overlayData.data[i + 1] = 255;     // G = white
      overlayData.data[i + 2] = 255;     // B = white
      overlayData.data[i + 3] = maskOpacity; // A = opacity from mask alpha
    }

    displayCtx.putImageData(overlayData, 0, 0);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const prevState = history[historyStep - 1];
      ctx.putImageData(prevState.imageData, 0, 0);
      setHistoryStep(historyStep - 1);
      updateDisplayCanvas();
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', {
        willReadFrequently: true,
      });
      if (!ctx || !canvas) return;

      const nextState = history[historyStep + 1];
      ctx.putImageData(nextState.imageData, 0, 0);
      setHistoryStep(historyStep + 1);
      updateDisplayCanvas();
    }
  };

  // TODO: FIX THE CLEAR MASK FUNCTION SO THAT IT CLEARS ALREADY EXISTING MASKS
  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Save to history
    saveToHistory(ctx);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!canvas || !displayCanvas) return { x: 0, y: 0 };

    // Get display canvas bounding rect (already includes CSS transforms)
    const rect = displayCanvas.getBoundingClientRect();

    // Mouse position relative to canvas element in screen space
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Convert from screen space to canvas space
    // rect.width/height already include zoom transform
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = offsetX * scaleX;
    const y = offsetY * scaleY;

    return { x, y };
  };

  // Draw a single brush/eraser stamp at position
  const drawStamp = (tempCtx: CanvasRenderingContext2D, x: number, y: number, isBrush: boolean) => {
    if (isBrush) {
      // Brush
      tempCtx.globalCompositeOperation = 'source-over';
      if (brushHardness === 1) {
        tempCtx.fillStyle = 'rgb(255, 255, 255)';
        tempCtx.beginPath();
        tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        tempCtx.fill();
      } else {
        const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
        const hardStop = brushHardness;
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(hardStop, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        tempCtx.fillStyle = gradient;
        tempCtx.beginPath();
        tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        tempCtx.fill();
      }
    } else {
      // Eraser
      tempCtx.globalCompositeOperation = 'destination-out';
      if (eraserHardness === 1) {
        tempCtx.globalAlpha = eraserOpacity;
        tempCtx.beginPath();
        tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        tempCtx.fill();
        tempCtx.globalAlpha = 1;
      } else {
        const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
        const hardStop = eraserHardness;
        gradient.addColorStop(0, `rgba(0, 0, 0, ${eraserOpacity})`);
        gradient.addColorStop(hardStop, `rgba(0, 0, 0, ${eraserOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tempCtx.fillStyle = gradient;
        tempCtx.beginPath();
        tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        tempCtx.fill();
      }
    }
  };

  // Interpolate between two points and draw stamps
  const drawInterpolated = (tempCtx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, isBrush: boolean) => {
    const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    const steps = Math.max(1, Math.ceil(distance / (brushSize / 4))); // Draw every quarter brush size

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      drawStamp(tempCtx, x, y, isBrush);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'pan') {
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Create temp canvas for both brush and eraser strokes
    if (!tempCanvasRef.current) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvasRef.current = tempCanvas;

      // For eraser, copy current mask to temp canvas
      if (tool === 'eraser' && history[historyStep]) {
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(history[historyStep].imageData, 0, 0);
        }
      }
    }

    // Initialize drawing - don't set lastDrawPosition yet, let draw() handle it
    setIsDrawing(true);

    // Draw first point
    const { x, y } = getCanvasCoordinates(e);
    const tempCanvas = tempCanvasRef.current;
    if (tempCanvas) {
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Draw first stamp immediately
        drawStamp(tempCtx, x, y, tool === 'brush');
        lastDrawPositionRef.current = { x, y };

        // Update main canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (tool === 'brush') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (history[historyStep]) {
              ctx.putImageData(history[historyStep].imageData, 0, 0);
            }
            ctx.globalAlpha = brushOpacity;
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.globalAlpha = 1;
          } else if (tool === 'eraser') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0);
          }
          updateDisplayCanvas();
        }
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'pan') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    const tempCanvas = tempCanvasRef.current;
    if (!tempCanvas) return;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw with interpolation between last position and current position
    if (lastDrawPositionRef.current) {
      drawInterpolated(tempCtx, lastDrawPositionRef.current.x, lastDrawPositionRef.current.y, x, y, tool === 'brush');
    } else {
      // First point - just draw a single stamp
      drawStamp(tempCtx, x, y, tool === 'brush');
    }

    // Update last position
    lastDrawPositionRef.current = { x, y };

    // Composite to main canvas
    if (tool === 'brush') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (history[historyStep]) {
        ctx.putImageData(history[historyStep].imageData, 0, 0);
      }
      ctx.globalAlpha = brushOpacity;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalAlpha = 1;
    } else if (tool === 'eraser') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    }

    // Update display in real-time
    updateDisplayCanvas();
  };

  const stopDrawing = () => {
    if (isDrawing && tool !== 'pan') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        saveToHistory(ctx);
      }
      // Clear temp canvas
      tempCanvasRef.current = null;
      // Reset last draw position
      lastDrawPositionRef.current = null;
    }
    setIsDrawing(false);
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Update cursor position for preview (relative to container, not canvas)
    const canvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    const container = containerRef.current;
    if (canvas && displayCanvas && container) {
      const containerRect = container.getBoundingClientRect();
      const canvasRect = displayCanvas.getBoundingClientRect();

      // Cursor position relative to container
      const cursorX = e.clientX - containerRect.left;
      const cursorY = e.clientY - containerRect.top;

      // Calculate screen-space brush size (brushSize is in canvas space)
      const screenBrushSize = brushSize * (canvasRect.width / canvas.width);

      setCursorPosition({
        x: cursorX,
        y: cursorY,
        size: screenBrushSize,
      });
    }

    if (isPanning && tool === 'pan') {
      const deltaX = e.clientX - lastPanPosition.x;
      const deltaY = e.clientY - lastPanPosition.y;
      setPan({ x: pan.x + deltaX, y: pan.y + deltaY });
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    } else {
      draw(e);
    }
  };

  const handleMouseLeave = () => {
    setCursorPosition(null);
    stopDrawing();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const fitToScreen = (img?: HTMLImageElement) => {
    const container = containerRef.current;
    const targetImage = img || image;
    if (!container || !targetImage) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate zoom to fit image in container with some padding
    const scaleX = (containerWidth * 0.9) / targetImage.width;
    const scaleY = (containerHeight * 0.9) / targetImage.height;
    const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    setZoom(fitZoom);
    setPan({ x: 0, y: 0 }); // Reset pan to center
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (tool === 'pan') {
      // Zoom in/out in pan mode
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    } else if (tool === 'brush' || tool === 'eraser') {
      // Change brush size in brush/eraser mode
      const delta = e.deltaY > 0 ? -5 : 5;
      setBrushSize(prev => Math.max(5, Math.min(100, prev + delta)));
    }
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    // Get mask data
    const maskCtx = canvas.getContext('2d');
    if (!maskCtx) return;

    const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Check if the canvas is clear
    const isCanvasClear = maskData.data.every(channel => channel === 0);

    if (isCanvasClear) {
      // If the canvas is clear, call onSave with null
      onSave(undefined);
      return;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx2 = maskCanvas.getContext('2d');
    if (!maskCtx2) return;

    maskCtx2.fillStyle = 'black';
    maskCtx2.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx2.drawImage(canvas, 0, 0);
    const maskData2 = maskCtx2.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create image with alpha channel for ComfyUI LoadImage
    // ComfyUI code: mask = 1. - torch.from_numpy(alpha/255)
    // So: alpha=255 → mask=0 (unmasked), alpha=0 → mask=1 (masked)
    // We drew: white=255=masked area
    // Need: white → alpha=0 (so ComfyUI gets mask=1)
    const imageWithAlphaCanvas = document.createElement('canvas');
    imageWithAlphaCanvas.width = canvas.width;
    imageWithAlphaCanvas.height = canvas.height;
    const imageWithAlphaCtx = imageWithAlphaCanvas.getContext('2d');
    if (!imageWithAlphaCtx) return;

    // Draw image using 'copy' mode to extract RGB values directly
    // This prevents compositing issues with transparent pixels
    imageWithAlphaCtx.globalCompositeOperation = 'copy';
    imageWithAlphaCtx.drawImage(image, 0, 0);
    imageWithAlphaCtx.globalCompositeOperation = 'source-over'; // Reset to default

    const imageData = imageWithAlphaCtx.getImageData(0, 0, imageWithAlphaCanvas.width, imageWithAlphaCanvas.height);

    // Apply mask to alpha channel only, preserving RGB values from the image
    // This ensures transparent areas from previous masks don't become white
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskValue = maskData2.data[i]; // white=255 (masked area), black=0 (unmasked)

      // Apply mask by inverting: white drawn areas → transparent (alpha=0)
      // unmasked areas → opaque (alpha=255)
      imageData.data[i + 3] = 255 - maskValue;
    }
    imageWithAlphaCtx.putImageData(imageData, 0, 0);

    // // Create preview (original + red overlay)
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.drawImage(image, 0, 0);
    const previewData = previewCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);

    for (let i = 0; i < previewData.data.length; i += 4) {
      if (maskData.data[i] > 128) {
        previewData.data[i] = Math.min(255, previewData.data[i] * 0.6 + 255 * 0.4);
        previewData.data[i + 1] = Math.floor(previewData.data[i + 1] * 0.6);
        previewData.data[i + 2] = Math.floor(previewData.data[i + 2] * 0.6);
      }
    }
    previewCtx.putImageData(previewData, 0, 0);

    // Convert to files
    const imageWithAlphaBlob = await new Promise<Blob>((resolve) => {
      imageWithAlphaCanvas.toBlob((blob) => resolve(blob!), 'image/png');
    });

    const maskedImageFile = new File([imageWithAlphaBlob], 'masked_image.png', { type: 'image/png' });
    onSave(maskedImageFile);
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      initializeCanvas(img);
      fitToScreen(img);
    };
    img.src = imageUrl;
  }, [imageUrl, existingMask]);


  return (
    <div className={cn("flex h-full w-full bg-background border rounded-lg", className)}>
      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-muted/20"
        style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <div className="relative" style={{ transform: `scale(${zoom})` }}>
            {/* Background image */}
            {image && (
              <img
                src={imageUrl}
                alt="Original"
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: image.width,
                  height: image.height,
                }}
              />
            )}

            {/* Mask canvas (hidden - stores black/white mask data) */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* Display canvas (visible - shows red overlay) */}
            <canvas
              ref={displayCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              className="relative"
              style={{
                cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'none',
              }}
            />
          </div>
        </div>

        {/* Brush cursor preview - outside transform so not affected by zoom/pan */}
        {cursorPosition && (tool === 'brush' || tool === 'eraser') && (
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: cursorPosition.x - cursorPosition.size / 2,
              top: cursorPosition.y - cursorPosition.size / 2,
              width: cursorPosition.size,
              height: cursorPosition.size,
              border: tool === 'eraser' ? '2px dashed red' : '2px dashed black',
              boxShadow: '0 0 0 1px white',
              opacity: 0.8,
            }}
          />
        )}
      </div>

      {/* Right Sidebar - Tools */}
      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Tools</h3>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={tool === 'brush' ? 'default' : 'outline'}
                  onClick={() => setTool('brush')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Brush (Draw Mask)</TooltipContent>
            </Tooltip>
            {/* // TODO: THIS FUNCTION HAS THE SAME PROBLEM AS THE CLEAR MASK FUNCTION */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={tool === 'eraser' ? 'default' : 'outline'}
                  onClick={() => setTool('eraser')}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eraser</TooltipContent>
            </Tooltip> */}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={tool === 'pan' ? 'default' : 'outline'}
                  onClick={() => setTool('pan')}
                >
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pan</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Brush/Eraser Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Brush Settings</h4>

            <div className="space-y-2">
              <label className="text-sm">Size: {brushSize}px</label>
              <Slider
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">
                {tool === 'brush' ? 'Opacity' : 'Eraser Opacity'}: {Math.round((tool === 'brush' ? brushOpacity : eraserOpacity) * 100)}%
              </label>
              <Slider
                value={[tool === 'brush' ? brushOpacity : eraserOpacity]}
                onValueChange={(value) => tool === 'brush' ? setBrushOpacity(value[0]) : setEraserOpacity(value[0])}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">
                Hardness: {Math.round((tool === 'brush' ? brushHardness : eraserHardness) * 100)}%
              </label>
              <Slider
                value={[tool === 'brush' ? brushHardness : eraserHardness]}
                onValueChange={(value) => tool === 'brush' ? setBrushHardness(value[0]) : setEraserHardness(value[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* History */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">History</h4>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={undo}
                    disabled={historyStep <= 0}
                    className="flex-1"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={redo}
                    disabled={historyStep >= history.length - 1}
                    className="flex-1"
                  >
                    <Redo2 className="h-4 w-4 mr-2" />
                    Redo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearMask}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Mask
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Mask</TooltipContent>
            </Tooltip>
          </div>

          {/* Zoom */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">View</h4>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <span className="text-sm flex-1 text-center">{Math.round(zoom * 100)}%</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => fitToScreen()} className="w-full">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fit to Screen
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to Screen</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          <Button
            type="button"
            onClick={handleSave}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Mask
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
