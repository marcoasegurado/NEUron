import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
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
import { SubjectsPage } from './SubjectsPage'

const fetchMock = vi.fn()

const semester: Semester = {
  id: 'semester-1',
  userId: 'user-1',
  academicYear: '2026-2027',
  term: '1st Semester',
  label: '1st Semester 2026-2027',
  isActive: true,
  createdAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T00:00:00.000Z',
}

function activity(
  id: string,
  categoryId: string,
  name: string,
  scoreEarned: number,
  totalPoints: number,
  date = '2026-11-08',
): Activity {
  return {
    id,
    categoryId,
    name,
    scoreEarned,
    totalPoints,
    date,
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
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories,
  }
}

const math = subject('subject-1', 'Mathematics', [
  category('quizzes', 'Quizzes', 40, [
    activity('q1', 'quizzes', 'Quiz 1', 80, 100, '2026-11-01'),
  ]),
  category('exams', 'Exams', 60, [
    activity('e1', 'exams', 'Final Exam', 100, 100),
  ]),
])

const science = subject('subject-2', 'Science', [
  category('science-quizzes', 'Science Quizzes', 100, []),
])

const setupData: SemesterSetup = {
  semester,
  subjects: [math, science],
}

function ok(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    text: async () => JSON.stringify(data),
    json: async () => data,
  }
}

function noContent() {
  return {
    ok: true,
    status: 204,
    text: async () => '',
    json: async () => ({}),
  }
}

function mockReady() {
  let subjects = setupData.subjects
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (url === '/api/semesters' && method === 'GET') {
      return Promise.resolve(ok({ semesters: [semester] }))
    }
    if (url === '/api/semesters/semester-1' && method === 'GET') {
      return Promise.resolve(ok({ ...setupData, subjects }))
    }
    if (
      url === '/api/semesters/semester-1/subjects' &&
      method === 'POST'
    ) {
      const input = JSON.parse(init?.body as string) as {
        name: string
        units: number
        professor: string | null
        categories: Array<{ name: string; weightPercent: number }>
      }
      const created: Subject = {
        id: 'subject-3',
        semesterId: 'semester-1',
        name: input.name,
        units: input.units,
        professor: input.professor,
        sortOrder: 2,
        createdAt: '2026-11-08T00:00:00.000Z',
        updatedAt: '2026-11-08T00:00:00.000Z',
        categories: input.categories.map((entry, index) => ({
          id: `created-category-${index}`,
          subjectId: 'subject-3',
          name: entry.name,
          weightPercent: entry.weightPercent,
          isActive: true,
          sortOrder: index,
          createdAt: '2026-11-08T00:00:00.000Z',
          updatedAt: '2026-11-08T00:00:00.000Z',
          activities: [],
        })),
      }
      subjects = [...subjects, created]
      return Promise.resolve(ok({ subject: created }, 201))
    }
    if (url === '/api/activities' && method === 'POST') {
      return Promise.resolve(
        ok(
          {
            activity: activity(
              'new-activity',
              'quizzes',
              'New Quiz',
              18,
              20,
            ),
          },
          201,
        ),
      )
    }
    if (url.startsWith('/api/activities/') && method === 'PATCH') {
      return Promise.resolve(
        ok({
          activity: activity('q1', 'quizzes', 'Quiz 1', 85, 100),
        }),
      )
    }
    if (url.startsWith('/api/activities/') && method === 'DELETE') {
      return Promise.resolve(noContent())
    }
    return Promise.reject(new Error(`Unexpected request: ${method} ${url}`))
  })
}

function renderSubjects() {
  return render(
    <MemoryRouter initialEntries={['/subjects']}>
      <Routes>
        <Route path="/subjects" element={<SubjectsPage />} />
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
})

describe('SubjectsPage', () => {
  it('shows the empty state when no semester is active', async () => {
    fetchMock.mockResolvedValue(ok({ semesters: [] }))
    renderSubjects()

    expect(await screen.findByText('No semester yet')).toBeInTheDocument()
    expect(screen.getByText('No active semester')).toBeInTheDocument()
  })

  it('starts collapsed and expands a subject into categories and scores', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    expect(await screen.findByText('Mathematics')).toBeInTheDocument()
    expect(
      screen.getByText('1st Semester 2026-2027 · 2 subjects'),
    ).toBeInTheDocument()
    expect(screen.getByText('92.00%')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Add score for Quizzes in Mathematics'),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /^Mathematics/ }),
    )

    const quizzes = within(
      screen.getAllByRole('region', { name: 'Quizzes' })[0],
    )
    expect(quizzes.getByText('40.00% of grade · 1 activity')).toBeInTheDocument()
    expect(quizzes.getAllByText('80.00%')).toHaveLength(2)
    expect(quizzes.getByText('Quiz 1')).toBeInTheDocument()
    expect(quizzes.getByText('Nov 1, 2026')).toBeInTheDocument()
    expect(quizzes.getByText('80.00 / 100.00')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Science/ }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the empty-score state for a category without activities', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Science')
    await user.click(screen.getByRole('button', { name: /^Science/ }))

    expect(
      screen.getByText(
        'No scores in this category yet. Add one to start its average.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('No scores yet')).toBeInTheDocument()
    expect(screen.getByText('No Grade Yet')).toBeInTheDocument()
  })

  it('adds a score to the chosen category with its defaults', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: /^Mathematics/ }))
    await user.click(
      screen.getByLabelText('Add score for Quizzes in Mathematics'),
    )

    expect(
      screen.getByRole('heading', { name: 'Add a score' }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Title'), 'Quiz 2')
    await user.type(screen.getByLabelText('Score'), '18')
    await user.type(screen.getByLabelText('Total items'), '20')
    await user.click(screen.getByRole('button', { name: 'Save score' }))

    expect(
      await screen.findByText(
        '“New Quiz” saved. Percentages recalculated.',
      ),
    ).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/activities' && init?.method === 'POST',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toMatchObject({
      subjectId: 'subject-1',
      categoryId: 'quizzes',
      name: 'Quiz 2',
      scoreEarned: 18,
      totalPoints: 20,
    })
  })

  it('edits a score without allowing a subject or category change', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: /^Mathematics/ }))
    await user.click(screen.getByLabelText('Edit Quiz 1'))

    expect(
      screen.getByRole('heading', { name: 'Edit score' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Subject')).toBeDisabled()
    expect(screen.getByLabelText('Category')).toBeDisabled()
    expect(screen.getByLabelText('Title')).toHaveValue('Quiz 1')
    expect(screen.getByLabelText('Score')).toHaveValue(80)

    await user.clear(screen.getByLabelText('Score'))
    await user.type(screen.getByLabelText('Score'), '85')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByText(
        '“Quiz 1” updated. Percentages recalculated.',
      ),
    ).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/activities/q1' && init?.method === 'PATCH',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toMatchObject({
      name: 'Quiz 1',
      scoreEarned: 85,
      totalPoints: 100,
      date: '2026-11-01',
    })
  })

  it('asks for confirmation before deleting a score', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: /^Mathematics/ }))
    await user.click(screen.getByLabelText('Delete Quiz 1'))

    expect(
      screen.getByRole('heading', { name: 'Delete this score?' }),
    ).toBeInTheDocument()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Quiz 1')).toBeInTheDocument()
    expect(
      dialog.getByText((_, element) =>
        Boolean(
          element?.tagName === 'P' &&
            element.textContent?.includes(
              '80.00 / 100.00 on Nov 1, 2026',
            ),
        ),
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete score' }))

    expect(
      await screen.findByText(
        '“Quiz 1” deleted. Percentages recalculated.',
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            url === '/api/activities/q1' && init?.method === 'DELETE',
        ),
      ).toBe(true)
    })
  })

  it('adds a subject and refreshes the list', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Subject' }))

    expect(
      screen.getByRole('heading', { name: 'Add subject' }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Subject name'), 'History')
    await user.type(screen.getByLabelText('Units'), '3')
    await user.type(screen.getByLabelText('Category 1'), 'Quizzes')
    await user.type(screen.getByLabelText('Weight %'), '100')
    await user.click(screen.getByRole('button', { name: 'Save subject' }))

    expect(
      await screen.findByText(
        '“History” added. Percentages recalculated.',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByText('History')).toBeInTheDocument()
    expect(
      screen.getByText('1st Semester 2026-2027 · 3 subjects'),
    ).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/semesters/semester-1/subjects' &&
        init?.method === 'POST',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toEqual({
      name: 'History',
      units: 3,
      professor: null,
      categories: [{ name: 'Quizzes', weightPercent: 100 }],
    })
  })

  it('blocks an incomplete or duplicate subject before saving', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSubjects()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Subject' }))
    await user.click(screen.getByRole('button', { name: 'Save subject' }))

    expect(
      screen.getByText('Enter the subject name.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Units must be greater than zero.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter the category name.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Use a weight from 0.01 to 100.'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Subject name'), 'Mathematics')
    await user.type(screen.getByLabelText('Units'), '3')
    await user.type(screen.getByLabelText('Category 1'), 'Quizzes')
    await user.type(screen.getByLabelText('Weight %'), '100')
    await user.click(screen.getByRole('button', { name: 'Save subject' }))

    expect(
      screen.getByText('Subject names must be unique.'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          url === '/api/semesters/semester-1/subjects' &&
          init?.method === 'POST',
      ),
    ).toBe(false)
  })
})
