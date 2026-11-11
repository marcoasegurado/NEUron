const API_CACHE_PREFIX = 'neuming-api-'

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) {
    return
  }
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is optional; the app keeps working online.
    })
  })
}

/**
 * Drops cached API responses so a shared device cannot show another account's
 * grades. Called on sign-out and whenever the active semester changes, which
 * keeps the offline cache limited to the semester in view.
 */
export async function clearOfflineData(): Promise<void> {
  if (!('caches' in window)) {
    return
  }

  try {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => name.startsWith(API_CACHE_PREFIX))
        .map((name) => caches.delete(name)),
    )
  } catch {
    // Cache storage can be unavailable in private mode; offline data is
    // disposable, so failing here must not block sign-out or switching.
  }
}
