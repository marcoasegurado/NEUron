import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import styles from './Modal.module.css'

export interface ModalProps {
  title: string
  description?: string
  leading?: ReactNode
  hideClose?: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  title,
  description,
  leading,
  hideClose = false,
  onClose,
  children,
  className,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = dialog?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialog) {
        return
      }

      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      )
      if (nodes.length === 0) {
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = bodyOverflow
      previous?.focus()
    }
  }, [])

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={cx(styles.dialog, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className={styles.head}>
          <div className={styles.headMain}>
            {leading ? (
              <div className={styles.leading}>{leading}</div>
            ) : null}
            <div className={styles.copy}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {hideClose ? null : (
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
