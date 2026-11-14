import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../features/auth/auth-context'
import { AuthContext } from '../features/auth/auth-context'
import { AppShell } from './AppShell'

const authValue: AuthContextValue = {
  user: {
    id: 'user-1',
    email: 'student@example.com',
    displayName: 'Test Student',
  },
  status: 'authenticated',
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

function renderShell() {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/home" element={<p>Home content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

afterEach(() => {
  cleanup()
  setNavigatorOnline(true)
})

describe('AppShell offline banner', () => {
  it('stays hidden while online', () => {
    setNavigatorOnline(true)
    renderShell()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('appears when the connection drops and clears on reconnect', () => {
    setNavigatorOnline(true)
    renderShell()

    act(() => {
      setNavigatorOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(
      screen.getByText(
        'You are offline. Saved data is read-only until the connection returns.',
      ),
    ).toBeInTheDocument()

    act(() => {
      setNavigatorOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('AppShell boot veil', () => {
  it('removes the veil when the fade finishes', () => {
    renderShell()

    const veil = screen.getByTestId('boot-veil')
    fireEvent(veil, new Event('animationend', { bubbles: true }))

    expect(screen.queryByTestId('boot-veil')).not.toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('removes the veil even if the animation never runs', () => {
    vi.useFakeTimers()
    try {
      renderShell()
      expect(screen.getByTestId('boot-veil')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1200)
      })

      expect(screen.queryByTestId('boot-veil')).not.toBeInTheDocument()
      expect(screen.getByText('Home content')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
