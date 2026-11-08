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
  parseScheduleClassInput,
  parseScheduleClassUpdate,
} from './schedule-validation'
import {
  toScheduleClass,
  type ScheduleClassRow,
} from './academic'

async function requireUser(request: Request, env: Env) {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  return user
}

async function requireOwnedSemester(
  env: Env,
  userId: string,
  semesterId: string,
): Promise<void> {
  const row = await env.DB.prepare(
    'SELECT id FROM semesters WHERE id = ? AND user_id = ?',
  )
    .bind(semesterId, userId)
    .first<{ id: string }>()

  if (!row) {
    throw new HttpError(404, 'Semester not found.')
  }
}

async function requireSubjectInSemester(
  env: Env,
  subjectId: string,
  semesterId: string,
): Promise<void> {
  const row = await env.DB.prepare(
    'SELECT id FROM subjects WHERE id = ? AND semester_id = ?',
  )
    .bind(subjectId, semesterId)
    .first<{ id: string }>()

  if (!row) {
    throw new HttpError(404, 'Subject not found in that semester.')
  }
}

async function requireOwnedClass(
  env: Env,
  userId: string,
  classId: string,
): Promise<ScheduleClassRow> {
  const row = await env.DB.prepare(
    `SELECT c.id, c.semester_id, c.subject_id, c.day_of_week,
            c.start_time, c.end_time, c.room, c.created_at, c.updated_at
     FROM class_schedules c
     JOIN semesters m ON m.id = c.semester_id
     WHERE c.id = ? AND m.user_id = ?`,
  )
    .bind(classId, userId)
    .first<ScheduleClassRow>()

  if (!row) {
    throw new HttpError(404, 'Class not found.')
  }
  return row
}

async function handleListSchedule(
  request: Request,
  env: Env,
  semesterId: string,
): Promise<Response> {
  const user = await requireUser(request, env)
  await requireOwnedSemester(env, user.id, semesterId)

  const result = await env.DB.prepare(
    `SELECT id, semester_id, subject_id, day_of_week, start_time, end_time,
            room, created_at, updated_at
     FROM class_schedules
     WHERE semester_id = ?
     ORDER BY day_of_week, start_time, end_time, subject_id`,
  )
    .bind(semesterId)
    .all<ScheduleClassRow>()

  return json({
    classes: (result.results ?? []).map(toScheduleClass),
  })
}

async function handleCreateClass(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  const input = parseScheduleClassInput(await readJson(request))

  await requireOwnedSemester(env, user.id, input.semesterId)
  await requireSubjectInSemester(env, input.subjectId, input.semesterId)

  const now = new Date().toISOString()
  const row: ScheduleClassRow = {
    id: createId(),
    semester_id: input.semesterId,
    subject_id: input.subjectId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    room: input.room,
    created_at: now,
    updated_at: now,
  }

  await env.DB.prepare(
    `INSERT INTO class_schedules
      (id, semester_id, subject_id, day_of_week, start_time, end_time, room,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      row.id,
      row.semester_id,
      row.subject_id,
      row.day_of_week,
      row.start_time,
      row.end_time,
      row.room,
      row.created_at,
      row.updated_at,
    )
    .run()

  return json({ class: toScheduleClass(row) }, 201)
}

async function handleUpdateClass(
  request: Request,
  env: Env,
  classId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  const input = parseScheduleClassUpdate(await readJson(request))
  const existing = await requireOwnedClass(env, user.id, classId)

  await requireSubjectInSemester(env, input.subjectId, existing.semester_id)

  const updated: ScheduleClassRow = {
    ...existing,
    subject_id: input.subjectId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    room: input.room,
    updated_at: new Date().toISOString(),
  }

  await env.DB.prepare(
    `UPDATE class_schedules
     SET subject_id = ?, day_of_week = ?, start_time = ?, end_time = ?,
         room = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      updated.subject_id,
      updated.day_of_week,
      updated.start_time,
      updated.end_time,
      updated.room,
      updated.updated_at,
      updated.id,
    )
    .run()

  return json({ class: toScheduleClass(updated) })
}

async function handleDeleteClass(
  request: Request,
  env: Env,
  classId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  await requireOwnedClass(env, user.id, classId)

  await env.DB.prepare('DELETE FROM class_schedules WHERE id = ?')
    .bind(classId)
    .run()

  return noContent()
}

export async function handleScheduleRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const method = request.method.toUpperCase()

  if (
    parts[0] === 'api' &&
    parts[1] === 'semesters' &&
    parts.length === 4 &&
    parts[3] === 'schedule' &&
    method === 'GET'
  ) {
    return handleListSchedule(request, env, decodeURIComponent(parts[2]))
  }

  if (parts[0] !== 'api' || parts[1] !== 'schedule') {
    return null
  }

  if (parts.length === 2) {
    if (method === 'POST') {
      return handleCreateClass(request, env)
    }
    return null
  }

  if (parts.length === 3) {
    const classId = decodeURIComponent(parts[2])
    if (method === 'PATCH') {
      return handleUpdateClass(request, env, classId)
    }
    if (method === 'DELETE') {
      return handleDeleteClass(request, env, classId)
    }
  }

  return null
}
