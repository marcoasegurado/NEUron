import type { Env } from './db'
import { getSessionUser } from './auth'
import { assertSameOrigin, json, HttpError, readJson } from './http'
import { toSubject, type SubjectRow } from './academic'

async function requireUser(request: Request, env: Env) {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  return user
}

/**
 * Loads a subject the signed-in user owns, validating
 * subject -> semester -> user. Returns null when it is not owned so callers
 * can answer 404 without leaking existence.
 */
async function loadOwnedSubject(
  env: Env,
  userId: string,
  subjectId: string,
): Promise<SubjectRow | null> {
  return env.DB.prepare(
    `SELECT s.id, s.semester_id, s.name, s.units, s.professor, s.is_active,
            s.sort_order, s.created_at, s.updated_at
     FROM subjects s
     JOIN semesters m ON m.id = s.semester_id
     WHERE s.id = ? AND m.user_id = ?`,
  )
    .bind(subjectId, userId)
    .first<SubjectRow>()
}

/**
 * Toggles the dropped/restored status of a subject. `is_active` is the only
 * field this endpoint accepts in Phase 10; other subject fields are unchanged.
 */
async function handleUpdateSubjectStatus(
  request: Request,
  env: Env,
  subjectId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)

  const subject = await loadOwnedSubject(env, user.id, subjectId)
  if (!subject) {
    throw new HttpError(404, 'Subject not found.')
  }

  const body = await readJson(request)
  if (typeof body.active !== 'boolean') {
    throw new HttpError(400, 'Provide an active value of true or false.')
  }

  const isActive = body.active ? 1 : 0
  const now = new Date().toISOString()

  await env.DB.prepare(
    `UPDATE subjects
     SET is_active = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(isActive, now, subjectId)
    .run()

  return json({
    subject: toSubject({
      ...subject,
      is_active: isActive,
      updated_at: now,
    }),
  })
}

export async function handleSubjectRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] !== 'api' || parts[1] !== 'subjects') {
    return null
  }

  if (parts.length === 3 && request.method.toUpperCase() === 'PATCH') {
    return handleUpdateSubjectStatus(
      request,
      env,
      decodeURIComponent(parts[2]),
    )
  }

  return null
}
