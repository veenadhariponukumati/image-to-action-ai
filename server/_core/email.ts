import { ENV } from "./env";

// Pluggable email sender. Until a real provider key is configured, reset links
// are just logged server-side so the flow is fully testable without needing
// an external email account set up first.
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!ENV.resendApiKey) {
    console.log(`[Email] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.resendFromEmail ?? "onboarding@resend.dev",
      to,
      subject: "Reset your Image-to-Action password",
      html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    }),
  });

  if (!response.ok) {
    console.error("[Email] Failed to send via Resend:", await response.text().catch(() => response.statusText));
  }
}
