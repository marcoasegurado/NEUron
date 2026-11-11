import type { Env } from './db'
import { getSessionUser } from './auth'
import { json, HttpError } from './http'
import type { ConversionRow } from '../lib/grading/types'
import { validateConversionTable } from '../lib/grading/grading'

interface ConversionRowRecord {
  minimum_percentage: number
  grade: number
}

/**
 * The conversion table is central and read-only for students (Phase 10
 * decisions in GRADING_RULES.md §6). This endpoint only reads it; rows are
 * written by owner tooling, never by the app.
 */
async function handleGetConversionTable(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new HttpError(401, 'Not signed in.')
  }

  const result = await env.DB.prepare(
    `SELECT minimum_percentage, grade
     FROM conversion_rows
     ORDER BY minimum_percentage DESC`,
  ).all<ConversionRowRecord>()

  const rows: ConversionRow[] = (result.results ?? []).map((row) => ({
    minimumPercentage: row.minimum_percentage,
    grade: row.grade,
  }))

  const validation = validateConversionTable(rows)

  return json({
    rows,
    configured: rows.length > 0,
    valid: rows.length > 0 && validation.valid,
    errors: rows.length > 0 ? validation.errors : [],
  })
}

export async function handleConversionRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url)

  if (url.pathname !== '/api/settings/conversion') {
    return null
  }

  if (request.method.toUpperCase() !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed.' }),
      {
        status: 405,
        headers: {
          Allow: 'GET',
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  return handleGetConversionTable(request, env)
}
