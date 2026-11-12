"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";

import { CameraIcon } from "./icons";

const CROP_MIN = 0.035;
const DEFAULT_CROP: CropRect = {
  x: 0.08,
  y: 0.32,
  width: 0.84,
  height: 0.36,
};
const SIGNATURE_MAX_DIMENSION = 900;

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type Corner = "nw" | "ne" | "sw" | "se";

type DragState =
  | { mode: "create"; start: Point }
  | { mode: "move"; origin: CropRect; start: Point }
  | { mode: "resize"; corner: Corner; origin: CropRect };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = src;
  });
}

async function preparePhoto(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await loadImage(dataUrl);
  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

  if (scale === 1 && dataUrl.length < 1_500_000) {
    return dataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.9);
}

async function cropSignature(src: string, crop: CropRect): Promise<string> {
  const image = await loadImage(src);
  const sourceX = clamp(
    Math.round(crop.x * image.naturalWidth),
    0,
    Math.max(0, image.naturalWidth - 1),
  );
  const sourceY = clamp(
    Math.round(crop.y * image.naturalHeight),
    0,
    Math.max(0, image.naturalHeight - 1),
  );
  const sourceWidth = clamp(
    Math.round(crop.width * image.naturalWidth),
    1,
    image.naturalWidth - sourceX,
  );
  const sourceHeight = clamp(
    Math.round(crop.height * image.naturalHeight),
    1,
    image.naturalHeight - sourceY,
  );

  const scale = Math.min(
    1,
    SIGNATURE_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas unavailable");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Finds the dark pixels in the captured photo so the crop box starts around
 * the signature instead of the full frame. Users can still adjust it.
 */
function detectInkBox(image: HTMLImageElement): CropRect | null {
  const maxDimension = 420;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, width, height);

  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }

  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let ink = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (pixels[offset + 3] < 40) {
        continue;
      }

      const luma =
        pixels[offset] * 0.299 +
        pixels[offset + 1] * 0.587 +
        pixels[offset + 2] * 0.114;

      if (luma > 165) {
        continue;
      }

      ink += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (ink < width * height * 0.002 || right < left || bottom < top) {
    return null;
  }

  const boxWidth = right - left + 1;
  const boxHeight = bottom - top + 1;
  const padX = boxWidth * 0.08 + width * 0.015;
  const padY = boxHeight * 0.15 + height * 0.015;

  const x0 = clamp((left - padX) / width, 0, 1);
  const y0 = clamp((top - padY) / height, 0, 1);
  const x1 = clamp((right + padX) / width, 0, 1);
  const y1 = clamp((bottom + padY) / height, 0, 1);

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
  };
}

function rectFromDrag(state: DragState, point: Point): CropRect {
  if (state.mode === "create") {
    return {
      x: Math.min(state.start.x, point.x),
      y: Math.min(state.start.y, point.y),
      width: Math.abs(point.x - state.start.x),
      height: Math.abs(point.y - state.start.y),
    };
  }

  if (state.mode === "move") {
    const { origin } = state;
    return {
      x: clamp(origin.x + point.x - state.start.x, 0, 1 - origin.width),
      y: clamp(origin.y + point.y - state.start.y, 0, 1 - origin.height),
      width: origin.width,
      height: origin.height,
    };
  }

  const { origin, corner } = state;
  let left = origin.x;
  let top = origin.y;
  let right = origin.x + origin.width;
  let bottom = origin.y + origin.height;

  if (corner === "nw" || corner === "sw") {
    left = Math.min(point.x, right - CROP_MIN);
  }
  if (corner === "ne" || corner === "se") {
    right = Math.max(point.x, left + CROP_MIN);
  }
  if (corner === "nw" || corner === "ne") {
    top = Math.min(point.y, bottom - CROP_MIN);
  }
  if (corner === "sw" || corner === "se") {
    bottom = Math.max(point.y, top + CROP_MIN);
  }

  left = clamp(left, 0, 1);
  top = clamp(top, 0, 1);
  right = clamp(right, 0, 1);
  bottom = clamp(bottom, 0, 1);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

type SignatureCropperProps = {
  src: string;
  role: string;
  onCancel: () => void;
  onConfirm: (signature: string) => void;
};

function SignatureCropper({
  src,
  role,
  onCancel,
  onConfirm,
}: SignatureCropperProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  function pointFromEvent(event: { clientX: number; clientY: number }) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }

    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }

  function beginDrag(
    event: ReactPointerEvent<HTMLElement>,
    mode: { type: "create" } | { type: "move" } | { type: "resize"; corner: Corner },
  ) {
    if (event.button !== 0 || working) {
      return;
    }

    const point = pointFromEvent(event);
    if (!point) {
      return;
    }

    const snapshot = crop;
    let state: DragState;

    if (mode.type === "create") {
      state = { mode: "create", start: point };
    } else if (mode.type === "move") {
      if (!snapshot) {
        return;
      }
      state = { mode: "move", origin: snapshot, start: point };
    } else {
      if (!snapshot) {
        return;
      }
      state = { mode: "resize", corner: mode.corner, origin: snapshot };
    }

    event.preventDefault();
    event.stopPropagation();

    const handleMove = (moveEvent: PointerEvent) => {
      const next = pointFromEvent(moveEvent);
      if (!next) {
        return;
      }
      setCrop(rectFromDrag(state, next));
    };

    const stop = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    // Read the element synchronously: React clears `currentTarget` once the
    // event handler returns, and the state updater below runs later.
    const image = event.currentTarget;

    let detected: CropRect | null = null;
    try {
      detected = detectInkBox(image);
    } catch {
      detected = null;
    }

    setError(null);
    setLoaded(true);
    setCrop((current) => current ?? detected ?? DEFAULT_CROP);
  }

  function handleImageError() {
    setError(
      "That photo could not be loaded. Cancel and try taking another one.",
    );
  }

  async function confirmCrop() {
    if (
      !crop ||
      crop.width < CROP_MIN ||
      crop.height < CROP_MIN ||
      working
    ) {
      return;
    }

    setWorking(true);

    try {
      onConfirm(await cropSignature(src, crop));
    } catch {
      setError("The signature could not be cropped. Please try again.");
      setWorking(false);
    }
  }

  const canConfirm =
    loaded &&
    !working &&
    crop !== null &&
    crop.width >= CROP_MIN &&
    crop.height >= CROP_MIN;

  return (
    <div
      className="crop-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="crop-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Crop the ${role} signature`}
      >
        <div className="crop-head">
          <h2 className="crop-title">Scan signature</h2>
          <p className="crop-hint">
            Drag over the photo to frame the signature, then fine-tune the
            corners. Only the highlighted area is kept.
          </p>
          {error ? (
            <p className="crop-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="crop-viewport">
          <div
            className="crop-canvas"
            ref={canvasRef}
            onPointerDown={(event) => beginDrag(event, { type: "create" })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- captured photo shown before cropping */}
            <img
              className="crop-image"
              src={src}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {crop ? (
              <div
                className="crop-box"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
                onPointerDown={(event) => beginDrag(event, { type: "move" })}
              >
                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <span
                    key={corner}
                    className={`crop-handle crop-handle-${corner}`}
                    onPointerDown={(event) =>
                      beginDrag(event, { type: "resize", corner })
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="crop-actions">
          <button
            type="button"
            className="crop-button"
            onClick={onCancel}
            disabled={working}
          >
            Cancel
          </button>
          <button
            type="button"
            className="crop-button crop-button-primary"
            onClick={confirmCrop}
            disabled={!canConfirm}
          >
            {working ? "Cropping…" : "Use selection"}
          </button>
        </div>
      </div>
    </div>
  );
}

type SignatureBlockProps = {
  role: string;
  name: string;
};

function SignatureBlock({ role, name }: SignatureBlockProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = fieldRef.current?.closest("form");
    if (!form) {
      return;
    }

    const handleReset = () => {
      setSignature(null);
      setDraft(null);
      setError(null);
    };
    form.addEventListener("reset", handleReset);

    return () => form.removeEventListener("reset", handleReset);
  }, []);

  const closeCropper = useCallback(() => setDraft(null), []);
  const applyCrop = useCallback((next: string) => {
    setSignature(next);
    setDraft(null);
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setDraft(await preparePhoto(file));
    } catch {
      setDraft(null);
      setError("That photo could not be opened. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sign-block">
      <span className="sign-role">{role}</span>
      <input
        className="sign-name"
        type="text"
        name={name}
        aria-label={`${role} name`}
        autoComplete="off"
      />
      <div className="signature-field" ref={fieldRef}>
        <label className="sign-space">
          <input
            className="signature-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            aria-label={`Scan the ${role} signature`}
          />
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element -- cropped signature stored as a data URL
            <img
              className="signature-image"
              src={signature}
              alt={`${role} signature`}
            />
          ) : (
            <span className="signature-placeholder">
              <CameraIcon />
              {busy ? "Preparing…" : "Scan signature"}
            </span>
          )}
        </label>
        {signature ? (
          <button
            type="button"
            className="signature-remove"
            onClick={() => setSignature(null)}
            aria-label={`Remove ${role} signature`}
            title="Remove signature"
          >
            ×
          </button>
        ) : null}
        {draft ? (
          <SignatureCropper
            key={draft}
            src={draft}
            role={role}
            onCancel={closeCropper}
            onConfirm={applyCrop}
          />
        ) : null}
        {error ? (
          <p className="signature-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="sign-caption">
        <span>Signature</span>
        <span>Date</span>
      </div>
    </div>
  );
}

export function ServiceCompanyFooter() {
  return (
    <footer className="doc-footer">
      <div className="company-band">
        <div className="company-main">
          <span className="company-logo" aria-hidden="true">
            LOGO
          </span>
          <div className="company-name-wrap">
            <span className="company-eyebrow">Service provider</span>
            <span className="company-name">
              S&amp;N Automotive Engineering Ltd
            </span>
            <input
              className="company-tagline"
              type="text"
              name="companyTagline"
              aria-label="Company services"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="company-contact">
          <div className="contact-line">
            <span>Phone</span>
            <span className="contact-value">+256-779 210 376</span>
          </div>
          <div className="contact-line">
            <span>Email</span>
            <span className="contact-value">snauto.ltd@gmail.com</span>
          </div>
        </div>
      </div>

      <div className="sign-grid">
        <SignatureBlock role="Serviced by" name="servicedByName" />
        <SignatureBlock role="Confirmed by" name="confirmedByName" />
        <SignatureBlock
          role="Customer acknowledgement"
          name="customerName"
        />
      </div>

      <div className="footer-note">
        <span>
          Customer acknowledgement: the service described above has been
          completed and verified.
        </span>
        <span className="form-code">Form JC-UPS-01 · Rev. 1.0</span>
      </div>
    </footer>
  );
}
