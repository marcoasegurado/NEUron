export interface ApiErrorBody {
  error?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    let message = 'The request could not be completed.'

    try {
      const body = (await response.json()) as ApiErrorBody
      if (body.error) {
        message = body.error
      }
    } catch {
      // Keep the fallback message when the response is not JSON.
    }

    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}

export interface DatabaseHealth {
  ok: boolean
}

export function getDatabaseHealth(): Promise<DatabaseHealth> {
  return apiRequest<DatabaseHealth>('/api/health')
}
