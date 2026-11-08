import { getSessionUser } from './auth'
import { createId } from './crypto'
import type { Env } from './db'
import {
  assertSameOrigin,
  HttpError,
  json,
  noContent,
  readJson,
} from './http'
import {
  parseActivityInput,
  parseActivityUpdate,
} from './activity-validation'
import { toActivity, type ActivityRow } from './academic'

interface OwnedCategoryRow {
  id: string
  is_active: number
}

async function requireUser(request: Request, env: Env) {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  return user
}

async function requireOwnedActivity(
  env: Env,
  userId: string,
  activityId: string,
): Promise<ActivityRow> {
  const row = await env.DB.prepare(
    `SELECT a.id, a.category_id, a.name, a.score_earned, a.total_points,
            a.activity_date, a.created_at, a.updated_at
     FROM activities a
     JOIN grading_categories c ON c.id = a.category_id
     JOIN subjects s ON s.id = c.subject_id
     JOIN semesters m ON m.id = s.semester_id
     WHERE a.id = ? AND m.user_id = ?`,
  )
    .bind(activityId, userId)
    .first<ActivityRow>()

  if (!row) {
    throw new HttpError(404, 'Activity not found.')
  }
  return row
}

async function handleCreateActivity(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  const input = parseActivityInput(await readJson(request))

  const category = await env.DB.prepare(
    `SELECT c.id, c.is_active
     FROM grading_categories c
     JOIN subjects s ON s.id = c.subject_id
     JOIN semesters m ON m.id = s.semester_id
     WHERE c.id = ? AND c.subject_id = ? AND m.user_id = ?`,
  )
    .bind(input.categoryId, input.subjectId, user.id)
    .first<OwnedCategoryRow>()

  if (!category) {
    throw new HttpError(404, 'Grading category not found.')
  }

  if (category.is_active !== 1) {
    throw new HttpError(400, 'That grading category is inactive.')
  }

  const now = new Date().toISOString()
  const activity: ActivityRow = {
    id: createId(),
    category_id: input.categoryId,
    name: input.name,
    score_earned: input.scoreEarned,
    total_points: input.totalPoints,
    activity_date: input.date,
    created_at: now,
    updated_at: now,
  }

  await env.DB.prepare(
    `INSERT INTO activities
      (id, category_id, name, score_earned, total_points, activity_date,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      activity.id,
      activity.category_id,
      activity.name,
      activity.score_earned,
      activity.total_points,
      activity.activity_date,
      activity.created_at,
      activity.updated_at,
    )
    .run()

  return json({ activity: toActivity(activity) }, 201)
}

async function handleUpdateActivity(
  request: Request,
  env: Env,
  activityId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  const input = parseActivityUpdate(await readJson(request))
  const existing = await requireOwnedActivity(env, user.id, activityId)

  const updated: ActivityRow = {
    ...existing,
    name: input.name,
    score_earned: input.scoreEarned,
    total_points: input.totalPoints,
    activity_date: input.date,
    updated_at: new Date().toISOString(),
  }

  await env.DB.prepare(
    `UPDATE activities
     SET name = ?, score_earned = ?, total_points = ?, activity_date = ?,
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      updated.name,
      updated.score_earned,
      updated.total_points,
      updated.activity_date,
      updated.updated_at,
      updated.id,
    )
    .run()

  return json({ activity: toActivity(updated) })
}

async function handleDeleteActivity(
  request: Request,
  env: Env,
  activityId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  await requireOwnedActivity(env, user.id, activityId)

  await env.DB.prepare('DELETE FROM activities WHERE id = ?')
    .bind(activityId)
    .run()

  return noContent()
}

export async function handleActivityRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] !== 'api' || parts[1] !== 'activities') {
    return null
  }

  const method = request.method.toUpperCase()

  if (parts.length === 2) {
    if (method === 'POST') {
      return handleCreateActivity(request, env)
    }
    return null
  }

  if (parts.length === 3) {
    const activityId = decodeURIComponent(parts[2])
    if (method === 'PATCH') {
      return handleUpdateActivity(request, env, activityId)
    }
    if (method === 'DELETE') {
      return handleDeleteActivity(request, env, activityId)
    }
  }

  return null
}
