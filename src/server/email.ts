import type { Env } from './db'

interface PasswordResetEmail {
  to: string
  displayName: string
  resetUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isEmailConfigured(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM)
}

export async function sendPasswordResetEmail(
  env: Env,
  { to, displayName, resetUrl }: PasswordResetEmail,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    throw new Error('Password reset email is not configured.')
  }

  const safeName = escapeHtml(displayName)
  const safeUrl = escapeHtml(resetUrl)
  const text = [
    `Hi ${displayName},`,
    '',
    'We received a request to reset your NEUron password.',
    'This link expires in 1 hour:',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2b2118; line-height: 1.6;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Reset your NEUron password</h1>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your NEUron password. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #d9662b; color: #ffffff; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="font-size: 13px; color: #6f6258;">If you did not request this, you can ignore this email.</p>
    </div>
  `.trim()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM,
      to: [to],
      subject: 'Reset your NEUron password',
      text,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}.`)
  }
}
