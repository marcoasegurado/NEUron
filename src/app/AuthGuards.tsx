import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import styles from './AuthGuards.module.css'

export function AuthLoadingScreen() {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <span className={styles.mark} aria-hidden="true">
        N
      </span>
      <p className={styles.text}>Checking your session…</p>
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
