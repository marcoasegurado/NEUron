import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  Activity,
  GradingCategory,
  Semester,
  SemesterSetup,
  Subject,
} from '../../lib/academic-api'
import { localToday } from '../activities/score-form'
import { HomePage } from './HomePage'

const fetchMock = vi.fn()

const semesterOne: Semester = {
  id: 'semester-1',
  userId: 'user-1',
  academicYear: '2026-2027',
  term: '1st Semester',
  label: '1st Semester 2026-2027',
  isActive: true,
  createdAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T00:00:00.000Z',
}

const semesterTwo: Semester = {
  ...semesterOne,
  id: 'semester-2',
  term: '2nd Semester',
  label: '2nd Semester 2026-2027',
  isActive: false,
}

function activity(
  id: string,
  categoryId: string,
  scoreEarned: number,
  totalPoints: number,
): Activity {
  return {
    id,
    categoryId,
    name: id,
    scoreEarned,
    totalPoints,
    date: '2026-11-08',
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }
}

function category(
  id: string,
  name: string,
  weightPercent: number,
  activities: Activity[],
): GradingCategory {
  return {
    id,
    subjectId: 'subject-1',
    name,
    weightPercent,
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    activities,
  }
}

function subject(
  id: string,
  name: string,
  categories: GradingCategory[],
): Subject {
  return {
    id,
    semesterId: 'semester-1',
    name,
    units: 3,
    professor: null,
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories,
  }
}

const mathSubject = subject('subject-1', 'Mathematics', [
  category('quizzes', 'Quizzes', 40, [activity('q1', 'quizzes', 80, 100)]),
  category('exams', 'Exams', 60, [activity('e1', 'exams', 100, 100)]),
])

const scienceSubject = subject('subject-2', 'Science', [
  category('science-quizzes', 'Quizzes', 100, []),
])

const setupOne: SemesterSetup = {
  semester: semesterOne,
  subjects: [mathSubject, scienceSubject],
}

const setupTwo: SemesterSetup = {
  semester: semesterTwo,
  subjects: [mathSubject],
}

function ok(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    text: async () => JSON.stringify(data),
  }
}

function mockReady(
  semesters: Semester[] = [semesterOne],
  setups: Record<string, SemesterSetup> = { 'semester-1': setupOne },
) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/semesters' && (!init || init.method === undefined)) {
      return Promise.resolve(ok({ semesters }))
    }
    if (url === '/api/semesters' && init?.method === 'POST') {
      return Promise.resolve(ok(setupOne, 201))
    }
    if (url === '/api/activities') {
      return Promise.resolve(
        ok(
          {
            activity: activity('new-activity', 'quizzes', 18, 20),
          },
          201,
        ),
      )
    }
    if (url.endsWith('/activate')) {
      const id = url.split('/')[3]
      return Promise.resolve(ok({ semester: { ...semesterOne, id } }))
    }
    const id = url.split('/')[3]
    return Promise.resolve(ok(setups[id]))
  })
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/setup" element={<p>Setup screen</p>} />
      </Routes>
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
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 0,
  })
})

describe('HomePage', () => {
  it('shows the empty state when no semester is active', async () => {
    fetchMock.mockResolvedValue(ok({ semesters: [] }))
    renderHome()

    expect(await screen.findByText('No semester yet')).toBeInTheDocument()
    expect(screen.getByText('No active semester')).toBeInTheDocument()
  })

  it('shows exact percentages, pending grades, and incomplete categories', async () => {
    mockReady()
    renderHome()

    expect(await screen.findByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('92.00%')).toBeInTheDocument()
    expect(screen.getByText('Add scores for Quizzes.')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 categories scored')).toBeInTheDocument()
    expect(screen.getByText('0 of 1 categories scored')).toBeInTheDocument()
    expect(screen.getAllByText('Grade Pending').length).toBeGreaterThan(1)
    expect(screen.getByText('No Grade Yet')).toBeInTheDocument()
    expect(screen.getByText('Semester GWA')).toBeInTheDocument()
    expect(screen.getByText('GWA Pending')).toBeInTheDocument()
    expect(
      screen.getByText('Waiting on grades for Science.'),
    ).toBeInTheDocument()
  })

  it('validates the Add Score form before sending a request', async () => {
    mockReady()
    const user = userEvent.setup()
    renderHome()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Score' }))

    expect(
      screen.getByRole('heading', { name: 'Add a score' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save score' }))

    expect(screen.getByText('Enter an activity name.')).toBeInTheDocument()
    expect(
      screen.getByText('Enter an earned score of zero or greater.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter total points greater than zero.'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([url]) => url === '/api/activities'),
    ).toBe(false)
  })

  it('saves a score with the default subject, category, and today date', async () => {
    mockReady()
    const user = userEvent.setup()
    renderHome()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Score' }))
    await user.type(screen.getByLabelText('Title'), 'Quiz 2')
    await user.type(screen.getByLabelText('Score'), '18')
    await user.type(screen.getByLabelText('Total items'), '20')
    await user.click(screen.getByRole('button', { name: 'Save score' }))

    expect(await screen.findByText('“new-activity” saved.')).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url]) => url === '/api/activities',
    )
    expect(call).toBeDefined()
    const body = JSON.parse(call?.[1]?.body as string)
    expect(body).toEqual({
      subjectId: 'subject-1',
      categoryId: 'quizzes',
      name: 'Quiz 2',
      scoreEarned: 18,
      totalPoints: 20,
      date: localToday(),
    })
  })

  it('renders the phone home layout with a floating Add score button', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    mockReady()
    const user = userEvent.setup()
    renderHome()

    await screen.findByText('Mathematics')
    expect(
      screen.getByRole('heading', { name: 'Current grades' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Semester')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Home' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add score' }))
    expect(
      screen.getByRole('heading', { name: 'Add a score' }),
    ).toBeInTheDocument()
  })

  it('activates a semester selected from the switcher', async () => {
    mockReady([semesterOne, semesterTwo], {
      'semester-1': setupOne,
      'semester-2': setupTwo,
    })
    const user = userEvent.setup()
    renderHome()

    await screen.findByText('Mathematics')
    await user.click(screen.getByLabelText('Semester'))
    await user.click(
      await screen.findByRole('option', { name: '2nd Semester 2026-2027' }),
    )

    expect(
      await screen.findByText('2nd Semester 2026-2027 · 1 subject'),
    ).toBeInTheDocument()

    const activation = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/semesters/semester-2/activate' &&
        init?.method === 'POST',
    )
    expect(activation).toBeDefined()

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) => url === '/api/semesters/semester-2',
        ),
      ).toBe(true)
    })
  })
})
