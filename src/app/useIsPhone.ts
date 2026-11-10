import { useEffect, useState } from 'react'

export const PHONE_QUERY = '(max-width: 639px)'

/**
 * Tracks whether the viewport is phone-sized. Components use this to render
 * the dedicated phone layout without duplicating hidden markup.
 */
export function useIsPhone(query: string = PHONE_QUERY): boolean {
  const [isPhone, setIsPhone] = useState(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const media = window.matchMedia(query)
    const update = () => setIsPhone(media.matches)

    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
    } else {
      media.addListener(update)
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', update)
      } else {
        media.removeListener(update)
      }
    }
  }, [query])

  return isPhone
}
