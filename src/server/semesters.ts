import type { D1Database, Env } from './db'
import { createId } from './crypto'
import { getSessionUser } from './auth'
import {
  json,
  assertSameOrigin,
  HttpError,
  readJson,
} from './http'
import {
  toActivity,
  toGradingCategory,
  toSemester,
  toSubject,
  type Activity,
  type ActivityRow,
  type GradingCategoryWithActivities,
  type GradingCategoryRow,
  type SemesterRow,
  type SemesterSetup,
  type SubjectRow,
  type SubjectWithCategories,
} from './academic'
import {
  MAX_SUBJECTS,
  parseSemesterSetup,
  parseSubjectSetup,
} from './academic-validation'

async function requireUser(request: Request, env: Env) {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }
  return user
}

async function loadSemesterSetup(
  db: D1Database,
  userId: string,
  semesterId: string,
): Promise<SemesterSetup | null> {
  const semesterRow = await db
    .prepare(
      `SELECT id, user_id, academic_year, term, label, is_active,
              created_at, updated_at
       FROM semesters
       WHERE id = ? AND user_id = ?`,
    )
    .bind(semesterId, userId)
    .first<SemesterRow>()

  if (!semesterRow) {
    return null
  }

  const subjectRows =
    (
      await db
        .prepare(
          `SELECT id, semester_id, name, units, professor, sort_order,
                  created_at, updated_at
           FROM subjects
           WHERE semester_id = ?
           ORDER BY sort_order, created_at`,
        )
        .bind(semesterId)
        .all<SubjectRow>()
    ).results ?? []

  const categoriesBySubject = new Map<string, GradingCategoryWithActivities[]>()

  if (subjectRows.length > 0) {
    const placeholders = subjectRows.map(() => '?').join(', ')
    const categoryRows =
      (
        await db
          .prepare(
            `SELECT id, subject_id, name, weight_percent, is_active,
                    sort_order, created_at, updated_at
             FROM grading_categories
             WHERE subject_id IN (${placeholders})
             ORDER BY sort_order, created_at`,
          )
          .bind(...subjectRows.map((subject) => subject.id))
          .all<GradingCategoryRow>()
      ).results ?? []

    const activitiesByCategory = new Map<string, Activity[]>()

    if (categoryRows.length > 0) {
      const categoryPlaceholders = categoryRows.map(() => '?').join(', ')
      const activityRows =
        (
          await db
            .prepare(
              `SELECT id, category_id, name, score_earned, total_points,
                      activity_date, created_at, updated_at
               FROM activities
               WHERE category_id IN (${categoryPlaceholders})
               ORDER BY activity_date, created_at`,
            )
            .bind(...categoryRows.map((category) => category.id))
            .all<ActivityRow>()
        ).results ?? []

      for (const row of activityRows) {
        const activities = activitiesByCategory.get(row.category_id) ?? []
        activities.push(toActivity(row))
        activitiesByCategory.set(row.category_id, activities)
      }
    }

    for (const row of categoryRows) {
      const categories = categoriesBySubject.get(row.subject_id) ?? []
      categories.push({
        ...toGradingCategory(row),
        activities: activitiesByCategory.get(row.id) ?? [],
      })
      categoriesBySubject.set(row.subject_id, categories)
    }
  }

  return {
    semester: toSemester(semesterRow),
    subjects: subjectRows.map((row) => ({
      ...toSubject(row),
      categories: categoriesBySubject.get(row.id) ?? [],
    })),
  }
}

async function handleListSemesters(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = await requireUser(request, env)
  const result = await env.DB.prepare(
    `SELECT id, user_id, academic_year, term, label, is_active,
            created_at, updated_at
     FROM semesters
     WHERE user_id = ?
     ORDER BY is_active DESC, created_at DESC`,
  )
    .bind(user.id)
    .all<SemesterRow>()

  return json({
    semesters: (result.results ?? []).map(toSemester),
  })
}

async function handleGetSemester(
  request: Request,
  env: Env,
  semesterId: string,
): Promise<Response> {
  const user = await requireUser(request, env)
  const setup = await loadSemesterSetup(env.DB, user.id, semesterId)
  if (!setup) {
    throw new HttpError(404, 'Semester not found.')
  }
  return json(setup)
}

async function handleCreateSemester(
  request: Request,
  env: Env,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)
  const input = parseSemesterSetup(await readJson(request))

  const duplicate = await env.DB.prepare(
    `SELECT id FROM semesters
     WHERE user_id = ?
       AND academic_year = ? COLLATE NOCASE
       AND term = ? COLLATE NOCASE`,
  )
    .bind(user.id, input.academicYear, input.term)
    .first<{ id: string }>()

  if (duplicate) {
    throw new HttpError(
      409,
      'A semester for that academic year and term already exists.',
    )
  }

  const semesterId = createId()
  const now = new Date().toISOString()
  const statements = [
    env.DB.prepare(
      `UPDATE semesters
       SET is_active = 0, updated_at = ?
       WHERE user_id = ? AND is_active = 1`,
    ).bind(now, user.id),
    env.DB.prepare(
      `INSERT INTO semesters
        (id, user_id, academic_year, term, label, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      semesterId,
      user.id,
      input.academicYear,
      input.term,
      input.label,
      now,
      now,
    ),
  ]

  input.subjects.forEach((subject, subjectIndex) => {
    const subjectId = createId()
    statements.push(
      env.DB.prepare(
        `INSERT INTO subjects
          (id, semester_id, name, units, professor, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        subjectId,
        semesterId,
        subject.name,
        subject.units,
        subject.professor,
        subjectIndex,
        now,
        now,
      ),
    )

    subject.categories.forEach((category, categoryIndex) => {
      statements.push(
        env.DB.prepare(
          `INSERT INTO grading_categories
            (id, subject_id, name, weight_percent, is_active, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        ).bind(
          createId(),
          subjectId,
          category.name,
          category.weightPercent,
          categoryIndex,
          now,
          now,
        ),
      )
    })
  })

  try {
    await env.DB.batch(statements)
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new HttpError(
        409,
        'A semester for that academic year and term already exists.',
      )
    }
    throw error
  }

  const setup = await loadSemesterSetup(env.DB, user.id, semesterId)
  if (!setup) {
    throw new HttpError(500, 'Semester could not be loaded after saving.')
  }

  return json(setup, 201)
}

async function handleCreateSubject(
  request: Request,
  env: Env,
  semesterId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)

  const semester = await env.DB.prepare(
    `SELECT id FROM semesters WHERE id = ? AND user_id = ?`,
  )
    .bind(semesterId, user.id)
    .first<{ id: string }>()

  if (!semester) {
    throw new HttpError(404, 'Semester not found.')
  }

  const existing =
    (
      await env.DB.prepare(
        `SELECT name FROM subjects WHERE semester_id = ?`,
      )
        .bind(semesterId)
        .all<{ name: string }>()
    ).results ?? []

  if (existing.length >= MAX_SUBJECTS) {
    throw new HttpError(
      400,
      `A semester can have at most ${MAX_SUBJECTS} subjects.`,
    )
  }

  const input = parseSubjectSetup(
    await readJson(request),
    existing.map((row) => row.name),
  )

  const sortRow = await env.DB.prepare(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
     FROM subjects
     WHERE semester_id = ?`,
  )
    .bind(semesterId)
    .first<{ next: number }>()

  const now = new Date().toISOString()
  const subjectRow: SubjectRow = {
    id: createId(),
    semester_id: semesterId,
    name: input.name,
    units: input.units,
    professor: input.professor,
    sort_order: sortRow?.next ?? existing.length,
    created_at: now,
    updated_at: now,
  }

  const categoryRows = input.categories.map((category, index) => ({
    id: createId(),
    subject_id: subjectRow.id,
    name: category.name,
    weight_percent: category.weightPercent,
    is_active: 1,
    sort_order: index,
    created_at: now,
    updated_at: now,
  }))

  const statements = [
    env.DB.prepare(
      `INSERT INTO subjects
        (id, semester_id, name, units, professor, sort_order,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      subjectRow.id,
      subjectRow.semester_id,
      subjectRow.name,
      subjectRow.units,
      subjectRow.professor,
      subjectRow.sort_order,
      subjectRow.created_at,
      subjectRow.updated_at,
    ),
    ...categoryRows.map((row) =>
      env.DB.prepare(
        `INSERT INTO grading_categories
          (id, subject_id, name, weight_percent, is_active, sort_order,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        row.id,
        row.subject_id,
        row.name,
        row.weight_percent,
        row.is_active,
        row.sort_order,
        row.created_at,
        row.updated_at,
      ),
    ),
  ]

  try {
    await env.DB.batch(statements)
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new HttpError(409, 'A subject with that name already exists.')
    }
    throw error
  }

  const subject: SubjectWithCategories = {
    ...toSubject(subjectRow),
    categories: categoryRows.map((row) => ({
      ...toGradingCategory(row),
      activities: [],
    })),
  }

  return json({ subject }, 201)
}

async function handleActivateSemester(
  request: Request,
  env: Env,
  semesterId: string,
): Promise<Response> {
  assertSameOrigin(request)
  const user = await requireUser(request, env)

  const semesterRow = await env.DB.prepare(
    `SELECT id, user_id, academic_year, term, label, is_active,
            created_at, updated_at
     FROM semesters
     WHERE id = ? AND user_id = ?`,
  )
    .bind(semesterId, user.id)
    .first<SemesterRow>()

  if (!semesterRow) {
    throw new HttpError(404, 'Semester not found.')
  }

  if (semesterRow.is_active === 1) {
    return json({ semester: toSemester(semesterRow) })
  }

  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE semesters
       SET is_active = 0, updated_at = ?
       WHERE user_id = ? AND is_active = 1`,
    ).bind(now, user.id),
    env.DB.prepare(
      `UPDATE semesters
       SET is_active = 1, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).bind(now, semesterId, user.id),
  ])

  return json({
    semester: toSemester({
      ...semesterRow,
      is_active: 1,
      updated_at: now,
    }),
  })
}

export async function handleSemesterRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] !== 'api' || parts[1] !== 'semesters') {
    return null
  }

  const method = request.method.toUpperCase()

  if (parts.length === 2) {
    if (method === 'GET') {
      return handleListSemesters(request, env)
    }
    if (method === 'POST') {
      return handleCreateSemester(request, env)
    }
    return null
  }

  if (parts.length === 3 && method === 'GET') {
    return handleGetSemester(request, env, decodeURIComponent(parts[2]))
  }

  if (
    parts.length === 4 &&
    parts[3] === 'subjects' &&
    method === 'POST'
  ) {
    return handleCreateSubject(
      request,
      env,
      decodeURIComponent(parts[2]),
    )
  }

  if (
    parts.length === 4 &&
    parts[3] === 'activate' &&
    method === 'POST'
  ) {
    return handleActivateSemester(
      request,
      env,
      decodeURIComponent(parts[2]),
    )
  }

  return null
}
