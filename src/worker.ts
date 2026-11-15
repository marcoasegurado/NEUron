import { handleActivityRequest } from './server/activities'
import { handleAdminRequest } from './server/accounts'
import { handleAuthRequest } from './server/auth'
import { handleConversionRequest } from './server/conversion'
import type { Env } from './server/db'
import { HttpError, json } from './server/http'
import { handleScheduleRequest } from './server/schedule'
import { handleSemesterRequest } from './server/semesters'
import { handleSubjectRequest } from './server/subjects'

async function databaseHealth(env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()

    if (row?.ok !== 1) {
      return json(
        { ok: false, error: 'Unexpected database response.' },
        503,
      )
    }

    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'Database is not reachable.' }, 503)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/health') {
          if (request.method !== 'GET') {
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

          return databaseHealth(env)
        }

        const authResponse = await handleAuthRequest(request, env)
        if (authResponse) {
          return authResponse
        }

        const adminResponse = await handleAdminRequest(request, env)
        if (adminResponse) {
          return adminResponse
        }

        const semesterResponse = await handleSemesterRequest(request, env)
        if (semesterResponse) {
          return semesterResponse
        }

        const scheduleResponse = await handleScheduleRequest(request, env)
        if (scheduleResponse) {
          return scheduleResponse
        }

        const activityResponse = await handleActivityRequest(request, env)
        if (activityResponse) {
          return activityResponse
        }

        const subjectResponse = await handleSubjectRequest(request, env)
        if (subjectResponse) {
          return subjectResponse
        }

        const conversionResponse = await handleConversionRequest(request, env)
        if (conversionResponse) {
          return conversionResponse
        }

        return json({ error: 'API route not found.' }, 404)
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ error: error.message }, error.status)
        }

        console.error('Unhandled API error:', error)
        return json(
          { error: 'Something went wrong. Please try again.' },
          500,
        )
      }
    }

    return env.ASSETS.fetch(request)
  },
}
