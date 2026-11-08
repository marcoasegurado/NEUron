import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  stickyOnPhone?: boolean
  compactOnPhone?: boolean
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  stickyOnPhone = false,
  compactOnPhone = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cx(
        styles.header,
        stickyOnPhone && styles.sticky,
        compactOnPhone && styles.compact,
        className,
      )}
    >
      <div className={styles.copy}>
        <h1 className={styles.title}>{title}</h1>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
