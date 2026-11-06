import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './Badge.module.css'

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'gold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'pending'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)} {...rest}>
      {children}
    </span>
  )
}
