import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './api'

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

afterEach(() => {
  setNavigatorOnline(true)
  vi.restoreAllMocks()
})

describe('apiRequest offline guard', () => {
  it('rejects a write before touching the network while offline', async () => {
    setNavigatorOnline(false)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const result = apiRequest('/api/activities', { method: 'POST' })

    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({
      status: 0,
      message:
        'You are offline. Changes cannot be saved until the connection returns.',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('still allows reads while offline so cached data can load', async () => {
    setNavigatorOnline(false)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })))

    await expect(apiRequest('/api/semesters')).resolves.toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledOnce()
  })
})
