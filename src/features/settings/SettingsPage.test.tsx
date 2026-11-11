import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/auth-context'
import type { Semester } from '../../lib/academic-api'
import { SettingsPage } from './SettingsPage'

const fetchMock = vi.fn()

function semester(
  id: string,
  label: string,
  isActive: boolean,
  units: number,
  subjectCount: number,
): Semester {
  return {
    id,
    userId: 'user-1',
    academicYear: '2026-2027',
    term: label.split(' ').slice(0, 2).join(' '),
    label,
    isActive,
    units,
    subjectCount,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }
}

function ok(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    text: async () => JSON.stringify(data),
    json: async () => data,
  }
}

function renderPage(logout = vi.fn()) {
  const auth: AuthContextValue = {
    user: {
      id: 'user-1',
      email: 'student@neu.edu.ph',
      displayName: 'Ada Student',
    },
    status: 'authenticated',
    login: vi.fn(),
    logout,
    refresh: vi.fn(),
  }

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function mockSettings({
  semesters,
  conversion,
}: {
  semesters: Semester[]
  conversion: {
    rows: Array<{ minimumPercentage: number; grade: number }>
    configured: boolean
    valid: boolean
    errors: string[]
  }
}) {
  let current = semesters

  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'

    if (url === '/api/semesters' && method === 'GET') {
      return Promise.resolve(ok({ semesters: current }))
    }

    if (url === '/api/settings/conversion' && method === 'GET') {
      return Promise.resolve(ok(conversion))
    }

    if (
      url === '/api/semesters/semester-1/activate' &&
      method === 'POST'
    ) {
      current = current.map((entry) => ({
        ...entry,
        isActive: entry.id === 'semester-1',
      }))
      const activated = current.find((entry) => entry.id === 'semester-1')
      return Promise.resolve(ok({ semester: activated }))
    }

    return Promise.reject(new Error(`Unexpected request: ${method} ${url}`))
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('settings page', () => {
  it('lists semesters with stats and marks the active one', async () => {
    mockSettings({
      semesters: [
        semester('semester-1', '2nd Semester 2026-2027', false, 21, 6),
        semester('semester-2', '1st Semester 2026-2027', true, 18, 5),
      ],
      conversion: {
        rows: [
          { minimumPercentage: 95, grade: 1.25 },
          { minimumPercentage: 0, grade: 5 },
        ],
        configured: true,
        valid: true,
        errors: [],
      },
    })

    renderPage()

    expect(
      await screen.findByText('2nd Semester 2026-2027'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2nd Semester · 21 units · 6 subjects'),
    ).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Switch to 2nd Semester 2026-2027',
      }),
    ).toBeInTheDocument()
  })

  it('renders the read-only grade scale from the shared table', async () => {
    mockSettings({
      semesters: [semester('semester-2', '1st Semester 2026-2027', true, 18, 5)],
      conversion: {
        rows: [
          { minimumPercentage: 0, grade: 5 },
          { minimumPercentage: 95, grade: 1.25 },
        ],
        configured: true,
        valid: true,
        errors: [],
      },
    })

    renderPage()

    expect(await screen.findByText('≥ 95.00%')).toBeInTheDocument()
    expect(screen.getByText('1.25')).toBeInTheDocument()
    expect(screen.getByText('Managed by the NEUming owner.')).toBeInTheDocument()
  })

  it('shows the not-configured state instead of invented thresholds', async () => {
    mockSettings({
      semesters: [semester('semester-2', '1st Semester 2026-2027', true, 18, 5)],
      conversion: {
        rows: [],
        configured: false,
        valid: false,
        errors: [],
      },
    })

    renderPage()

    expect(
      await screen.findByText('Official NEU thresholds not set'),
    ).toBeInTheDocument()
  })

  it('switches semesters after confirmation and refreshes the list', async () => {
    const user = userEvent.setup()

    mockSettings({
      semesters: [
        semester('semester-1', '2nd Semester 2026-2027', false, 21, 6),
        semester('semester-2', '1st Semester 2026-2027', true, 18, 5),
      ],
      conversion: {
        rows: [],
        configured: false,
        valid: false,
        errors: [],
      },
    })

    renderPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Switch to 2nd Semester 2026-2027',
      }),
    )

    expect(
      screen.getByText(
        'Switch to 2nd Semester 2026-2027? Home, Subjects, and Schedule will show this semester.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch semester' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/semesters/semester-1/activate',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    expect(
      await screen.findByText('Switched to 2nd Semester 2026-2027.'),
    ).toBeInTheDocument()
  })

  it('shows the account identity and signs out', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockResolvedValue(undefined)

    mockSettings({
      semesters: [semester('semester-2', '1st Semester 2026-2027', true, 18, 5)],
      conversion: {
        rows: [],
        configured: false,
        valid: false,
        errors: [],
      },
    })

    renderPage(logout)

    expect(await screen.findByText('Ada Student')).toBeInTheDocument()
    expect(screen.getByText('student@neu.edu.ph')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(logout).toHaveBeenCalled()
    })
  })
})
