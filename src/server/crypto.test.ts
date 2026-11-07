import { describe, expect, it } from 'vitest'
import {
  createId,
  createToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './crypto'

describe('password hashing', () => {
  it('verifies the correct password', async () => {
    const stored = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(
      true,
    )
  })

  it('rejects an incorrect password', async () => {
    const stored = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('wrong password', stored)).toBe(false)
  })

  it('uses a unique salt for every hash', async () => {
    const first = await hashPassword('same password')
    const second = await hashPassword('same password')
    expect(first).not.toBe(second)
    expect(await verifyPassword('same password', first)).toBe(true)
    expect(await verifyPassword('same password', second)).toBe(true)
  })

  it('rejects malformed stored hashes', async () => {
    expect(await verifyPassword('password', 'not-a-hash')).toBe(false)
    expect(
      await verifyPassword('password', 'pbkdf2-sha256$0$abc$def'),
    ).toBe(false)
  })
})

describe('tokens and ids', () => {
  it('creates unique URL-safe tokens', () => {
    const first = createToken()
    const second = createToken()
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('hashes tokens consistently', async () => {
    const token = createToken()
    expect(await hashToken(token)).toBe(await hashToken(token))
  })

  it('creates unique ids', () => {
    expect(createId()).not.toBe(createId())
  })
})
