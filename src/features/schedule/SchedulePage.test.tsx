import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  ScheduleClass,
  Semester,
  SemesterSetup,
  Subject,
} from '../../lib/academic-api'
import { SchedulePage } from './SchedulePage'

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

function subject(id: string, name: string): Subject {
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
    categories: [],
  }
}

const subjects = [subject('subject-1', 'Mathematics'), subject('subject-2', 'Science')]

const setup: SemesterSetup = {
  semester,
  subjects,
}

function scheduleClass(
  id: string,
  subjectId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  room: string | null = null,
): ScheduleClass {
  return {
    id,
    semesterId: 'semester-1',
    subjectId,
    dayOfWeek,
    startTime,
    endTime,
    room,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }
}

const mathClass = scheduleClass(
  'class-1',
  'subject-1',
  1,
  '09:00',
  '10:00',
  'Lab 1',
)
const scienceClass = scheduleClass(
  'class-2',
  'subject-2',
  3,
  '13:00',
  '14:30',
)

function ok(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    text: async () => JSON.stringify(data),
  }
}

function noContent() {
  return {
    ok: true,
    status: 204,
    text: async () => '',
  }
}

function mockReady(classes: ScheduleClass[] = [mathClass, scienceClass]) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'

    if (url === '/api/semesters') {
      return Promise.resolve(ok({ semesters: [semester] }))
    }
    if (url === '/api/semesters/semester-1/schedule') {
      return Promise.resolve(ok({ classes }))
    }
    if (url === '/api/semesters/semester-1') {
      return Promise.resolve(ok(setup))
    }
    if (url === '/api/schedule' && method === 'POST') {
      const body = JSON.parse(init?.body as string)
      return Promise.resolve(
        ok(
          {
            class: scheduleClass(
              'class-new',
              body.subjectId,
              body.dayOfWeek,
              body.startTime,
              body.endTime,
              body.room,
            ),
          },
          201,
        ),
      )
    }
    if (url.startsWith('/api/schedule/') && method === 'PATCH') {
      const body = JSON.parse(init?.body as string)
      return Promise.resolve(
        ok({
          class: scheduleClass(
            url.split('/')[3],
            body.subjectId,
            body.dayOfWeek,
            body.startTime,
            body.endTime,
            body.room,
          ),
        }),
      )
    }
    if (url.startsWith('/api/schedule/') && method === 'DELETE') {
      return Promise.resolve(noContent())
    }

    return Promise.resolve(ok({}))
  })
}

function renderSchedule() {
  return render(
    <MemoryRouter initialEntries={['/schedule']}>
      <Routes>
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/setup" element={<p>Setup screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// jsdom applies the desktop `@media (min-width: 1024px)` rules unconditionally,
// so the phone view is always CSS-hidden here. Phone queries opt into hidden nodes.
const hidden = { hidden: true } as const

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SchedulePage', () => {
  it('shows the empty state when no semester is active', async () => {
    fetchMock.mockResolvedValue(ok({ semesters: [] }))
    renderSchedule()

    expect(await screen.findByText('No semester yet')).toBeInTheDocument()
    expect(screen.getByText('No active semester')).toBeInTheDocument()
  })

  it('shows the selected day agenda and empty-day message', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSchedule()

    await screen.findByRole('tablist', { name: 'Schedule days', ...hidden })
    await user.click(screen.getByRole('tab', { name: /Mon/, ...hidden }))

    let panel = screen.getByRole('tabpanel', { name: 'Monday classes', ...hidden })
    expect(within(panel).getByText('Mathematics')).toBeInTheDocument()
    expect(within(panel).getByText('Lab 1')).toBeInTheDocument()
    expect(within(panel).getByText('10:00 AM')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Tue/, ...hidden }))
    panel = screen.getByRole('tabpanel', { name: 'Tuesday classes', ...hidden })
    expect(
      within(panel).getByText('No classes on Tuesday.'),
    ).toBeInTheDocument()
  })

  it('warns about an overlap but still saves the class', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSchedule()

    await screen.findByRole('tablist', { name: 'Schedule days', ...hidden })
    await user.click(screen.getAllByRole('button', { name: 'Add class' })[0])

    const dialog = screen.getByRole('dialog', { name: 'Add class' })
    await user.selectOptions(within(dialog).getByLabelText('Day'), '1')
    fireEvent.change(within(dialog).getByLabelText('Start time'), {
      target: { value: '09:30' },
    })
    fireEvent.change(within(dialog).getByLabelText('End time'), {
      target: { value: '10:30' },
    })
    await user.type(
      within(dialog).getByLabelText('Room or location (optional)'),
      'Room 3',
    )

    expect(
      within(dialog).getByText(/Overlaps with Mathematics/),
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole('button', { name: 'Save class' }),
    )

    expect(
      await screen.findByText('Class saved in your weekly schedule.'),
    ).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/schedule' && init?.method === 'POST',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toEqual({
      semesterId: 'semester-1',
      subjectId: 'subject-1',
      dayOfWeek: 1,
      startTime: '09:30',
      endTime: '10:30',
      room: 'Room 3',
    })
  })

  it('validates the form before sending a request', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSchedule()

    await screen.findByRole('tablist', { name: 'Schedule days', ...hidden })
    await user.click(screen.getAllByRole('button', { name: 'Add class' })[0])

    const dialog = screen.getByRole('dialog', { name: 'Add class' })
    fireEvent.change(within(dialog).getByLabelText('Start time'), {
      target: { value: '11:00' },
    })
    fireEvent.change(within(dialog).getByLabelText('End time'), {
      target: { value: '10:00' },
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Save class' }),
    )

    expect(
      within(dialog).getByText('The end time must be after the start time.'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => url === '/api/schedule' && init?.method === 'POST',
      ),
    ).toBe(false)
  })

  it('edits a class from its details', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSchedule()

    await screen.findByRole('tablist', { name: 'Schedule days', ...hidden })
    await user.click(screen.getByRole('tab', { name: /Mon/, ...hidden }))

    await user.click(
      screen.getAllByRole('button', { name: /Mathematics, 9:00 AM/, ...hidden })[0],
    )

    const details = screen.getByRole('dialog', { name: 'Mathematics' })
    await user.click(within(details).getByRole('button', { name: 'Edit' }))

    const dialog = screen.getByRole('dialog', { name: 'Edit class' })
    const room = within(dialog).getByLabelText('Room or location (optional)')
    await user.clear(room)
    await user.type(room, 'Room 9')
    await user.click(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    )

    expect(
      await screen.findByText('Class updated in your weekly schedule.'),
    ).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/schedule/class-1' && init?.method === 'PATCH',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toMatchObject({
      subjectId: 'subject-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room 9',
    })
  })

  it('deletes a class after confirmation', async () => {
    mockReady()
    const user = userEvent.setup()
    renderSchedule()

    await screen.findByRole('tablist', { name: 'Schedule days', ...hidden })
    await user.click(screen.getByRole('tab', { name: /Mon/, ...hidden }))
    await user.click(
      screen.getAllByRole('button', { name: /Mathematics, 9:00 AM/, ...hidden })[0],
    )

    await user.click(
      within(screen.getByRole('dialog', { name: 'Mathematics' })).getByRole(
        'button',
        { name: 'Delete' },
      ),
    )

    const confirm = screen.getByRole('dialog', {
      name: 'Delete this class?',
    })
    await user.click(
      within(confirm).getByRole('button', { name: 'Delete class' }),
    )

    expect(
      await screen.findByText('Class deleted from your weekly schedule.'),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            url === '/api/schedule/class-1' && init?.method === 'DELETE',
        ),
      ).toBe(true)
    })
  })

  it('prompts for semester setup when the semester has no subjects', async () => {
    mockReady([])
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/semesters') {
        return Promise.resolve(ok({ semesters: [semester] }))
      }
      if (url === '/api/semesters/semester-1/schedule') {
        return Promise.resolve(ok({ classes: [] }))
      }
      return Promise.resolve(ok({ semester, subjects: [] }))
    })

    renderSchedule()

    expect(
      await screen.findByText('No subjects in this semester'),
    ).toBeInTheDocument()
  })
})
