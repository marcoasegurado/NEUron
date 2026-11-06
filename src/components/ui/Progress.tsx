import { cx } from '../../lib/cx'
import styles from './Progress.module.css'

export interface ProgressProps {
  value: number
  label: string
  tone?: 'primary' | 'gold'
  className?: string
}

export function Progress({
  value,
  label,
  tone = 'primary',
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cx(styles.wrapper, className)}>
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{Math.round(clamped)}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
      >
        <div
          className={cx(styles.fill, styles[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
