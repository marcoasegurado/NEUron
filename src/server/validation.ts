import { HttpError } from './http'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LENGTH = 254
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/
const NAME_MAX_LENGTH = 80
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function normalizeUsername(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function normalizeDisplayName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username)
}

export function requireEmail(value: unknown): string {
  const email = normalizeEmail(value)
  if (!email) {
    throw new HttpError(400, 'Enter your email address.')
  }
  if (!isValidEmail(email)) {
    throw new HttpError(400, 'Enter a valid email address.')
  }
  return email
}

export function requireUsername(value: unknown): string {
  const username = normalizeUsername(value)
  if (!username) {
    throw new HttpError(400, 'Enter a username.')
  }
  if (!isValidUsername(username)) {
    throw new HttpError(
      400,
      'Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.',
    )
  }
  return username
}

export function requireDisplayName(value: unknown): string {
  const displayName = normalizeDisplayName(value)
  if (!displayName) {
    throw new HttpError(400, 'Enter your display name.')
  }
  if (displayName.length > NAME_MAX_LENGTH) {
    throw new HttpError(
      400,
      `Display name must be ${NAME_MAX_LENGTH} characters or fewer.`,
    )
  }
  return displayName
}

export function requirePassword(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new HttpError(400, 'Enter your password.')
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(
      400,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    throw new HttpError(
      400,
      `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`,
    )
  }
  return value
}

export { PASSWORD_MIN_LENGTH }
