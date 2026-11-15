import { getSessionUser, type PublicUser } from './auth'
import type { Env } from './db'
import { assertSameOrigin, HttpError, json } from './http'

interface AccountRequestRow {
  id: string
  email: string
  username: string | null
  display_name: string
  created_at: string
}

interface AccountRequest {
  id: string
  email: string
  username: string
  displayName: string
  createdAt: string
}

function toAccountRequest(row: AccountRequestRow): AccountRequest {
  return {
    id: row.id,
    email: row.email,
    username: row.username ?? '',
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

async function requireOwner(
  request: Request,
  env: Env,
): Promise<PublicUser> {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  if (user.role !== 'owner') {
    throw new HttpError(403, 'Only the NEUming owner can do that.')
  }
  return user
}

function methodNotAllowed(allow: string): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: {
      Allow: allow,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

async function handleListPending(
  request: Request,
  env: Env,
): Promise<Response> {
  await requireOwner(request, env)

  const rows = await env.DB.prepare(
    `SELECT id, email, username, display_name, created_at
     FROM users
     WHERE status = 'pending' AND role = 'student' AND is_demo = 0
     ORDER BY created_at ASC`,
  ).all<AccountRequestRow>()

  return json({ accounts: (rows.results ?? []).map(toAccountRequest) })
}

async function handleDecision(
  request: Request,
  env: Env,
  id: string,
  decision: 'approve' | 'reject',
): Promise<Response> {
  assertSameOrigin(request)
  await requireOwner(request, env)

  const account = await env.DB.prepare(
    `SELECT id, email, username, display_name, created_at
     FROM users
     WHERE id = ? AND status = 'pending' AND role = 'student' AND is_demo = 0`,
  )
    .bind(id)
    .first<AccountRequestRow>()

  if (!account) {
    throw new HttpError(404, 'Account request not found.')
  }

  const now = new Date().toISOString()
  const statements = [
    env.DB.prepare(
      'UPDATE users SET status = ?, updated_at = ? WHERE id = ?',
    ).bind(decision === 'approve' ? 'active' : 'rejected', now, id),
  ]

  if (decision === 'reject') {
    // A pending account has no session yet; this keeps a repeated decision safe.
    statements.push(
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    )
  }

  await env.DB.batch(statements)

  return json({ account: toAccountRequest(account) })
}

export async function handleAdminRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const path = new URL(request.url).pathname
  const method = request.method.toUpperCase()

  if (path === '/api/admin/accounts') {
    if (method !== 'GET') {
      return methodNotAllowed('GET')
    }
    return handleListPending(request, env)
  }

  const decisionMatch = path.match(
    /^\/api\/admin\/accounts\/([^/]+)\/(approve|reject)$/,
  )
  if (decisionMatch) {
    if (method !== 'POST') {
      return methodNotAllowed('POST')
    }
    return handleDecision(
      request,
      env,
      decodeURIComponent(decisionMatch[1]),
      decisionMatch[2] as 'approve' | 'reject',
    )
  }

  return null
}
