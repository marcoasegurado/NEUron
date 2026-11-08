import { describe, expect, it } from 'vitest'
import type { Activity, GradingCategory, Subject } from '../../lib/academic-api'
import { buildHomeView, pendingMessage, toGradingSubject } from './view-model'

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

describe('home view model', () => {
  it('flattens category activities for the grading engine', () => {
    const grading = toGradingSubject(
      subject([
        category('q', 'Quizzes', 40, [activity('q1', 'q', 18, 20)]),
      ]),
    )

    expect(grading.categories).toHaveLength(1)
    expect(grading.activities).toEqual([
      {
        id: 'q1',
        name: 'q1',
        categoryId: 'q',
        scoreEarned: 18,
        totalPoints: 20,
        date: '2026-11-08',
      },
    ])
  })

  it('computes an exact weighted percentage when every category is scored', () => {
    const view = buildHomeView([
      subject([
        category('q', 'Quizzes', 40, [activity('q1', 'q', 80, 100)]),
        category('e', 'Exams', 60, [activity('e1', 'e', 100, 100)]),
      ]),
    ])

    expect(view.subjects[0]).toMatchObject({
      id: 'subject-1',
      name: 'Mathematics',
      units: 3,
      percentage: 92,
      pendingReason: null,
      activeCategoryCount: 2,
      completedCategoryCount: 2,
      scoreCount: 2,
    })
  })

  it('reports incomplete categories by name without a percentage', () => {
    const view = buildHomeView([
      subject([
        category('q', 'Quizzes', 40, [activity('q1', 'q', 80, 100)]),
        category('e', 'Exams', 60, []),
      ]),
    ])

    expect(view.subjects[0]).toMatchObject({
      percentage: null,
      pendingReason: 'incomplete-categories',
      pendingMessage: 'Add scores for Exams.',
      activeCategoryCount: 2,
      completedCategoryCount: 1,
    })
  })

  it('reports invalid weights and ignores inactive categories', () => {
    const invalid = buildHomeView([
      subject([
        category('q', 'Quizzes', 80, [activity('q1', 'q', 80, 100)]),
        category('e', 'Exams', 60, [activity('e1', 'e', 100, 100)]),
      ]),
    ])
    expect(invalid.subjects[0].pendingReason).toBe('invalid-weights')

    const inactive = buildHomeView([
      subject([
        category('q', 'Quizzes', 100, [activity('q1', 'q', 90, 100)]),
        category('old', 'Old', 25, [], false),
      ]),
    ])
    expect(inactive.subjects[0].percentage).toBe(90)
    expect(inactive.subjects[0].activeCategoryCount).toBe(1)
  })

  it('reports a subject without active categories', () => {
    const view = buildHomeView([
      subject([category('old', 'Old', 100, [], false)]),
    ])

    expect(view.subjects[0]).toMatchObject({
      percentage: null,
      pendingReason: 'no-categories',
      pendingMessage:
        'Add a grading category before a percentage can be computed.',
      activeCategoryCount: 0,
    })
  })

  it('describes every pending reason', () => {
    expect(pendingMessage('invalid-activities', [])).toContain('invalid')
    expect(pendingMessage('incomplete-categories', [])).toContain(
      'still need scores',
    )
    expect(pendingMessage('no-conversion', [])).toContain(
      'conversion table',
    )
  })
})
