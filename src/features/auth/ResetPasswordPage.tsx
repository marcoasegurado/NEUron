import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui'
import { AuthLayout } from './AuthLayout'
import { resetPassword } from './api'
import { PasswordInput } from './PasswordInput'
import { authErrorMessage } from './messages'
import { useAuth } from './useAuth'
import styles from './AuthForm.module.css'

interface FieldErrors {
  password?: string
  confirmPassword?: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const nextErrors: FieldErrors = {}
    if (!password) {
      nextErrors.password = 'Enter a new password.'
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      await refresh()
      setDone(true)
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  const title = done
    ? 'Password updated'
    : token
      ? 'Set a new password'
      : 'Reset link problem'
  const description = done
    ? 'Your password has been changed and other sessions were signed out.'
    : token
      ? 'Choose a new password for your NEUron account.'
      : 'This reset link is missing or incomplete.'

  return (
    <AuthLayout
      title={title}
      description={description}
      footer={
        <p>
          {done ? (
            <Link to="/login">Sign in with your new password</Link>
          ) : (
            <>
              Need a new link? <Link to="/forgot-password">Request another</Link>
            </>
          )}
        </p>
      }
    >
      {done ? (
        <div className={styles.stack}>
          <p className={styles.success} role="status">
            You can now sign in with your new password.
          </p>
          <Button size="lg" block onClick={() => navigate('/login')}>
            Go to sign in
          </Button>
        </div>
      ) : !token ? (
        <div className={styles.stack}>
          <p className={styles.error} role="alert">
            Request a new password reset email to continue.
          </p>
          <Button
            size="lg"
            block
            onClick={() => navigate('/forgot-password')}
          >
            Request reset link
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
