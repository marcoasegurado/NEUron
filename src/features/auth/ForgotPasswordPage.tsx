import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { AuthLayout } from './AuthLayout'
import { requestPasswordReset } from './api'
import { authErrorMessage } from './messages'
import styles from './AuthForm.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setFieldError('Enter your email address.')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    setFieldError(undefined)

    setSubmitting(true)
    try {
      const response = await requestPasswordReset(email)
      setMessage(response)
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={message ? 'Check your email' : 'Forgot password?'}
      description={
        message
          ? 'Password reset instructions are on the way.'
          : 'Enter your email and we will send a reset link.'
      }
      footer={
        <p>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {message ? (
        <div className={styles.stack}>
          <p className={styles.success} role="status">
            {message}
          </p>
          <Button size="lg" block onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            hint="Use the email on your account."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldError}
          />

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
