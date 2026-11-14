import type { CSSProperties } from 'react'
import { cx } from '../../lib/cx'
import styles from './Skeleton.module.css'

export interface SkeletonProps {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  radius?: CSSProperties['borderRadius']
  className?: string
}

/**
 * A single shimmering placeholder bar. Always hidden from assistive tech; the
 * surrounding page skeleton owns the `role="status"` announcement.
 */
export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  )
}
