import type { ReactNode } from 'react'
import { CatMascot } from '../../components/brand/CatMascot'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

const features = [
  'Custom grading for every subject',
  'Instant 1.0 to 5.0 grade conversion',
  'Works on phone, tablet and desktop',
]

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.mascotHalo}>
            <CatMascot className={styles.mascot} />
          </div>

          <p className={styles.wordmark} aria-label="NEUming">
            <span className={styles.wordmarkNeu}>NEU</span>
            <span className={styles.wordmarkMing}>ming</span>
          </p>

          <p className={styles.tagline}>Your grades, always in sight.</p>
          <p className={styles.statement}>
            Track every quiz, exam and project, and always know where you
            stand.
          </p>

          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature} className={styles.feature}>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <header className={styles.formHeader}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </header>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
