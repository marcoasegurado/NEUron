import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '../../lib/cx'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Input({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={cx(styles.input, error && styles.invalid, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        {...rest}
      />
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
