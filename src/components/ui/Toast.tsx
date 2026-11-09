import { useEffect, useRef } from 'react'
import styles from './Toast.module.css'

export interface ToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [message, duration])

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  )
}
