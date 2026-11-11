import { describe, expect, it } from 'vitest'
import type { GradingCategory, Subject } from '../../lib/academic-api'
import {
  buildActivityInput,
  buildActivityUpdate,
  createEditScoreForm,
  createScoreForm,
  hasScoreErrors,
  localToday,
  validateScoreForm,
  type ScoreFormValues,
} from './score-form'

function category(id: string, isActive = true): GradingCategory {
  return {
    id,
    subjectId: 'subject-1',
    name: id,
    weightPercent: 100,
    isActive,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    activities: [],
  }
}

function subject(categories: GradingCategory[]): Subject {
  return {
    id: 'subject-1',
    semesterId: 'semester-1',
    name: 'Mathematics',
    units: 3,
    professor: null,
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories,
  }
}

function validValues(): ScoreFormValues {
  return {
    subjectId: 'subject-1',
    categoryId: 'quizzes',
    name: '  Quiz 1  ',
    scoreEarned: '18',
    totalPoints: '20',
    date: '2026-11-08',
  }
}

describe('score form', () => {
  it('uses the local date for the default value', () => {
    expect(localToday(new Date(2026, 10, 8, 23, 30))).toBe('2026-11-08')
  })

  it('selects the first usable subject and its first active category', () => {
    const noCategories: Subject = {
      ...subject([]),
      id: 'subject-empty',
      name: 'Empty',
    }
    const form = createScoreForm(
      [
        noCategories,
        subject([category('old', false), category('quizzes')]),
      ],
      new Date(2026, 10, 8),
    )

    expect(form).toMatchObject({
      subjectId: 'subject-1',
      categoryId: 'quizzes',
      name: '',
      scoreEarned: '',
      totalPoints: '',
      date: '2026-11-08',
    })
  })

  it('honours requested subject and category defaults when they are active', () => {
    const form = createScoreForm(
      [subject([category('quizzes'), category('exams')])],
      new Date(2026, 10, 8),
      { subjectId: 'subject-1', categoryId: 'exams' },
    )

    expect(form.subjectId).toBe('subject-1')
    expect(form.categoryId).toBe('exams')
  })

  it('falls back to the first active category when a default is unusable', () => {
    const form = createScoreForm(
      [subject([category('old', false), category('quizzes')])],
      new Date(2026, 10, 8),
      { subjectId: 'subject-1', categoryId: 'old' },
    )

    expect(form.categoryId).toBe('quizzes')
  })

  it('loads an existing activity into the edit form', () => {
    const form = createEditScoreForm(
      [subject([category('quizzes')])],
      {
        id: 'q1',
        categoryId: 'quizzes',
        name: 'Quiz 1',
        scoreEarned: 18,
        totalPoints: 20,
        date: '2026-11-08',
      },
    )

    expect(form).toEqual({
      subjectId: 'subject-1',
      categoryId: 'quizzes',
      name: 'Quiz 1',
      scoreEarned: '18',
      totalPoints: '20',
      date: '2026-11-08',
    })
  })

  it('accepts a valid score', () => {
    expect(hasScoreErrors(validateScoreForm(validValues()))).toBe(false)
  })

  it('requires a subject, category, name, and numbers', () => {
    const errors = validateScoreForm({
      ...validValues(),
      subjectId: '',
      categoryId: '',
      name: '  ',
      scoreEarned: '',
      totalPoints: '',
    })

    expect(errors).toMatchObject({
      subjectId: 'Choose a subject.',
      categoryId: 'Choose a grading category.',
      name: 'Enter an activity name.',
      scoreEarned: 'Enter an earned score of zero or greater.',
      totalPoints: 'Enter total points greater than zero.',
    })
  })

  it('rejects negative scores, zero totals, and scores above the total', () => {
    expect(
      validateScoreForm({ ...validValues(), scoreEarned: '-1' }),
    ).toMatchObject({ scoreEarned: 'Enter an earned score of zero or greater.' })
    expect(
      validateScoreForm({ ...validValues(), totalPoints: '0' }),
    ).toMatchObject({ totalPoints: 'Enter total points greater than zero.' })
    expect(
      validateScoreForm({ ...validValues(), scoreEarned: '21' }),
    ).toMatchObject({
      scoreEarned: 'Earned score cannot exceed total points.',
    })
  })

  it('rejects an impossible date but allows an empty one', () => {
    expect(
      validateScoreForm({ ...validValues(), date: '2026-02-30' }),
    ).toMatchObject({ date: 'Use a valid date.' })
    expect(
      hasScoreErrors(validateScoreForm({ ...validValues(), date: '' })),
    ).toBe(false)
  })

  it('builds a trimmed API payload and omits a blank date', () => {
    expect(buildActivityInput({ ...validValues(), date: '' })).toEqual({
      subjectId: 'subject-1',
      categoryId: 'quizzes',
      name: 'Quiz 1',
      scoreEarned: 18,
      totalPoints: 20,
      date: undefined,
    })
  })

  it('builds an update payload without subject or category IDs', () => {
    expect(buildActivityUpdate(validValues())).toEqual({
      name: 'Quiz 1',
      scoreEarned: 18,
      totalPoints: 20,
      date: '2026-11-08',
    })
  })
})
