import { getSessionUser } from './auth'
import { createId } from './crypto'
import type { Env } from './db'
import { assertSameOrigin, HttpError, json, readJson } from './http'
import { parseActivityInput } from './activity-validation'
import { toActivity, type ActivityRow } from './academic'

interface OwnedCategoryRow {
  id: string
  is_active: number
}

async function handleCreateActivity(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)

  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }

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

export async function handleActivityRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (
    parts[0] !== 'api' ||
    parts[1] !== 'activities' ||
    parts.length !== 2
  ) {
    return null
  }

  if (request.method.toUpperCase() === 'POST') {
    return handleCreateActivity(request, env)
  }

  return null
}
