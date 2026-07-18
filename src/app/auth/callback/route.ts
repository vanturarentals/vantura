import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { sendWelcomeEmail } from "@/lib/email";

const WELCOME_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/manage";

  if (!getSupabaseEnv()) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          const createdAt = user.created_at
            ? new Date(user.created_at).getTime()
            : 0;
          const isNew = Date.now() - createdAt < WELCOME_WINDOW_MS;
          const alreadySent = Boolean(user.user_metadata?.welcome_email_sent);
          if (isNew && !alreadySent) {
            await sendWelcomeEmail({
              email: user.email,
              name:
                (typeof user.user_metadata?.full_name === "string"
                  ? user.user_metadata.full_name
                  : null) ||
                (typeof user.user_metadata?.name === "string"
                  ? user.user_metadata.name
                  : null),
            });
            await supabase.auth.updateUser({
              data: { welcome_email_sent: true },
            });
          }
        }
      } catch (err) {
        console.error("[auth/callback] welcome email failed:", err);
      }

      const safeNext = next.startsWith("/") ? next : "/manage";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
