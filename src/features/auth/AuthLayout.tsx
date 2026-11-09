import type { ReactNode } from 'react'
import { CatMark } from '../../components/brand/CatMark'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <CatMark className={styles.brandMark} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>NEUming</span>
            <span className={styles.brandTag}>Grade Encoder</span>
          </div>
        </div>

        <div className={styles.brandCopy}>
          <p className={styles.eyebrow}>Your semester, in focus</p>
          <h1 className={styles.headline}>
            Know where every grade is headed.
          </h1>
          <p className={styles.tagline}>
            Track scores, weights, and GWA without losing the bigger picture.
          </p>
        </div>

        <div className={styles.mascotArea} aria-hidden="true">
          <CatMark className={styles.mascotMark} />
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <header className={styles.formHeader}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </header>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
