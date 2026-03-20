/**
 * Email service — uses Resend API (Cloudflare Workers compatible)
 * Falls back to fetch-based SMTP if RESEND_API_KEY not set but SMTP vars are.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = from || process.env.EMAIL_FROM || "Essyn Studio <noreply@essyn.studio>";

  if (resendKey) {
    return sendViaResend({ to, subject, html, from: fromAddress, apiKey: resendKey });
  }

  // Fallback: no email provider configured
  console.warn(`[Email] No email provider configured — email to ${to} was NOT sent. Set RESEND_API_KEY.`);
  return false;
}

async function sendViaResend({
  to, subject, html, from, apiKey,
}: SendEmailParams & { apiKey: string }): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Email] Resend error:", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

/* ── Email templates ── */

export function portalAccessEmail({
  clientName,
  studioName,
  portalUrl,
}: {
  clientName: string;
  studioName: string;
  portalUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Seu portal está pronto — ${studioName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 15px; color: #0C100E; line-height: 1.6;">
          Olá <strong>${clientName}</strong>,
        </p>
        <p style="font-size: 15px; color: #0C100E; line-height: 1.6;">
          Seu portal com <strong>${studioName}</strong> está pronto! Acesse suas galerias, contratos e pagamentos em um só lugar.
        </p>
        <div style="margin: 32px 0;">
          <a href="${portalUrl}" style="display: inline-block; padding: 14px 28px; background: #A58D66; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
            Acessar meu portal
          </a>
        </div>
        <p style="font-size: 12px; color: #7A8A8F; line-height: 1.5;">
          Este link expira em 15 minutos. Depois, basta acessar o portal e pedir um novo link com seu email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E1DD; margin: 24px 0;" />
        <p style="font-size: 11px; color: #B5AFA6;">
          Enviado por ${studioName} via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}

export function clientDirectEmail({
  clientName,
  studioName,
  subject,
  body,
}: {
  clientName: string;
  studioName: string;
  subject: string;
  body: string;
}): { subject: string; html: string } {
  const htmlBody = body.replace(/\n/g, "<br />");
  return {
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 15px; color: #0C100E; line-height: 1.6;">
          Olá <strong>${clientName}</strong>,
        </p>
        <div style="font-size: 15px; color: #0C100E; line-height: 1.7;">
          ${htmlBody}
        </div>
        <hr style="border: none; border-top: 1px solid #E5E1DD; margin: 32px 0;" />
        <p style="font-size: 11px; color: #B5AFA6;">
          Enviado por <strong>${studioName}</strong> via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}

export function teamInviteEmail({
  inviteeName,
  studioName,
  inviteUrl,
  role,
}: {
  inviteeName: string;
  studioName: string;
  inviteUrl: string;
  role: string;
}): { subject: string; html: string } {
  return {
    subject: `Convite para ${studioName} — Essyn Studio`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 15px; color: #0C100E; line-height: 1.6;">
          Olá <strong>${inviteeName}</strong>,
        </p>
        <p style="font-size: 15px; color: #0C100E; line-height: 1.6;">
          Você foi convidado para fazer parte da equipe de <strong>${studioName}</strong> como <strong>${role}</strong>.
        </p>
        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: #2C444D; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
            Aceitar convite
          </a>
        </div>
        <p style="font-size: 12px; color: #7A8A8F; line-height: 1.5;">
          Este convite expira em 7 dias.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E1DD; margin: 24px 0;" />
        <p style="font-size: 11px; color: #B5AFA6;">
          Enviado via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}
