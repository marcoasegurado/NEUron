import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const fetchMock = vi.fn()

function response(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
    json: async () => data,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('register page', () => {
  it('blocks submission until the fields are valid', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Request account' }))

    expect(screen.getByText('Enter your display name.')).toBeInTheDocument()
    expect(screen.getByText('Choose a username.')).toBeInTheDocument()
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Choose a password.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a normalized request and shows the approval message', async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          ok: true,
          message:
            'Your account request is in. The NEUming owner will review it, then you can log in.',
        },
        201,
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Display name'), '  Ada   Student ')
    await user.type(screen.getByLabelText('Username'), 'Ada.Student')
    await user.type(screen.getByLabelText('Email'), 'ADA@NEU.EDU.PH')
    await user.type(screen.getByLabelText('Password'), 'Approval-2026')
    await user.type(screen.getByLabelText('Confirm password'), 'Approval-2026')
    await user.click(screen.getByRole('button', { name: 'Request account' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      displayName: 'Ada Student',
      username: 'ada.student',
      email: 'ada@neu.edu.ph',
      password: 'Approval-2026',
    })

    expect(
      await screen.findByText(
        'Your account request is in. The NEUming owner will review it, then you can log in.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a taken-account error without losing the form', async () => {
    fetchMock.mockResolvedValue(
      response({ error: 'That username is already taken.' }, 409),
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Display name'), 'Ada Student')
    await user.type(screen.getByLabelText('Username'), 'ada.student')
    await user.type(screen.getByLabelText('Email'), 'ada@neu.edu.ph')
    await user.type(screen.getByLabelText('Password'), 'Approval-2026')
    await user.type(screen.getByLabelText('Confirm password'), 'Approval-2026')
    await user.click(screen.getByRole('button', { name: 'Request account' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('That username is already taken.')
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })
})
