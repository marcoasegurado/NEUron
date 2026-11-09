import { ApiError } from '../../lib/api'

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'We could not reach NEUming. Check your connection and try again.'
}
