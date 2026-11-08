import { useEffect, useState } from 'react'

const PHONE_QUERY = '(max-width: 639px)'

/**
 * Tracks whether the viewport is phone-sized and the page has been scrolled
 * past the threshold. Used to collapse sticky page headers on phones.
 */
export function usePhoneScrolled(threshold = 64): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const media = window.matchMedia(PHONE_QUERY)

    function update() {
      setScrolled(media.matches && window.scrollY > threshold)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
    } else {
      media.addListener(update)
    }

    return () => {
      window.removeEventListener('scroll', update)
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', update)
      } else {
        media.removeListener(update)
      }
    }
  }, [threshold])

  return scrolled
}
