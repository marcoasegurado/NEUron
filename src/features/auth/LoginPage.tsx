import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from './useAuth'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './PasswordInput'
import { authErrorMessage } from './messages'
import styles from './AuthForm.module.css'

interface FieldErrors {
  identifier?: string
  password?: string
}

function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from?: unknown }).from
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
      return from
    }
  }
  return '/home'
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const nextErrors: FieldErrors = {}
    if (!identifier.trim()) {
      nextErrors.identifier = 'Enter your email or username.'
    }
    if (!password) {
      nextErrors.password = 'Enter your password.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await login(identifier, password)
      navigate(redirectTarget(location.state), { replace: true })
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to keep tracking your semester."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Input
          label="Email or username"
          autoComplete="username"
          placeholder="you@example.com or username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={fieldErrors.identifier}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />

        <div className={styles.links}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
