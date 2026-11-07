interface D1PreparedStatementLike {
  first<T>(): Promise<T | null>
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
}

interface AssetFetcher {
  fetch(request: Request): Promise<Response>
}

interface Env {
  DB: D1DatabaseLike
  ASSETS: AssetFetcher
}

async function databaseHealth(env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()

    if (row?.ok !== 1) {
      return Response.json(
        { ok: false, error: 'Unexpected database response.' },
        { status: 503 },
      )
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json(
      { ok: false, error: 'Database is not reachable.' },
      { status: 503 },
    )
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') {
        return Response.json(
          { ok: false, error: 'Method not allowed.' },
          { status: 405, headers: { Allow: 'GET' } },
        )
      }

      return databaseHealth(env)
    }

    return env.ASSETS.fetch(request)
  },
}
