/*
 * NEUming service worker.
 *
 * Strategy (Phase 11 decisions):
 * - Read-only offline: the shell, static assets, and GET API responses are
 *   cached so grades, subjects, and the schedule stay viewable without a
 *   connection. Writes are blocked in the app, not queued here.
 * - Only the active semester's data is kept: the app clears the API cache
 *   whenever the active semester changes and on sign-out, so a shared device
 *   never shows another account's data.
 * - API responses are network-first, so online reads stay fresh; the cache is
 *   only a fallback.
 */

const VERSION = 'v1'
const SHELL_CACHE = `neuming-shell-${VERSION}`
const ASSET_CACHE = `neuming-assets-${VERSION}`
const API_CACHE = `neuming-api-${VERSION}`
const KEEP = new Set([SHELL_CACHE, ASSET_CACHE, API_CACHE])
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await Promise.all(
        SHELL_URLS.map((url) => cache.add(url).catch(() => undefined)),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => !KEEP.has(name))
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type

  if (type === 'CLEAR_API_CACHE') {
    event.waitUntil(caches.delete(API_CACHE))
  }

  if (type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
  }
})

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
  }
  return response
}

async function handleNavigation(request) {
  const cache = await caches.open(SHELL_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put('/index.html', response.clone())
    }
    return response
  } catch {
    const cached =
      (await cache.match('/index.html')) || (await cache.match('/'))
    if (cached) {
      return cached
    }

    return new Response(
      '<!doctype html><title>Offline</title><p>NEUming is offline and has not been saved on this device yet.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
}

async function handleApi(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(API_CACHE)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    return new Response(
      JSON.stringify({
        error:
          'You are offline and this data has not been saved on this device.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (url.pathname === '/api/health') {
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApi(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg'
  ) {
    event.respondWith(cacheFirst(request))
  }
})
