import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  isValidUsername,
  normalizeDisplayName,
  normalizeEmail,
  normalizeUsername,
  requireDisplayName,
  requireEmail,
  requirePassword,
  requireUsername,
} from './validation'

describe('email validation', () => {
  it('accepts any valid email address', () => {
    expect(isValidEmail('student@neu.edu.ph')).toBe(true)
    expect(isValidEmail('student@gmail.com')).toBe(true)
    expect(isValidEmail('first.last@example.com')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('student@example')).toBe(false)
    expect(isValidEmail('student')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('student@.com')).toBe(false)
    expect(isValidEmail('student @example.com')).toBe(false)
  })

  it('normalizes email casing and whitespace', () => {
    expect(normalizeEmail('  Student@Example.COM ')).toBe('student@example.com')
  })

  it('requires a valid email', () => {
    expect(requireEmail('Student@Example.COM')).toBe('student@example.com')
    expect(() => requireEmail('student@example')).toThrow(
      'Enter a valid email address.',
    )
  })
})

describe('username validation', () => {
  it('normalizes and accepts valid usernames', () => {
    expect(normalizeUsername('  Marco.Odaru ')).toBe('marco.odaru')
    expect(isValidUsername('marco')).toBe(true)
    expect(isValidUsername('marco_odaru-01')).toBe(true)
  })

  it('rejects usernames that are too short, too long, or invalid', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('a'.repeat(33))).toBe(false)
    expect(isValidUsername('marco odaru')).toBe(false)
    expect(isValidUsername('marco@example.com')).toBe(false)
  })

  it('requires a valid username', () => {
    expect(requireUsername(' Marco ')).toBe('marco')
    expect(() => requireUsername('m')).toThrow(
      'Username must be 3-32 characters',
    )
  })
})

describe('display name and password validation', () => {
  it('collapses whitespace in display names', () => {
    expect(normalizeDisplayName('  Marco   Odaru  ')).toBe('Marco Odaru')
  })

  it('requires a display name', () => {
    expect(() => requireDisplayName('   ')).toThrow('Enter your display name.')
    expect(requireDisplayName('  Marco  ')).toBe('Marco')
  })

  it('enforces the password length range', () => {
    expect(requirePassword('12345678')).toBe('12345678')
    expect(() => requirePassword('short')).toThrow(
      'Password must be at least 8 characters.',
    )
    expect(() => requirePassword('a'.repeat(129))).toThrow(
      'Password must be 128 characters or fewer.',
    )
  })
})
