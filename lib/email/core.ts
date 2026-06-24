import { Resend } from "resend";

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "Slotify <onboarding@resend.dev>"
  );
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set — skipping email");
    return { sent: false, error: "Email not configured" };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Failed to send email:", error);
    return { sent: false, error: error.message };
  }

  return { sent: true };
}
