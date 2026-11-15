export class HttpError extends Error {
  status: number
  headers?: Record<string, string>

  constructor(
    status: number,
    message: string,
    headers?: Record<string, string>,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.headers = headers
  }
}

const MAX_BODY_BYTES = 16 * 1024

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get('Content-Length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request body is too large.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.')
  }

  return body as Record<string, unknown>
}

export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

export function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'Request origin is not allowed.')
  }
}
