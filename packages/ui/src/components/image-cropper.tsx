"use client";

import * as React from "react";
import { RotateCcwIcon, ZoomInIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Label } from "./label";
import { Slider } from "./slider";

type ImageCropperCrop = {
  x: number;
  y: number;
  zoom: number;
};

type ImageCropperSize = {
  width: number;
  height: number;
};

type ImageCropperCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageCropperShape = "rectangle" | "circle";

type ImageCropperProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  src: string;
  alt?: string;
  aspectRatio?: number;
  crop?: ImageCropperCrop;
  defaultCrop?: Partial<ImageCropperCrop>;
  disabled?: boolean;
  maxZoom?: number;
  minZoom?: number;
  onCropChange?: (crop: ImageCropperCrop) => void;
  onCropComplete?: (cropArea: ImageCropperCropArea, crop: ImageCropperCrop) => void;
  shape?: ImageCropperShape;
  showControls?: boolean;
  showGrid?: boolean;
  zoomStep?: number;
};

type CreateCroppedImageOptions = {
  background?: string;
  height?: number;
  mimeType?: string;
  quality?: number;
  shape?: ImageCropperShape;
  width?: number;
};

const DEFAULT_CROP: ImageCropperCrop = {
  x: 0,
  y: 0,
  zoom: 1,
};

function ImageCropper({
  src,
  alt = "",
  aspectRatio = 1,
  crop,
  defaultCrop,
  disabled = false,
  maxZoom = 4,
  minZoom = 1,
  onCropChange,
  onCropComplete,
  shape = "rectangle",
  showControls = true,
  showGrid = true,
  zoomStep = 0.1,
  className,
  ...props
}: ImageCropperProps) {
  const cropperId = React.useId();
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startCrop: ImageCropperCrop;
    startX: number;
    startY: number;
  } | null>(null);
  const [internalCrop, setInternalCrop] = React.useState<ImageCropperCrop>(() =>
    normalizeImageCrop({ ...DEFAULT_CROP, ...defaultCrop }, minZoom, maxZoom),
  );
  const [imageSize, setImageSize] = React.useState<ImageCropperSize | null>(null);
  const [viewportSize, setViewportSize] = React.useState<ImageCropperSize | null>(null);
  const currentCrop = crop ?? internalCrop;
  const safeAspectRatio = shape === "circle" ? 1 : Math.max(0.1, aspectRatio);
  const displayCrop = React.useMemo(
    () =>
      imageSize && viewportSize
        ? clampImageCrop(currentCrop, imageSize, viewportSize, minZoom, maxZoom)
        : normalizeImageCrop(currentCrop, minZoom, maxZoom),
    [
      currentCrop.x,
      currentCrop.y,
      currentCrop.zoom,
      imageSize,
      maxZoom,
      minZoom,
      viewportSize,
    ],
  );
  const fit = imageSize && viewportSize ? getImageCropperFit(imageSize, viewportSize) : null;
  const imageStyle: React.CSSProperties = fit
    ? {
        height: fit.height,
        transform: `translate(calc(-50% + ${displayCrop.x}px), calc(-50% + ${displayCrop.y}px)) scale(${displayCrop.zoom})`,
        width: fit.width,
      }
    : {
        height: "100%",
        transform: `translate(calc(-50% + ${displayCrop.x}px), calc(-50% + ${displayCrop.y}px)) scale(${displayCrop.zoom})`,
        width: "100%",
      };

  const updateViewportSize = React.useCallback(() => {
    const surface = surfaceRef.current;

    if (!surface) {
      return;
    }

    const rect = surface.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      setViewportSize({ width: rect.width, height: rect.height });
    }
  }, []);

  React.useEffect(() => {
    updateViewportSize();

    if (typeof ResizeObserver === "undefined" || !surfaceRef.current) {
      return;
    }

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(surfaceRef.current);

    return () => observer.disconnect();
  }, [updateViewportSize]);

  React.useEffect(() => {
    if (!imageSize || !viewportSize) {
      return;
    }

    onCropComplete?.(
      getImageCropArea(displayCrop, imageSize, viewportSize),
      displayCrop,
    );
  }, [displayCrop, imageSize, onCropComplete, viewportSize]);

  const commitCrop = (nextCrop: ImageCropperCrop) => {
    const safeCrop =
      imageSize && viewportSize
        ? clampImageCrop(nextCrop, imageSize, viewportSize, minZoom, maxZoom)
        : normalizeImageCrop(nextCrop, minZoom, maxZoom);

    setInternalCrop(safeCrop);
    onCropChange?.(safeCrop);
  };

  const moveCrop = (deltaX: number, deltaY: number) => {
    commitCrop({
      ...displayCrop,
      x: displayCrop.x + deltaX,
      y: displayCrop.y + deltaY,
    });
  };

  const setZoom = (zoom: number) => {
    commitCrop({
      ...displayCrop,
      zoom,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startCrop: displayCrop,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || disabled) {
      return;
    }

    commitCrop({
      ...drag.startCrop,
      x: drag.startCrop.x + event.clientX - drag.startX,
      y: drag.startCrop.y + event.clientY - drag.startY,
    });
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    const panStep = event.shiftKey ? 24 : 8;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCrop(-panStep, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCrop(panStep, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveCrop(0, -panStep);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveCrop(0, panStep);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoom(displayCrop.zoom + zoomStep);
    } else if (event.key === "-") {
      event.preventDefault();
      setZoom(displayCrop.zoom - zoomStep);
    } else if (event.key === "Home") {
      event.preventDefault();
      commitCrop(DEFAULT_CROP);
    }
  };

  return (
    <div
      data-slot="image-cropper"
      data-shape={shape}
      className={cn("grid gap-3", className)}
      {...props}
    >
      <div
        ref={surfaceRef}
        data-slot="image-cropper-surface"
        aria-label="Crop image"
        aria-disabled={disabled ? true : undefined}
        role="application"
        tabIndex={disabled ? undefined : 0}
        className={cn(
          "relative w-full touch-none overflow-hidden rounded-md border bg-muted/30 outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-grab active:cursor-grabbing",
          shape === "circle" && "rounded-full",
        )}
        style={{ aspectRatio: safeAspectRatio }}
        onKeyDown={handleKeyDown}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <img
          data-slot="image-cropper-image"
          alt={alt}
          draggable={false}
          src={src}
          className="absolute top-1/2 left-1/2 max-w-none object-cover will-change-transform"
          style={imageStyle}
          onLoad={(event) => {
            setImageSize({
              height: event.currentTarget.naturalHeight,
              width: event.currentTarget.naturalWidth,
            });
            updateViewportSize();
          }}
        />
        {showGrid ? <ImageCropperGrid /> : null}
        <div
          data-slot="image-cropper-mask"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border border-white/80 ring-1 ring-black/20",
            shape === "circle" ? "rounded-full" : "rounded-md",
          )}
        />
      </div>
      {showControls ? (
        <div
          data-slot="image-cropper-controls"
          className="grid items-center gap-2 sm:grid-cols-[auto_minmax(10rem,1fr)_auto]"
        >
          <Label htmlFor={cropperId} className="text-muted-foreground">
            <ZoomInIcon aria-hidden="true" className="size-4" />
            Zoom
          </Label>
          <Slider
            id={cropperId}
            disabled={disabled}
            min={minZoom}
            max={maxZoom}
            step={zoomStep}
            thumbAriaLabel="Crop zoom"
            value={[displayCrop.zoom]}
            onValueChange={(value) => setZoom(value[0] ?? minZoom)}
          />
          <Button
            aria-label="Reset crop"
            disabled={disabled}
            size="icon-sm"
            type="button"
            variant="outline"
            onClick={() => commitCrop(DEFAULT_CROP)}
          >
            <RotateCcwIcon aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ImageCropperGrid() {
  return (
    <div
      data-slot="image-cropper-grid"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <div className="absolute inset-y-0 left-1/3 border-l border-white/55" />
      <div className="absolute inset-y-0 left-2/3 border-l border-white/55" />
      <div className="absolute top-1/3 inset-x-0 border-t border-white/55" />
      <div className="absolute top-2/3 inset-x-0 border-t border-white/55" />
    </div>
  );
}

function normalizeImageCrop(
  crop: Partial<ImageCropperCrop> | undefined,
  minZoom = 1,
  maxZoom = 4,
): ImageCropperCrop {
  return {
    x: Number.isFinite(crop?.x) ? Number(crop?.x) : 0,
    y: Number.isFinite(crop?.y) ? Number(crop?.y) : 0,
    zoom: clamp(Number.isFinite(crop?.zoom) ? Number(crop?.zoom) : minZoom, minZoom, maxZoom),
  };
}

function clampImageCrop(
  crop: Partial<ImageCropperCrop>,
  imageSize: ImageCropperSize,
  viewportSize: ImageCropperSize,
  minZoom = 1,
  maxZoom = 4,
) {
  const normalizedCrop = normalizeImageCrop(crop, minZoom, maxZoom);
  const fit = getImageCropperFit(imageSize, viewportSize);
  const renderedWidth = fit.width * normalizedCrop.zoom;
  const renderedHeight = fit.height * normalizedCrop.zoom;
  const maxX = Math.max(0, (renderedWidth - viewportSize.width) / 2);
  const maxY = Math.max(0, (renderedHeight - viewportSize.height) / 2);

  return {
    x: clamp(normalizedCrop.x, -maxX, maxX),
    y: clamp(normalizedCrop.y, -maxY, maxY),
    zoom: normalizedCrop.zoom,
  };
}

function getImageCropArea(
  crop: Partial<ImageCropperCrop>,
  imageSize: ImageCropperSize,
  viewportSize: ImageCropperSize,
): ImageCropperCropArea {
  const normalizedCrop = normalizeImageCrop(crop);
  const fit = getImageCropperFit(imageSize, viewportSize);
  const scale = fit.scale * normalizedCrop.zoom;
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;
  const sourceX = ((renderedWidth - viewportSize.width) / 2 - normalizedCrop.x) / scale;
  const sourceY = ((renderedHeight - viewportSize.height) / 2 - normalizedCrop.y) / scale;
  const sourceWidth = viewportSize.width / scale;
  const sourceHeight = viewportSize.height / scale;
  const x = clamp(sourceX, 0, imageSize.width);
  const y = clamp(sourceY, 0, imageSize.height);

  return {
    height: Math.round(Math.min(sourceHeight, imageSize.height - y)),
    width: Math.round(Math.min(sourceWidth, imageSize.width - x)),
    x: Math.round(x),
    y: Math.round(y),
  };
}

function getImageCropperFit(imageSize: ImageCropperSize, viewportSize: ImageCropperSize) {
  const scale = Math.max(
    viewportSize.width / imageSize.width,
    viewportSize.height / imageSize.height,
  );

  return {
    height: imageSize.height * scale,
    scale,
    width: imageSize.width * scale,
  };
}

function createCroppedImageBlob(
  image: CanvasImageSource,
  cropArea: ImageCropperCropArea,
  {
    background,
    height = cropArea.height,
    mimeType = "image/png",
    quality,
    shape = "rectangle",
    width = cropArea.width,
  }: CreateCroppedImageOptions = {},
) {
  const canvas = renderCroppedImageToCanvas(image, cropArea, {
    background,
    height,
    shape,
    width,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to create cropped image blob."));
        }
      },
      mimeType,
      quality,
    );
  });
}

function createCroppedImageDataUrl(
  image: CanvasImageSource,
  cropArea: ImageCropperCropArea,
  {
    background,
    height = cropArea.height,
    mimeType = "image/png",
    quality,
    shape = "rectangle",
    width = cropArea.width,
  }: CreateCroppedImageOptions = {},
) {
  const canvas = renderCroppedImageToCanvas(image, cropArea, {
    background,
    height,
    shape,
    width,
  });

  return canvas.toDataURL(mimeType, quality);
}

function renderCroppedImageToCanvas(
  image: CanvasImageSource,
  cropArea: ImageCropperCropArea,
  {
    background,
    height,
    shape,
    width,
  }: Pick<CreateCroppedImageOptions, "background" | "height" | "shape" | "width">,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create a 2D canvas context.");
  }

  canvas.width = Math.max(1, Math.round(width ?? cropArea.width));
  canvas.height = Math.max(1, Math.round(height ?? cropArea.height));

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (shape === "circle") {
    context.save();
    context.beginPath();
    context.arc(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) / 2,
      0,
      Math.PI * 2,
    );
    context.clip();
  }

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if (shape === "circle") {
    context.restore();
  }

  return canvas;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export {
  ImageCropper,
  clampImageCrop,
  createCroppedImageBlob,
  createCroppedImageDataUrl,
  getImageCropArea,
  type CreateCroppedImageOptions,
  type ImageCropperCrop,
  type ImageCropperCropArea,
  type ImageCropperProps,
  type ImageCropperShape,
  type ImageCropperSize,
};
