import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CatMascot } from '../components/brand/CatMascot'
import { useAuth } from '../features/auth/useAuth'
import styles from './AuthGuards.module.css'

export function AuthLoadingScreen() {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.lockup}>
        <CatMascot className={styles.mascot} />
        <span className={styles.wordmark} aria-hidden="true">
          <span className={styles.brandNeu}>NEU</span>
          <span className={styles.brandMing}>ming</span>
        </span>
        <p className={styles.text}>Checking your session…</p>
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'anonymous') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

export function PublicOnly() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'authenticated') {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
