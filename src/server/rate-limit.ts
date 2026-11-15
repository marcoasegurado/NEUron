import { HttpError } from './http'

/**
 * Cloudflare's Rate Limiting binding. Limits are approximate and apply per
 * Cloudflare location, which is enough to blunt scripted abuse without adding
 * a D1 write to every auth attempt.
 */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

const MESSAGE = 'Too many attempts. Wait a minute, then try again.'
const RETRY_AFTER_SECONDS = '60'

function requestIp(request: Request): string {
  const direct = request.headers.get('cf-connecting-ip')?.trim()
  if (direct) {
    return direct
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}

/**
 * Builds the binding key. Including the scope keeps the login, registration,
 * and demo counters independent even when they share a binding, and including
 * the account identifier keeps one student's failed logins from blocking other
 * students who share the same network.
 */
export function rateLimitKey(
  request: Request,
  scope: string,
  subject?: string,
): string {
  const base = `${scope}:${requestIp(request)}`
  return subject ? `${base}:${subject}` : base
}

export async function enforceAuthRateLimit(
  binding: RateLimitBinding | undefined,
  request: Request,
  scope: string,
  subject?: string,
): Promise<void> {
  // Local tooling and older deployments may not have the binding. Skipping is
  // safer than rejecting every auth request when the binding is missing.
  if (!binding) {
    return
  }

  const { success } = await binding.limit({
    key: rateLimitKey(request, scope, subject),
  })

  if (!success) {
    throw new HttpError(429, MESSAGE, {
      'Retry-After': RETRY_AFTER_SECONDS,
    })
  }
}
