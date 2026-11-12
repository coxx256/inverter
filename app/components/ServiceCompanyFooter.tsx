"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { CameraIcon } from "./icons";

const SIGNATURE_MAX_DIMENSION = 900;
const WORK_MAX_DIMENSION = 1400;

// Area of the live camera preview used for the signature. Values are
// fractions of the preview frame.
const LIVE_GUIDE = {
  x: 0.05,
  y: 0.32,
  width: 0.9,
  height: 0.36,
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = src;
  });
}

/**
 * Returns the tight box around the dark ink in a canvas, as fractions of the
 * canvas. Used to remove the surrounding paper/background from a scan.
 */
function detectInkBounds(canvas: HTMLCanvasElement): Rect | null {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !canvas.width || !canvas.height) {
    return null;
  }

  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return null;
  }

  // Otsu's method picks a threshold that adapts to the lighting, so the ink
  // is separated from the paper even in a dim or grey photo.
  const histogram = new Uint32Array(256);
  let samples = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 40) {
      continue;
    }
    const luma = Math.round(
      pixels[index] * 0.299 +
        pixels[index + 1] * 0.587 +
        pixels[index + 2] * 0.114,
    );
    histogram[luma] += 1;
    samples += 1;
  }

  let threshold = 150;
  if (samples > 0) {
    let sum = 0;
    for (let value = 0; value < 256; value += 1) {
      sum += value * histogram[value];
    }

    let sumBackground = 0;
    let weightBackground = 0;
    let bestVariance = 0;

    for (let value = 0; value < 256; value += 1) {
      weightBackground += histogram[value];
      if (!weightBackground) {
        continue;
      }

      const weightForeground = samples - weightBackground;
      if (!weightForeground) {
        break;
      }

      sumBackground += value * histogram[value];
      const meanBackground = sumBackground / weightBackground;
      const meanForeground = (sum - sumBackground) / weightForeground;
      const variance =
        weightBackground *
        weightForeground *
        (meanBackground - meanForeground) *
        (meanBackground - meanForeground);

      if (variance > bestVariance) {
        bestVariance = variance;
        threshold = value;
      }
    }

    threshold = clamp(threshold, 40, 200);
  }

  let left = canvas.width;
  let top = canvas.height;
  let right = -1;
  let bottom = -1;
  let ink = 0;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      if (pixels[offset + 3] < 40) {
        continue;
      }

      const luma =
        pixels[offset] * 0.299 +
        pixels[offset + 1] * 0.587 +
        pixels[offset + 2] * 0.114;

      if (luma > threshold) {
        continue;
      }

      ink += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (
    ink < Math.max(20, canvas.width * canvas.height * 0.0005) ||
    right < left ||
    bottom < top
  ) {
    return null;
  }

  const boxWidth = right - left + 1;
  const boxHeight = bottom - top + 1;
  const padX = Math.max(4, boxWidth * 0.06);
  const padY = Math.max(4, boxHeight * 0.12);

  const x0 = clamp(left - padX, 0, canvas.width);
  const y0 = clamp(top - padY, 0, canvas.height);
  const x1 = clamp(right + padX, 0, canvas.width);
  const y1 = clamp(bottom + padY, 0, canvas.height);

  return {
    x: x0 / canvas.width,
    y: y0 / canvas.height,
    width: (x1 - x0) / canvas.width,
    height: (y1 - y0) / canvas.height,
  };
}

/**
 * Turns the ink into a clean dark-on-white image so the result looks like a
 * scanned signature rather than a photo of a piece of paper.
 */
function enhanceScan(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  let imageData: ImageData;
  try {
    imageData = context.getImageData(0, 0, width, height);
  } catch {
    return;
  }

  const data = imageData.data;
  const histogram = new Uint32Array(256);
  let total = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luma = Math.round(
      data[index] * 0.299 +
        data[index + 1] * 0.587 +
        data[index + 2] * 0.114,
    );
    histogram[luma] += 1;
    total += 1;
  }

  if (!total) {
    return;
  }

  const percentile = (fraction: number) => {
    const target = total * fraction;
    let running = 0;
    for (let value = 0; value < 256; value += 1) {
      running += histogram[value];
      if (running >= target) {
        return value;
      }
    }
    return 255;
  };

  // Adapt the levels to the lighting/paper so the background becomes white
  // even when the photo is dim or slightly grey.
  const blackPoint = clamp(percentile(0.02), 20, 110);
  const whitePoint = clamp(percentile(0.75), blackPoint + 45, 235);

  for (let index = 0; index < data.length; index += 4) {
    const luma =
      data[index] * 0.299 +
      data[index + 1] * 0.587 +
      data[index + 2] * 0.114;
    const t = clamp(
      (luma - blackPoint) / (whitePoint - blackPoint),
      0,
      1,
    );
    const smooth = t * t * (3 - 2 * t);
    const value = Math.round(smooth * 255);

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

function scanSignature(
  source: CanvasImageSource,
  sourceRect: Rect,
): string {
  const sourceX = Math.max(0, Math.round(sourceRect.x));
  const sourceY = Math.max(0, Math.round(sourceRect.y));
  const sourceWidth = Math.max(1, Math.round(sourceRect.width));
  const sourceHeight = Math.max(1, Math.round(sourceRect.height));

  const workScale = Math.min(
    1,
    WORK_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );
  const work = document.createElement("canvas");
  work.width = Math.max(1, Math.round(sourceWidth * workScale));
  work.height = Math.max(1, Math.round(sourceHeight * workScale));

  const workContext = work.getContext("2d", { willReadFrequently: true });
  if (!workContext) {
    throw new Error("Canvas unavailable");
  }

  workContext.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    work.width,
    work.height,
  );

  const ink = detectInkBounds(work);
  const box: Rect = ink ?? { x: 0.02, y: 0.02, width: 0.96, height: 0.96 };

  const cropX = clamp(Math.round(box.x * work.width), 0, work.width - 1);
  const cropY = clamp(Math.round(box.y * work.height), 0, work.height - 1);
  const cropWidth = clamp(
    Math.round(box.width * work.width),
    1,
    work.width - cropX,
  );
  const cropHeight = clamp(
    Math.round(box.height * work.height),
    1,
    work.height - cropY,
  );

  const outputScale = Math.min(
    1,
    SIGNATURE_MAX_DIMENSION / Math.max(cropWidth, cropHeight),
  );
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(cropWidth * outputScale));
  output.height = Math.max(1, Math.round(cropHeight * outputScale));

  const outputContext = output.getContext("2d", {
    willReadFrequently: true,
  });
  if (!outputContext) {
    throw new Error("Canvas unavailable");
  }

  outputContext.fillStyle = "#ffffff";
  outputContext.fillRect(0, 0, output.width, output.height);
  outputContext.imageSmoothingQuality = "high";
  outputContext.drawImage(
    work,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    output.width,
    output.height,
  );

  enhanceScan(outputContext, output.width, output.height);

  return output.toDataURL("image/png");
}

/**
 * Maps the on-screen guide to pixels in the video. The video is displayed with
 * `object-fit: cover`, so the source is scaled and centred inside the frame.
 */
function guideToSourceRect(
  video: HTMLVideoElement,
  frame: HTMLElement,
  guide: Rect,
): Rect {
  const videoWidth = video.videoWidth || 1;
  const videoHeight = video.videoHeight || 1;
  const viewport = frame.getBoundingClientRect();
  const scale = Math.max(
    viewport.width / videoWidth,
    viewport.height / videoHeight,
    0.0001,
  );
  const offsetX = (viewport.width - videoWidth * scale) / 2;
  const offsetY = (viewport.height - videoHeight * scale) / 2;

  const x = (guide.x * viewport.width - offsetX) / scale;
  const y = (guide.y * viewport.height - offsetY) / scale;
  const width = (guide.width * viewport.width) / scale;
  const height = (guide.height * viewport.height) / scale;

  const sourceX = clamp(x, 0, videoWidth - 1);
  const sourceY = clamp(y, 0, videoHeight - 1);

  return {
    x: sourceX,
    y: sourceY,
    width: clamp(width, 1, videoWidth - sourceX),
    height: clamp(height, 1, videoHeight - sourceY),
  };
}

function cameraErrorMessage(error: unknown): string {
  const name =
    typeof DOMException !== "undefined" && error instanceof DOMException
      ? error.name
      : "";

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow camera permission in your browser, or upload a photo instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. You can upload a photo instead.";
    case "NotReadableError":
    case "AbortError":
      return "The camera is busy or unavailable. Close other apps using it, then try again.";
    default:
      return "The camera could not be started. You can upload a photo instead.";
  }
}

type ScannerStatus = "starting" | "ready" | "error";

type SignatureScannerProps = {
  role: string;
  onCancel: () => void;
  onConfirm: (signature: string) => void;
};

function SignatureScanner({
  role,
  onCancel,
  onConfirm,
}: SignatureScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ScannerStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

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

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      const media = navigator.mediaDevices;
      if (!media?.getUserMedia) {
        if (!cancelled) {
          setStatus("error");
          setError(
            "Camera scanning needs a secure HTTPS connection. You can upload a photo instead.",
          );
        }
        return;
      }

      try {
        const stream = await media.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled || previewRef.current) {
          stopStream(stream);
          return;
        }

        stopStream(streamRef.current);
        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            // Muted autoplay is normally allowed; keep going even if it is not.
          }
        }

        if (cancelled || previewRef.current) {
          stopStream(stream);
          return;
        }

        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(cameraErrorMessage(err));
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [restartKey]);

  function handleCapture() {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError("The camera is still starting. Please wait a moment and try again.");
      return;
    }

    setError(null);

    try {
      const scanned = scanSignature(
        video,
        guideToSourceRect(video, frame, LIVE_GUIDE),
      );
      stopStream(streamRef.current);
      streamRef.current = null;
      video.srcObject = null;
      previewRef.current = true;
      setPreview(scanned);
    } catch {
      setError("The signature could not be scanned. Please try again.");
    }
  }

  function handleRetake() {
    previewRef.current = false;
    setStatus("starting");
    setError(null);
    setPreview(null);
    setRestartKey((key) => key + 1);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImage(dataUrl);
      const scanned = scanSignature(image, {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });

      stopStream(streamRef.current);
      streamRef.current = null;
      previewRef.current = true;
      setPreview(scanned);
    } catch {
      setError("That photo could not be scanned. Please try another one.");
    } finally {
      setProcessing(false);
    }
  }

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
        className="crop-panel scanner-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Scan the ${role} signature`}
      >
        <div className="crop-head">
          <h2 className="crop-title">
            {preview ? "Signature scanned" : "Scan signature"}
          </h2>
          <p className="crop-hint">
            {preview
              ? "Check the scanned signature. Retake it if it is unclear."
              : "Fit the signature inside the frame and hold the paper steady, then tap Capture."}
          </p>
          {error ? (
            <p className="crop-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {preview ? (
          <div className="scan-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- scanned signature stored as a data URL */}
            <img src={preview} alt={`Scanned ${role} signature`} />
          </div>
        ) : (
          <div className="scanner-viewport">
            <div className="scanner-frame" ref={frameRef}>
              <video
                ref={videoRef}
                className="scanner-video"
                autoPlay
                muted
                playsInline
              />
              {status === "ready" ? (
                <div
                  className="scanner-guide"
                  style={{
                    left: `${LIVE_GUIDE.x * 100}%`,
                    top: `${LIVE_GUIDE.y * 100}%`,
                    width: `${LIVE_GUIDE.width * 100}%`,
                    height: `${LIVE_GUIDE.height * 100}%`,
                  }}
                >
                  <span className="scanner-scanline" />
                  <span className="scanner-guide-label">Signature area</span>
                </div>
              ) : null}
              {status === "starting" ? (
                <div className="scanner-status">Starting camera…</div>
              ) : null}
              {status === "error" ? (
                <div className="scanner-status">Camera unavailable</div>
              ) : null}
            </div>
          </div>
        )}

        <div className="crop-actions">
          <button type="button" className="crop-button" onClick={onCancel}>
            Cancel
          </button>

          {preview ? (
            <>
              <button
                type="button"
                className="crop-button"
                onClick={handleRetake}
              >
                Retake
              </button>
              <button
                type="button"
                className="crop-button crop-button-primary"
                onClick={() => onConfirm(preview)}
              >
                Use signature
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`crop-button${status !== "ready" ? " crop-button-primary" : ""}`}
                onClick={() => fileRef.current?.click()}
                disabled={processing}
              >
                {processing ? "Scanning…" : "Upload photo"}
              </button>
              <button
                type="button"
                className={`crop-button${status === "ready" ? " crop-button-primary" : ""}`}
                onClick={handleCapture}
                disabled={status !== "ready" || processing}
              >
                Capture
              </button>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          className="scanner-file"
          type="file"
          accept="image/*"
          onChange={handleFile}
          aria-label={`Upload a photo of the ${role} signature`}
        />
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
  const [scanning, setScanning] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = fieldRef.current?.closest("form");
    if (!form) {
      return;
    }

    const handleReset = () => {
      setSignature(null);
      setScanning(false);
    };
    form.addEventListener("reset", handleReset);

    return () => form.removeEventListener("reset", handleReset);
  }, []);

  const closeScanner = useCallback(() => setScanning(false), []);
  const applySignature = useCallback((next: string) => {
    setSignature(next);
    setScanning(false);
  }, []);

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
        <button
          type="button"
          className="sign-space"
          onClick={() => setScanning(true)}
          aria-label={
            signature
              ? `Scan a new ${role} signature`
              : `Scan the ${role} signature`
          }
        >
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element -- scanned signature stored as a data URL
            <img
              className="signature-image"
              src={signature}
              alt={`${role} signature`}
            />
          ) : (
            <span className="signature-placeholder">
              <CameraIcon />
              Scan signature
            </span>
          )}
        </button>
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
        {scanning ? (
          <SignatureScanner
            role={role}
            onCancel={closeScanner}
            onConfirm={applySignature}
          />
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
