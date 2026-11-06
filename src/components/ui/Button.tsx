import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  leading?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  leading,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <span>{children}</span>
    </button>
  )
}
