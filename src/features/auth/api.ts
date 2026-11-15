import { ApiError, apiRequest } from '../../lib/api'

export type AccountRole = 'student' | 'owner'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: AccountRole
  isDemo: boolean
}

export interface RegisterInput {
  email: string
  username: string
  displayName: string
  password: string
}

interface UserResponse {
  user: AuthUser
}

interface MessageResponse {
  ok: boolean
  message?: string
}

function jsonBody(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

export async function loginRequest(
  identifier: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiRequest<UserResponse>(
    '/api/auth/login',
    jsonBody({ identifier, password }),
  )
  return response.user
}

export async function demoLoginRequest(): Promise<AuthUser> {
  const response = await apiRequest<UserResponse>(
    '/api/auth/demo',
    jsonBody({}),
  )
  return response.user
}

export async function registerRequest(
  input: RegisterInput,
): Promise<string> {
  const response = await apiRequest<MessageResponse>(
    '/api/auth/register',
    jsonBody(input),
  )
  return (
    response.message ??
    'Your account request is in. The NEUming owner will review it.'
  )
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest<UserResponse>('/api/auth/me')
    return response.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<string> {
  const response = await apiRequest<MessageResponse>(
    '/api/auth/forgot-password',
    jsonBody({ email }),
  )
  return (
    response.message ??
    'If an account exists for that email, a reset link has been sent.'
  )
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiRequest<MessageResponse>(
    '/api/auth/reset-password',
    jsonBody({ token, password }),
  )
}
