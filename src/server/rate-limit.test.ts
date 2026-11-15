import { describe, expect, it, vi } from 'vitest'
import { HttpError } from './http'
import {
  enforceAuthRateLimit,
  rateLimitKey,
  type RateLimitBinding,
} from './rate-limit'

function request(headers: Record<string, string> = {}): Request {
  const normalized = new Map(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  )

  return {
    headers: {
      get: (name: string) => normalized.get(name.toLowerCase()) ?? null,
    },
  } as unknown as Request
}

function limiterReturning(success: boolean) {
  const limit = vi.fn().mockResolvedValue({ success })
  return { binding: { limit } as RateLimitBinding, limit }
}

describe('auth rate limiting', () => {
  it('combines the scope, client IP, and subject into one key', () => {
    const key = rateLimitKey(
      request({ 'cf-connecting-ip': '203.0.113.7' }),
      'login',
      'orcam',
    )

    expect(key).toBe('login:203.0.113.7:orcam')
  })

  it('prefers the Cloudflare address, then the forwarded address, then a shared key', () => {
    expect(
      rateLimitKey(
        request({
          'cf-connecting-ip': '203.0.113.7',
          'x-forwarded-for': '198.51.100.4',
        }),
        'register',
      ),
    ).toBe('register:203.0.113.7')

    expect(
      rateLimitKey(
        request({ 'x-forwarded-for': '198.51.100.4, 10.0.0.1' }),
        'register',
      ),
    ).toBe('register:198.51.100.4')

    expect(rateLimitKey(request(), 'demo')).toBe('demo:unknown')
  })

  it('allows every request when the binding is not configured', async () => {
    await expect(
      enforceAuthRateLimit(undefined, request(), 'demo'),
    ).resolves.toBeUndefined()
  })

  it('allows a request below the limit and passes the composed key', async () => {
    const { binding, limit } = limiterReturning(true)

    await expect(
      enforceAuthRateLimit(
        binding,
        request({ 'cf-connecting-ip': '203.0.113.7' }),
        'register',
      ),
    ).resolves.toBeUndefined()

    expect(limit).toHaveBeenCalledWith({ key: 'register:203.0.113.7' })
  })

  it('throws a 429 with a retry hint when the limit is exceeded', async () => {
    const { binding } = limiterReturning(false)

    const error = await enforceAuthRateLimit(
      binding,
      request({ 'cf-connecting-ip': '203.0.113.7' }),
      'demo',
    ).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as HttpError).status).toBe(429)
    expect((error as HttpError).headers).toEqual({ 'Retry-After': '60' })
    expect((error as Error).message).toMatch(/too many attempts/i)
  })
})
