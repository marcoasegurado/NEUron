import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '../../lib/cx'
import styles from './Select.module.css'

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export function Select({
  label,
  hint,
  error,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const messageId = `${selectId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <div className={styles.control}>
        <select
          id={selectId}
          className={cx(styles.select, error && styles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...rest}
        >
          {children}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </div>
      {hasMessage ? (
        <p
          id={messageId}
          className={cx(styles.message, error && styles.error)}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
}
