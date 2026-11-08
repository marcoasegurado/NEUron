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
  toGradingCategory,
  toSemester,
  toSubject,
  type GradingCategory,
  type GradingCategoryRow,
  type SemesterRow,
  type SemesterSetup,
  type SubjectRow,
} from './academic'
import { parseSemesterSetup } from './academic-validation'

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

  const categoriesBySubject = new Map<string, GradingCategory[]>()

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

    for (const row of categoryRows) {
      const categories = categoriesBySubject.get(row.subject_id) ?? []
      categories.push(toGradingCategory(row))
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

  return null
}
