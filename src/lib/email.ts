import { Resend } from "resend";

let resendClient: Resend | undefined;

// Lazily constructed so importing this module doesn't require
// RESEND_API_KEY to be set (mirrors src/lib/stripe.ts).
function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInviteEmail({
  to,
  familyName,
  inviteUrl,
}: {
  to: string;
  familyName: string;
  inviteUrl: string;
}) {
  const safeFamilyName = escapeHtml(familyName);
  const safeInviteUrl = escapeHtml(inviteUrl);

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Toothfairy <onboarding@resend.dev>",
    to,
    subject: `You're invited to ${familyName}'s tooth fairy circle`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <h1 style="font-size: 20px;">You're invited 🦷</h1>
        <p>Someone invited you to <strong>${safeFamilyName}</strong>'s tooth
        fairy circle &mdash; a private way to send a little something when
        their kid loses a tooth.</p>
        <p>
          <a
            href="${safeInviteUrl}"
            style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;"
          >View invite</a>
        </p>
        <p style="color:#666;font-size:13px;">${safeInviteUrl}</p>
      </div>
    `,
  });
}
