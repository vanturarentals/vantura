"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import { completeBookingStep } from "@/lib/booking-progress";
import { useBookingStepGuard } from "@/lib/use-booking-step-guard";
import type { BookingDraft } from "@/lib/booking-draft";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB before compression
const TARGET_MAX_EDGE = 1600;
const JPEG_QUALITY = 0.72;

async function fileToCompressedDataUrl(file: File): Promise<{
  dataUrl: string;
  name: string;
}> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image (JPG, PNG, HEIC, or WebP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Each photo must be under 4MB.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, TARGET_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base = file.name.replace(/\.[^.]+$/, "") || "licence";
  return { dataUrl, name: `${base}.jpg` };
}

export default function LicencePage() {
  const { vanId } = useParams<{ vanId: string }>();
  const draft = useBookingDraft(vanId);
  useBookingStepGuard(vanId, "licence");

  if (!draft) {
    return (
      <p className="text-muted">
        Missing booking details.{" "}
        <Link href="/" className="text-brand underline">
          Start again
        </Link>
      </p>
    );
  }

  if (!draft.driver.firstName || !draft.driver.email) {
    return (
      <p className="text-muted">
        Please complete driver details first.{" "}
        <Link href={`/book/${vanId}/driver`} className="text-brand underline">
          Go to driver details
        </Link>
      </p>
    );
  }

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <LicenceForm draft={draft} />
    </div>
  );
}

function LicenceForm({ draft }: { draft: BookingDraft }) {
  const router = useRouter();
  const [front, setFront] = useState(draft.licence?.frontDataUrl ?? "");
  const [frontName, setFrontName] = useState(draft.licence?.frontName ?? "");
  const [back, setBack] = useState(draft.licence?.backDataUrl ?? "");
  const [backName, setBackName] = useState(draft.licence?.backName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"front" | "back" | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  async function onPick(side: "front" | "back", file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(side);
    try {
      const { dataUrl, name } = await fileToCompressedDataUrl(file);
      if (side === "front") {
        setFront(dataUrl);
        setFrontName(name);
      } else {
        setBack(dataUrl);
        setBackName(name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    } finally {
      setBusy(null);
    }
  }

  function onContinue() {
    setError(null);
    if (!front || !back) {
      setError("Please upload both the front and back of your driving licence.");
      return;
    }
    writeDraft(
      completeBookingStep(
        {
          ...draft,
          licence: {
            frontDataUrl: front,
            frontName: frontName || "licence-front.jpg",
            backDataUrl: back,
            backName: backName || "licence-back.jpg",
          },
        },
        3,
      ),
    );
    router.push(`/book/${draft.vanId}/review`);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div className="panel space-y-4 p-6">
        <h1 className="text-2xl font-bold text-brand">Driving licence</h1>
        <p className="text-sm text-muted">
          Upload a clear photo of the front and back of your UK driving licence.
          Make sure all details are readable.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UploadCard
            label="Front of licence"
            preview={front}
            busy={busy === "front"}
            inputRef={frontRef}
            onChange={(file) => onPick("front", file)}
            onClear={() => {
              setFront("");
              setFrontName("");
              if (frontRef.current) frontRef.current.value = "";
            }}
          />
          <UploadCard
            label="Back of licence"
            preview={back}
            busy={busy === "back"}
            inputRef={backRef}
            onChange={(file) => onPick("back", file)}
            onClear={() => {
              setBack("");
              setBackName("");
              if (backRef.current) backRef.current.value = "";
            }}
          />
        </div>

        <p className="flex items-center gap-2 text-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Your documents are secure and encrypted.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/book/${draft.vanId}/driver`)}
            className="btn-ghost px-0"
          >
            ← Back
          </button>
          <button type="button" onClick={onContinue} className="btn-primary">
            Continue
          </button>
        </div>
      </div>

      <BookingSummary draft={draft} />
    </div>
  );
}

function UploadCard({
  label,
  preview,
  busy,
  inputRef,
  onChange,
  onClear,
}: {
  label: string;
  preview: string;
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <span className="field-label">{label}</span>
      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center transition-colors hover:border-brand">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="max-h-44 w-full rounded object-contain"
          />
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted" aria-hidden>
              <path d="M12 16V8M8 12l4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="text-sm font-medium text-foreground">
              {busy ? "Processing…" : `Upload ${label.toLowerCase()} or drag and drop`}
            </span>
            <span className="text-xs text-muted">JPG, PNG or WebP</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={busy}
          onChange={(e) => onChange(e.target.files?.[0])}
        />
      </label>
      {preview && (
        <button type="button" onClick={onClear} className="btn-ghost px-0 text-xs">
          Remove
        </button>
      )}
    </div>
  );
}
