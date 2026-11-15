import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import type { AuthContextValue } from './auth-context'
import { AuthContext } from './auth-context'
import { LoginPage } from './LoginPage'

function renderPage(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<p>Register screen</p>} />
          <Route path="/home" element={<p>Home screen</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'anonymous',
    login: vi.fn(),
    demoLogin: vi.fn().mockResolvedValue({
      id: 'demo',
      email: 'demo@neuron.local',
      displayName: 'Demo Student',
      role: 'student',
      isDemo: true,
    }),
    logout: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
})

describe('login page', () => {
  it('offers a one-click demo and a link to registration', async () => {
    const user = userEvent.setup()
    const value = authValue()
    renderPage(value)

    expect(screen.getByText('Try the demo')).toBeInTheDocument()
    expect(
      screen.getByText('Explore NEUming with shared sample data. No account needed.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    )

    await user.click(screen.getByRole('button', { name: 'Try the demo' }))

    expect(value.demoLogin).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('surfaces a pending-approval rejection from the login API', async () => {
    const user = userEvent.setup()
    const message = 'Your account is waiting for owner approval.'
    const value = authValue({
      login: vi.fn().mockRejectedValue(new ApiError(message, 403)),
    })
    renderPage(value)

    await user.type(screen.getByLabelText('Email or username'), 'ada.student')
    await user.type(screen.getByLabelText('Password'), 'Approval-2026')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })

  it('shows the rate-limit message when too many attempts are made', async () => {
    const user = userEvent.setup()
    const message = 'Too many attempts. Wait a minute, then try again.'
    const value = authValue({
      login: vi.fn().mockRejectedValue(new ApiError(message, 429)),
    })
    renderPage(value)

    await user.type(screen.getByLabelText('Email or username'), 'ada.student')
    await user.type(screen.getByLabelText('Password'), 'Approval-2026')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })
})
