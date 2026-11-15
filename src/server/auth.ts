import type { D1Database, Env } from './db'
import {
  createId,
  createToken,
  hashPassword,
  hashToken,
  PASSWORD_ITERATIONS,
  verifyPassword,
} from './crypto'
import { sendPasswordResetEmail } from './email'
import {
  assertSameOrigin,
  HttpError,
  json,
  noContent,
  readJson,
} from './http'
import {
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  requireDisplayName,
  requireEmail,
  requirePassword,
  requireUsername,
} from './validation'

const SESSION_COOKIE = 'neuron_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const RESET_TTL_MS = 60 * 60 * 1000

const DUMMY_PASSWORD_HASH = [
  'pbkdf2-sha256',
  String(PASSWORD_ITERATIONS),
  'AAAAAAAAAAAAAAAAAAAAAA==',
  `${'A'.repeat(43)}=`,
].join('$')

export type AccountStatus = 'active' | 'pending' | 'rejected'
export type AccountRole = 'student' | 'owner'

interface UserRow {
  id: string
  email: string
  display_name: string
  password_hash: string
  status: AccountStatus
  role: AccountRole
  is_demo: number
}

interface SessionUserRow {
  id: string
  email: string
  display_name: string
  role: AccountRole
  is_demo: number
}

interface ResetTokenRow {
  user_id: string
}

export interface PublicUser {
  id: string
  email: string
  displayName: string
  role: AccountRole
  isDemo: boolean
}

function toPublicUser(row: SessionUserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isDemo: row.is_demo === 1,
  }
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) {
    return null
  }

  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf('=')
    if (separator === -1) {
      continue
    }
    const key = trimmed.slice(0, separator)
    if (key === name) {
      return trimmed.slice(separator + 1)
    }
  }

  return null
}

function sessionCookie(
  request: Request,
  token: string,
  maxAgeSeconds: number,
): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (new URL(request.url).protocol === 'https:') {
    parts.push('Secure')
  }
  if (maxAgeSeconds === 0) {
    parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  }
  return parts.join('; ')
}

function withSessionCookie(
  response: Response,
  request: Request,
  token: string,
): Response {
  response.headers.append(
    'Set-Cookie',
    sessionCookie(request, token, Math.floor(SESSION_TTL_MS / 1000)),
  )
  return response
}

function withClearedSessionCookie(
  response: Response,
  request: Request,
): Response {
  response.headers.append('Set-Cookie', sessionCookie(request, '', 0))
  return response
}

async function findUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, password_hash, status, role, is_demo
       FROM users
       WHERE email = ?`,
    )
    .bind(email)
    .first<UserRow>()
}

async function findUserByIdentifier(
  db: D1Database,
  identifier: string,
): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, password_hash, status, role, is_demo
       FROM users
       WHERE email = ? OR username = ?`,
    )
    .bind(identifier, identifier)
    .first<UserRow>()
}

async function createSession(
  db: D1Database,
  userId: string,
): Promise<string> {
  const token = createToken()
  const tokenHash = await hashToken(token)
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      createId(),
      userId,
      tokenHash,
      new Date(now).toISOString(),
      new Date(now + SESSION_TTL_MS).toISOString(),
    )
    .run()
  return token
}

export async function getSessionUser(
  request: Request,
  env: Env,
): Promise<PublicUser | null> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) {
    return null
  }

  const tokenHash = await hashToken(token)
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.role, u.is_demo
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<SessionUserRow>()

  return row ? toPublicUser(row) : null
}

async function handleLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const body = await readJson(request)
  const identifier =
    typeof body.identifier === 'string'
      ? body.identifier.trim().toLowerCase()
      : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const validIdentifier = identifier.includes('@')
    ? isValidEmail(identifier)
    : isValidUsername(identifier)

  if (!validIdentifier || !password) {
    await verifyPassword(password || 'invalid-password', DUMMY_PASSWORD_HASH)
    throw new HttpError(401, 'Invalid email, username, or password.')
  }

  const user = await findUserByIdentifier(env.DB, identifier)
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH)
    throw new HttpError(401, 'Invalid email, username, or password.')
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    throw new HttpError(401, 'Invalid email, username, or password.')
  }

  // Status is checked only after the password matches, so the login response
  // never reveals whether an unverified identifier belongs to a real account.
  if (user.status === 'pending') {
    throw new HttpError(403, 'Your account is waiting for owner approval.')
  }
  if (user.status === 'rejected') {
    throw new HttpError(
      403,
      'This account was not approved. Contact the NEUming owner.',
    )
  }

  const token = await createSession(env.DB, user.id)
  return withSessionCookie(
    json({ user: toPublicUser(user) }),
    request,
    token,
  )
}

const PENDING_APPROVAL_MESSAGE =
  'Your account request is in. The NEUming owner will review it, then you can log in.'

async function handleRegister(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const body = await readJson(request)
  const email = requireEmail(body.email)
  const username = requireUsername(body.username)
  const displayName = requireDisplayName(body.displayName)
  const password = requirePassword(body.password)

  const existing = await env.DB.prepare(
    'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
  )
    .bind(email, username)
    .first<{ id: string; email: string; username: string | null }>()

  if (existing) {
    throw new HttpError(
      409,
      existing.email === email
        ? 'An account with this email already exists.'
        : 'That username is already taken.',
    )
  }

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  try {
    await env.DB.prepare(
      `INSERT INTO users
        (id, email, username, display_name, password_hash, created_at,
         updated_at, status, role, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'student', 0)`,
    )
      .bind(createId(), email, username, displayName, passwordHash, now, now)
      .run()
  } catch (error) {
    // The unique indexes still guard against two simultaneous requests.
    if (String(error).toLowerCase().includes('unique')) {
      throw new HttpError(
        409,
        'An account with this email or username already exists.',
      )
    }
    throw error
  }

  return json({ ok: true, message: PENDING_APPROVAL_MESSAGE }, 201)
}

async function handleDemoLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)

  const demo = await env.DB.prepare(
    `SELECT id, email, display_name, role, is_demo
     FROM users
     WHERE is_demo = 1 AND status = 'active'`,
  ).first<SessionUserRow>()

  if (!demo) {
    throw new HttpError(
      503,
      'The demo account is not available right now. Please try again later.',
    )
  }

  const token = await createSession(env.DB, demo.id)
  return withSessionCookie(
    json({ user: toPublicUser(demo) }),
    request,
    token,
  )
}

async function handleLogout(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const token = getCookie(request, SESSION_COOKIE)
  if (token) {
    const tokenHash = await hashToken(token)
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run()
  }
  return withClearedSessionCookie(noContent(), request)
}

async function handleMe(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  return json({ user })
}

async function handleForgotPassword(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const body = await readJson(request)
  const email = normalizeEmail(body.email)

  if (isValidEmail(email)) {
    const user = await findUserByEmail(env.DB, email)
    if (user) {
      const token = createToken()
      const tokenHash = await hashToken(token)
      const now = Date.now()
      await env.DB.batch([
        env.DB.prepare(
          'DELETE FROM password_reset_tokens WHERE user_id = ?',
        ).bind(user.id),
        env.DB.prepare(
          `INSERT INTO password_reset_tokens
            (id, user_id, token_hash, created_at, expires_at, used_at)
           VALUES (?, ?, ?, ?, ?, NULL)`,
        ).bind(
          createId(),
          user.id,
          tokenHash,
          new Date(now).toISOString(),
          new Date(now + RESET_TTL_MS).toISOString(),
        ),
      ])

      const origin = (
        env.APP_ORIGIN ?? new URL(request.url).origin
      ).replace(/\/$/, '')
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`

      try {
        await sendPasswordResetEmail(env, {
          to: user.email,
          displayName: user.display_name,
          resetUrl,
        })
      } catch (error) {
        console.error('Failed to send password reset email:', error)
      }
    }
  }

  return json(
    {
      ok: true,
      message:
        'If an account exists for that email, a reset link has been sent.',
    },
    202,
  )
}

async function handleResetPassword(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const body = await readJson(request)
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = requirePassword(body.password)

  if (!token) {
    throw new HttpError(400, 'This reset link is invalid or has expired.')
  }

  const tokenHash = await hashToken(token)
  const reset = await env.DB.prepare(
    `SELECT user_id FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<ResetTokenRow>()

  if (!reset) {
    throw new HttpError(400, 'This reset link is invalid or has expired.')
  }

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    ).bind(passwordHash, now, reset.user_id),
    env.DB.prepare(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
    ).bind(reset.user_id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(
      reset.user_id,
    ),
  ])

  return withClearedSessionCookie(json({ ok: true }), request)
}

export async function handleAuthRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const path = new URL(request.url).pathname
  const method = request.method.toUpperCase()

  if (path === '/api/auth/login' && method === 'POST') {
    return handleLogin(request, env)
  }
  if (path === '/api/auth/register' && method === 'POST') {
    return handleRegister(request, env)
  }
  if (path === '/api/auth/demo' && method === 'POST') {
    return handleDemoLogin(request, env)
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    return handleLogout(request, env)
  }
  if (path === '/api/auth/me' && method === 'GET') {
    return handleMe(request, env)
  }
  if (path === '/api/auth/forgot-password' && method === 'POST') {
    return handleForgotPassword(request, env)
  }
  if (path === '/api/auth/reset-password' && method === 'POST') {
    return handleResetPassword(request, env)
  }

  return null
}
