import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './PasswordInput'
import { registerRequest } from './api'
import { authErrorMessage } from './messages'
import styles from './AuthForm.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/

interface FieldValues {
  displayName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof FieldValues, string>>

const EMPTY_VALUES: FieldValues = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function validate(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {}
  const displayName = values.displayName.trim().replace(/\s+/g, ' ')
  const username = values.username.trim().toLowerCase()
  const email = values.email.trim().toLowerCase()

  if (!displayName) {
    errors.displayName = 'Enter your display name.'
  } else if (displayName.length > 80) {
    errors.displayName = 'Use 80 characters or fewer.'
  }

  if (!username) {
    errors.username = 'Choose a username.'
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      'Use 3–32 letters, numbers, dots, underscores, or hyphens.'
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Choose a password.'
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  } else if (values.password.length > 128) {
    errors.password = 'Use 128 characters or fewer.'
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<FieldValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof FieldValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const nextErrors = validate(values)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const response = await registerRequest({
        displayName: values.displayName.trim().replace(/\s+/g, ' '),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
      setMessage(response)
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  if (message) {
    return (
      <AuthLayout
        title="Request received"
        description="The NEUming owner reviews every new account before it can log in."
        footer={
          <p>
            Already approved? <Link to="/login">Back to sign in</Link>
          </p>
        }
      >
        <div className={styles.stack}>
          <p className={styles.success} role="status">
            {message}
          </p>
          <Button size="lg" block onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Request access. The NEUming owner approves every new account before it can log in."
      footer={
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Input
          label="Display name"
          autoComplete="name"
          placeholder="Your name"
          value={values.displayName}
          onChange={(event) => update('displayName', event.target.value)}
          error={fieldErrors.displayName}
        />

        <Input
          label="Username"
          autoComplete="username"
          placeholder="yourname"
          hint="Letters, numbers, dots, underscores, or hyphens."
          value={values.username}
          onChange={(event) => update('username', event.target.value)}
          error={fieldErrors.username}
        />

        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={fieldErrors.email}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={(event) => update('password', event.target.value)}
          error={fieldErrors.password}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={values.confirmPassword}
          onChange={(event) => update('confirmPassword', event.target.value)}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting ? 'Sending request…' : 'Request account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
