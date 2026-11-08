"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { CameraIcon } from "./icons";

async function readSignature(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const maxDimension = 900;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.width, image.height),
  );

  if (scale === 1 && dataUrl.length < 400_000) {
    return dataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85);
}

type SignatureBlockProps = {
  role: string;
  name: string;
  placeholder: string;
};

function SignatureBlock({ role, name, placeholder }: SignatureBlockProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = fieldRef.current?.closest("form");
    if (!form) {
      return;
    }

    const handleReset = () => setSignature(null);
    form.addEventListener("reset", handleReset);

    return () => form.removeEventListener("reset", handleReset);
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setBusy(true);

    try {
      setSignature(await readSignature(file));
    } catch {
      setSignature(null);
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
        placeholder={placeholder}
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
            aria-label={`Take a photo of the ${role} signature`}
          />
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime camera capture as a data URL
            <img
              className="signature-image"
              src={signature}
              alt={`${role} signature`}
            />
          ) : (
            <span className="signature-placeholder">
              <CameraIcon />
              {busy ? "Processing…" : "Take signature photo"}
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
            <input
              className="company-name"
              type="text"
              name="companyName"
              defaultValue="S&N Automotive Engineering Ltd"
              aria-label="Service company name"
              autoComplete="off"
            />
            <input
              className="company-tagline"
              type="text"
              name="companyTagline"
              placeholder="UPS & Inverter Sales · Installation · Maintenance · AMC"
              aria-label="Company services"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="company-contact">
          <label className="contact-line">
            <span>Phone</span>
            <input
              type="tel"
              name="companyPhone"
              defaultValue="+256-779 210 376"
              autoComplete="off"
            />
          </label>
          <label className="contact-line">
            <span>Email</span>
            <input
              type="email"
              name="companyEmail"
              defaultValue="snauto.ltd@gmail.com"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="sign-grid">
        <SignatureBlock
          role="Serviced by"
          name="servicedByName"
          placeholder="Name / designation"
        />
        <SignatureBlock
          role="Confirmed by"
          name="confirmedByName"
          placeholder="Name / designation"
        />
        <SignatureBlock
          role="Customer acknowledgement"
          name="customerName"
          placeholder="Customer name"
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
