import { describe, expect, it } from 'vitest'
import type {
  ScheduleClass,
  Subject,
} from '../../lib/academic-api'
import {
  buildCreateClassInput,
  buildUpdateClassInput,
  createClassForm,
  draftConflicts,
  hasClassErrors,
  validateClassForm,
} from './class-form'

function subject(id: string, name: string): Subject {
  return {
    id,
    semesterId: 'semester-1',
    name,
    units: 3,
    professor: null,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories: [],
  }
}

function scheduleClass(
  id: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): ScheduleClass {
  return {
    id,
    semesterId: 'semester-1',
    subjectId: 'subject-1',
    dayOfWeek,
    startTime,
    endTime,
    room: null,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }
}

const subjects = [subject('subject-1', 'Mathematics')]

describe('class form', () => {
  it('creates defaults from the selected day and first subject', () => {
    expect(createClassForm(subjects, 3)).toEqual({
      subjectId: 'subject-1',
      dayOfWeek: '3',
      startTime: '08:00',
      endTime: '09:00',
      room: '',
    })
  })

  it('creates an edit form from an existing class', () => {
    expect(
      createClassForm(subjects, 1, {
        ...scheduleClass('class-1', 5, '13:00', '14:30'),
        room: 'Lab 1',
      }),
    ).toEqual({
      subjectId: 'subject-1',
      dayOfWeek: '5',
      startTime: '13:00',
      endTime: '14:30',
      room: 'Lab 1',
    })
  })

  it('validates required and malformed fields', () => {
    const errors = validateClassForm({
      subjectId: '',
      dayOfWeek: '7',
      startTime: '8:00',
      endTime: '09:00',
      room: 'a'.repeat(121),
    })

    expect(errors.subjectId).toBe('Choose a subject.')
    expect(errors.dayOfWeek).toBe(
      'Choose a day between Monday and Saturday.',
    )
    expect(errors.startTime).toBe('Use a valid start time.')
    expect(errors.room).toBe('Room must be 120 characters or fewer.')
    expect(hasClassErrors(errors)).toBe(true)
  })

  it('requires the end time to be later than the start time', () => {
    expect(
      validateClassForm({
        subjectId: 'subject-1',
        dayOfWeek: '1',
        startTime: '10:00',
        endTime: '10:00',
        room: '',
      }).endTime,
    ).toBe('The end time must be after the start time.')
  })

  it('builds create and update payloads with a null blank room', () => {
    const values = {
      subjectId: 'subject-1',
      dayOfWeek: '2',
      startTime: '09:00',
      endTime: '10:00',
      room: '  ',
    }

    expect(buildCreateClassInput(values, 'semester-1')).toEqual({
      semesterId: 'semester-1',
      subjectId: 'subject-1',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:00',
      room: null,
    })
    expect(buildUpdateClassInput(values)).toEqual({
      subjectId: 'subject-1',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:00',
      room: null,
    })
  })

  it('finds same-day overlaps while excluding the edited class', () => {
    const classes = [
      scheduleClass('a', 1, '08:00', '09:30'),
      scheduleClass('b', 1, '09:00', '10:00'),
      scheduleClass('c', 1, '10:00', '11:00'),
      scheduleClass('d', 2, '09:00', '10:00'),
    ]

    const conflicts = draftConflicts(
      {
        subjectId: 'subject-1',
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '10:00',
        room: '',
      },
      classes,
      'b',
    )

    expect(conflicts.map((entry) => entry.id)).toEqual(['a'])
    expect(
      draftConflicts(
        {
          subjectId: 'subject-1',
          dayOfWeek: '1',
          startTime: '09:00',
          endTime: '09:00',
          room: '',
        },
        classes,
      ),
    ).toEqual([])
  })
})
