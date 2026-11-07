import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../lib/cx'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  trailing?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  trailing,
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
      <div className={styles.control}>
        <input
          id={inputId}
          className={cx(
            styles.input,
            trailing ? styles.inputWithTrailing : undefined,
            error && styles.invalid,
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...rest}
        />
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
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
