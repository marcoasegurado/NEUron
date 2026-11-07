import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../features/auth/auth-context'
import { AuthContext } from '../features/auth/auth-context'
import { RequireAuth } from './AuthGuards'

function authValue(status: AuthContextValue['status']): AuthContextValue {
  return {
    user:
      status === 'authenticated'
        ? {
            id: 'user-1',
            email: 'student@example.com',
            displayName: 'Test Student',
          }
        : null,
    status,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }
}

function renderGuarded(status: AuthContextValue['status']) {
  return render(
    <AuthContext.Provider value={authValue(status)}>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<p>Private home</p>} />
          </Route>
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireAuth', () => {
  it('shows the session loading state', () => {
    renderGuarded('loading')
    expect(screen.getByText('Checking your session…')).toBeInTheDocument()
  })

  it('redirects anonymous visitors to login', () => {
    renderGuarded('anonymous')
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders protected content for authenticated users', () => {
    renderGuarded('authenticated')
    expect(screen.getByText('Private home')).toBeInTheDocument()
  })
})
