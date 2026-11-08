import { describe, expect, it } from 'vitest'
import type { Activity, GradingCategory, Subject } from '../../lib/academic-api'
import {
  activityPercentage,
  buildSubjectsView,
  formatActivityDate,
} from './view-model'

function activity(
  id: string,
  categoryId: string,
  scoreEarned: number,
  totalPoints: number,
  date = '2026-11-08',
): Activity {
  return {
    id,
    categoryId,
    name: id,
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
  isActive = true,
): GradingCategory {
  return {
    id,
    subjectId: 'subject-1',
    name,
    weightPercent,
    isActive,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    activities,
  }
}

function subject(categories: GradingCategory[]): Subject {
  return {
    id: 'subject-1',
    semesterId: 'semester-1',
    name: 'Mathematics',
    units: 3,
    professor: 'Ms. Cruz',
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories,
  }
}

describe('subjects view model', () => {
  it('computes category averages and newest-first activities', () => {
    const view = buildSubjectsView([
      subject([
        category('q', 'Quizzes', 40, [
          activity('q1', 'q', 18, 20, '2026-11-01'),
          activity('q2', 'q', 20, 20, '2026-11-08'),
        ]),
        category('e', 'Exams', 60, [activity('e1', 'e', 90, 100)]),
      ]),
    ])

    const quizzes = view.subjects[0].categories[0]
    expect(quizzes.average).toBe(95)
    expect(quizzes.activities.map((entry) => entry.id)).toEqual(['q2', 'q1'])
    expect(quizzes.activities[0]).toMatchObject({
      name: 'q2',
      percentage: 100,
      scoreEarned: 20,
      totalPoints: 20,
    })
    expect(view.subjects[0].percentage).toBe(92)
  })

  it('keeps empty categories pending instead of inventing an average', () => {
    const view = buildSubjectsView([
      subject([
        category('q', 'Quizzes', 40, [activity('q1', 'q', 80, 100)]),
        category('e', 'Exams', 60, []),
      ]),
    ])

    const exams = view.subjects[0].categories[1]
    expect(exams.average).toBeNull()
    expect(exams.activities).toEqual([])
    expect(view.subjects[0].percentage).toBeNull()
    expect(view.subjects[0].pendingMessage).toBe('Add scores for Exams.')
  })

  it('still lists inactive categories with their recorded scores', () => {
    const view = buildSubjectsView([
      subject([
        category('q', 'Quizzes', 100, [activity('q1', 'q', 90, 100)]),
        category('old', 'Old', 25, [activity('o1', 'old', 10, 10)], false),
      ]),
    ])

    expect(view.subjects[0].percentage).toBe(90)
    expect(view.subjects[0].categories[1]).toMatchObject({
      isActive: false,
      average: 100,
    })
  })

  it('returns null percentages for invalid score totals', () => {
    expect(activityPercentage(10, 0)).toBeNull()
    expect(activityPercentage(Number.NaN, 10)).toBeNull()
    expect(activityPercentage(15, 20)).toBe(75)
  })

  it('formats activity dates without timezone shifts', () => {
    expect(formatActivityDate('2026-11-08')).toBe('Nov 8, 2026')
    expect(formatActivityDate('2026-01-01')).toBe('Jan 1, 2026')
  })
})
