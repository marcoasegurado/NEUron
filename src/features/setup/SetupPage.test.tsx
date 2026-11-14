import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SetupPage } from './SetupPage'

const fetchMock = vi.fn()

const savedSemester = {
  semester: {
    id: 'semester-1',
    userId: 'user-1',
    academicYear: '2026-2027',
    term: '1st Semester',
    label: '1st Semester 2026-2027',
    isActive: true,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  },
  subjects: [],
}

function mockMediaQuery(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: desktop && query.includes('1024px'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/setup']}>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/home" element={<p>Home screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function setAcademicYear(
  user: ReturnType<typeof userEvent.setup>,
) {
  const yearInput = screen.getByLabelText('Academic year')
  await user.clear(yearInput)
  await user.type(yearInput, '2026-2027')
}

async function fillValidSubject(user: ReturnType<typeof userEvent.setup>) {
  // The step change can commit after the click resolves on a loaded machine,
  // and this suite runs under heavy parallel load, so wait generously.
  await user.type(
    await screen.findByLabelText('Subject name', {}, { timeout: 5000 }),
    'Mathematics',
  )
  await user.type(screen.getByLabelText('Units'), '3')
  await user.type(screen.getByLabelText('Category 1'), 'Quizzes')
  await user.type(screen.getByLabelText('Weight %'), '40')
  await user.click(screen.getByRole('button', { name: 'Add category' }))
  await user.type(screen.getByLabelText('Category 2'), 'Exams')
  await user.type(screen.getAllByLabelText('Weight %')[1], '60')
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    status: 201,
    text: async () => JSON.stringify(savedSemester),
  })
  vi.stubGlobal('fetch', fetchMock)
  mockMediaQuery(false)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SetupPage', () => {
  it('saves a phone three-step draft and shows the success state', async () => {
    const user = userEvent.setup()
    renderSetup()

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    await setAcademicYear(user)
    await user.click(screen.getByRole('button', { name: 'Continue to subjects' }))

    expect(
      await screen.findByRole('heading', { name: 'Subjects and weights' }),
    ).toBeInTheDocument()
    await fillValidSubject(user)
    expect(screen.getByText('Total: 100%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review semester' }))
    expect(screen.getByRole('heading', { name: 'Review and save' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save semester' }))

    expect(await screen.findByText('Semester saved')).toBeInTheDocument()
    expect(screen.getByText('1st Semester 2026-2027')).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/semesters')
    expect(init.method).toBe('POST')
    const payload = JSON.parse(init.body)
    expect(payload).toMatchObject({
      academicYear: '2026-2027',
      term: '1st Semester',
      subjects: [
        {
          name: 'Mathematics',
          units: 3,
          categories: [
            { name: 'Quizzes', weightPercent: 40 },
            { name: 'Exams', weightPercent: 60 },
          ],
        },
      ],
    })
  })

  it('blocks review while a subject does not total 100%', async () => {
    const user = userEvent.setup()
    renderSetup()

    await setAcademicYear(user)
    await user.click(screen.getByRole('button', { name: 'Continue to subjects' }))
    await fillValidSubject(user)
    const weightInputs = screen.getAllByLabelText('Weight %')
    await user.clear(weightInputs[1])
    await user.type(weightInputs[1], '50')

    expect(screen.getByText('Total: 90%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Review semester' }))

    expect(screen.getByText(/Weights total 90%/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review semester' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the desktop two-step layout', async () => {
    mockMediaQuery(true)
    const user = userEvent.setup()
    renderSetup()

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    await setAcademicYear(user)
    await user.click(screen.getByRole('button', { name: 'Continue to subjects' }))

    expect(
      await screen.findByRole('heading', { name: 'Subjects and weights' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save semester' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review semester' })).toBeNull()
  })
})
