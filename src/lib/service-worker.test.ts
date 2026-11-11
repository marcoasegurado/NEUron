import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearOfflineData, registerServiceWorker } from './service-worker'

type CacheStore = {
  keys: () => Promise<string[]>
  delete: (name: string) => Promise<boolean>
}

function installCaches(names: string[]) {
  const deleted: string[] = []
  const store: CacheStore = {
    keys: () => Promise.resolve([...names]),
    delete: (name: string) => {
      deleted.push(name)
      return Promise.resolve(true)
    },
  }

  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: store,
  })

  return deleted
}

afterEach(() => {
  Reflect.deleteProperty(window, 'caches')
  vi.restoreAllMocks()
})

describe('clearOfflineData', () => {
  it('deletes only the API caches', async () => {
    const deleted = installCaches([
      'neuming-api-v1',
      'neuming-shell-v1',
      'neuming-assets-v1',
    ])

    await clearOfflineData()

    expect(deleted).toEqual(['neuming-api-v1'])
  })

  it('does nothing when cache storage is unavailable', async () => {
    Reflect.deleteProperty(window, 'caches')
    await expect(clearOfflineData()).resolves.toBeUndefined()
  })

  it('swallows cache errors so sign-out still proceeds', async () => {
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: () => Promise.reject(new Error('blocked')),
        delete: () => Promise.resolve(true),
      },
    })

    await expect(clearOfflineData()).resolves.toBeUndefined()
  })
})

describe('registerServiceWorker', () => {
  it('does not register outside a production build', () => {
    const register = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    registerServiceWorker()

    expect(register).not.toHaveBeenCalled()
  })
})
