"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_SUBJECTS } from "@/lib/contact";

interface Props {
  lockedEmail?: string | null;
  defaultName?: string | null;
}

export default function ContactForm({ lockedEmail, defaultName }: Props) {
  const emailLocked = Boolean(lockedEmail);
  const [email, setEmail] = useState(lockedEmail ?? "");
  const [name, setName] = useState(defaultName ?? "");
  const [subject, setSubject] = useState<string>(CONTACT_SUBJECTS[0]);
  const [otherSubject, setOtherSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailLocked ? lockedEmail : email,
          name: name.trim() || undefined,
          subject,
          otherSubject: subject === "Other" ? otherSubject : undefined,
          message,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send your message.");
        return;
      }
      setSent(true);
      setMessage("");
      setOtherSubject("");
      setSubject(CONTACT_SUBJECTS[0]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="panel-aside space-y-3 p-6 shadow-md">
        <h2 className="text-lg font-bold text-brand">Message sent</h2>
        <p className="text-sm text-muted">
          Thanks — we’ve emailed you a confirmation and will reply as soon as we
          can.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setSent(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel-aside space-y-4 p-6 shadow-md">
      <label className="block space-y-1.5">
        <span className="field-label">Your email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={emailLocked}
          autoComplete="email"
          className={
            emailLocked
              ? "field cursor-not-allowed bg-surface text-muted"
              : "field"
          }
        />
        {emailLocked && (
          <span className="text-xs text-muted">
            Using your signed-in account email.
          </span>
        )}
      </label>

      <label className="block space-y-1.5">
        <span className="field-label">Name (optional)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="field"
          maxLength={80}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="field-label">Subject</span>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="field"
          required
        >
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {subject === "Other" && (
        <label className="block space-y-1.5">
          <span className="field-label">Describe your subject</span>
          <input
            type="text"
            required
            value={otherSubject}
            onChange={(e) => setOtherSubject(e.target.value)}
            className="field"
            maxLength={120}
            placeholder="e.g. Corporate account enquiry"
          />
        </label>
      )}

      <label className="block space-y-1.5">
        <span className="field-label">Message</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          minLength={10}
          maxLength={4000}
          className="field min-h-[9rem] resize-y py-3"
          placeholder="Tell us how we can help…"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
