import { NextRequest, NextResponse } from "next/server";
import { emailConfig } from "@/lib/config";
import { isContactSubject } from "@/lib/contact";
import {
  sendContactConfirmationEmail,
  sendContactEnquiryEmail,
} from "@/lib/email";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 4000;
const MAX_OTHER = 120;

export async function POST(request: NextRequest) {
  if (!emailConfig.isConfigured) {
    return NextResponse.json(
      {
        error:
          "Email isn’t configured yet. Please try again later or call us.",
      },
      { status: 503 },
    );
  }

  let body: {
    email?: string;
    subject?: string;
    otherSubject?: string;
    message?: string;
    name?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let email = (body.email ?? "").trim().toLowerCase();
  const subjectChoice = (body.subject ?? "").trim();
  const otherSubject = (body.otherSubject ?? "").trim();
  const message = (body.message ?? "").trim();
  const name = (body.name ?? "").trim().slice(0, 80) || null;

  // Prefer the signed-in account email so guests can’t spoof a locked inbox.
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user?.email) {
      email = user.email.trim().toLowerCase();
    }
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (!isContactSubject(subjectChoice)) {
    return NextResponse.json(
      { error: "Choose a subject from the list." },
      { status: 400 },
    );
  }
  if (subjectChoice === "Other" && !otherSubject) {
    return NextResponse.json(
      { error: "Please describe your subject." },
      { status: 400 },
    );
  }
  if (otherSubject.length > MAX_OTHER) {
    return NextResponse.json(
      { error: "Subject is too long." },
      { status: 400 },
    );
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "Please write a short message (at least 10 characters)." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 400 },
    );
  }

  const subject =
    subjectChoice === "Other" ? otherSubject.slice(0, MAX_OTHER) : subjectChoice;

  try {
    const toTeam = await sendContactEnquiryEmail({
      fromEmail: email,
      subject,
      message,
      name,
    });
    if (!toTeam) {
      return NextResponse.json(
        { error: "Could not send your message. Please try again." },
        { status: 502 },
      );
    }

    // Confirmation is best-effort — the team already has the enquiry.
    await sendContactConfirmationEmail({
      to: email,
      subject,
      message,
      name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
