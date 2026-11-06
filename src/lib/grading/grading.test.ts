import { describe, expect, it } from 'vitest'
import {
  calculateCategoryAverage,
  calculateSemesterGwa,
  calculateSubjectGrade,
  calculateSubjectPercentage,
  convertPercentage,
  formatNumber,
  validateActivity,
  validateConversionTable,
  validateWeights,
} from './grading'
import type {
  Activity,
  ConversionRow,
  GradingCategory,
  Subject,
} from './types'

const testTable: ConversionRow[] = [
  { minimumPercentage: 98, grade: 1.0 },
  { minimumPercentage: 95, grade: 1.25 },
  { minimumPercentage: 90, grade: 1.5 },
  { minimumPercentage: 85, grade: 1.75 },
  { minimumPercentage: 80, grade: 2.0 },
  { minimumPercentage: 75, grade: 2.25 },
  { minimumPercentage: 70, grade: 2.5 },
  { minimumPercentage: 65, grade: 2.75 },
  { minimumPercentage: 60, grade: 3.0 },
  { minimumPercentage: 50, grade: 4.0 },
  { minimumPercentage: 0, grade: 5.0 },
]

function category(
  id: string,
  name: string,
  weight: number,
  active = true,
): GradingCategory {
  return { id, name, weight, active }
}

function activity(
  id: string,
  categoryId: string,
  scoreEarned: number,
  totalPoints: number,
): Activity {
  return {
    id,
    name: `Activity ${id}`,
    categoryId,
    scoreEarned,
    totalPoints,
  }
}

function subject(
  id: string,
  units: number,
  categories: GradingCategory[],
  activities: Activity[],
): Subject {
  return {
    id,
    name: `Subject ${id}`,
    units,
    categories,
    activities,
  }
}

describe('category average', () => {
  it('uses a points-weighted average', () => {
    const quizzes = category('q', 'Quizzes', 100)
    const result = calculateCategoryAverage(quizzes, [
      activity('a1', 'q', 18, 20),
      activity('a2', 'q', 40, 50),
    ])

    expect(result.status).toBe('complete')
    if (result.status === 'complete') {
      expect(result.average).toBeCloseTo(82.857142, 5)
    }
  })

  it('treats a recorded zero as complete with a 0% average', () => {
    const quizzes = category('q', 'Quizzes', 100)
    const result = calculateCategoryAverage(quizzes, [
      activity('a1', 'q', 0, 10),
    ])

    expect(result.status).toBe('complete')
    if (result.status === 'complete') {
      expect(result.average).toBe(0)
      expect(result.activityCount).toBe(1)
    }
  })

  it('reports a category with no activities as incomplete', () => {
    const quizzes = category('q', 'Quizzes', 100)
    const result = calculateCategoryAverage(quizzes, [])

    expect(result).toEqual({ status: 'incomplete', reason: 'no-activities' })
  })
})

describe('activity validation', () => {
  it('rejects a zero maximum', () => {
    expect(validateActivity(activity('a', 'c', 10, 0)).valid).toBe(false)
  })

  it('rejects a score above the maximum in v1', () => {
    expect(validateActivity(activity('a', 'c', 11, 10)).valid).toBe(false)
  })

  it('accepts a score equal to the maximum', () => {
    expect(validateActivity(activity('a', 'c', 10, 10)).valid).toBe(true)
  })
})

describe('weight validation', () => {
  it('rejects weights that total 90%', () => {
    const result = validateWeights([
      category('a', 'Quizzes', 50),
      category('b', 'Exams', 40),
    ])
    expect(result.valid).toBe(false)
    expect(result.direction).toBe('below')
  })

  it('rejects weights that total 110%', () => {
    const result = validateWeights([
      category('a', 'Quizzes', 50),
      category('b', 'Exams', 60),
    ])
    expect(result.valid).toBe(false)
    expect(result.direction).toBe('above')
  })

  it('accepts weights that total 100% and ignores inactive categories', () => {
    const result = validateWeights([
      category('a', 'Quizzes', 60),
      category('b', 'Exams', 40),
      category('c', 'Old', 25, false),
    ])
    expect(result.valid).toBe(true)
    expect(result.total).toBe(100)
  })
})

describe('subject percentage', () => {
  it('marks the subject pending when an active category has no scores', () => {
    const quizzes = category('q', 'Quizzes', 50)
    const exams = category('e', 'Exams', 50)
    const result = calculateSubjectPercentage(
      subject('s', 3, [quizzes, exams], [activity('a', 'q', 10, 10)]),
    )

    expect(result.status).toBe('pending')
    if (result.status === 'pending') {
      expect(result.reason).toBe('incomplete-categories')
      expect(result.incompleteCategoryIds).toEqual(['e'])
    }
  })

  it('matches the documented weighted percentage example', () => {
    const quizzes = category('q', 'Quizzes', 20)
    const exams = category('e', 'Exams', 40)
    const projects = category('p', 'Projects', 30)
    const attendance = category('a', 'Attendance', 10)

    const result = calculateSubjectPercentage(
      subject(
        's',
        3,
        [quizzes, exams, projects, attendance],
        [
          activity('q1', 'q', 18, 20),
          activity('q2', 'q', 40, 50),
          activity('e1', 'e', 92, 100),
          activity('p1', 'p', 90, 100),
          activity('a1', 'a', 10, 10),
        ],
      ),
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.percentage).toBeCloseTo(90.371428, 5)
    }
  })
})

describe('conversion table', () => {
  it('uses an exact threshold row', () => {
    expect(convertPercentage(95, testTable)).toBe(1.25)
  })

  it('uses the next lower threshold when between rows', () => {
    expect(convertPercentage(93, testTable)).toBe(1.5)
  })

  it('rejects a table without a 0% threshold', () => {
    const invalid = testTable.filter((row) => row.minimumPercentage !== 0)
    const result = validateConversionTable(invalid)
    expect(result.valid).toBe(false)
  })

  it('rejects duplicate thresholds', () => {
    const result = validateConversionTable([
      { minimumPercentage: 90, grade: 1.5 },
      { minimumPercentage: 90, grade: 1.75 },
      { minimumPercentage: 0, grade: 5 },
    ])
    expect(result.valid).toBe(false)
  })
})

describe('semester GWA', () => {
  it('computes the unit-weighted example as 1.80', () => {
    const single = (id: string, units: number, score: number) =>
      subject(
        id,
        units,
        [category(`${id}-c`, 'All', 100)],
        [activity(`${id}-a`, `${id}-c`, score, 100)],
      )

    const result = calculateSemesterGwa(
      [single('math', 3, 86), single('english', 3, 76), single('science', 4, 92)],
      testTable,
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.gwa).toBeCloseTo(1.8, 10)
    }
  })

  it('returns pending when one subject has no computed grade', () => {
    const complete = subject(
      'complete',
      3,
      [category('c', 'All', 100)],
      [activity('a', 'c', 90, 100)],
    )
    const incomplete = subject(
      'incomplete',
      3,
      [category('c2', 'All', 100)],
      [],
    )

    const result = calculateSemesterGwa([complete, incomplete], testTable)

    expect(result.status).toBe('pending')
    if (result.status === 'pending') {
      expect(result.pendingSubjectIds).toEqual(['incomplete'])
    }
  })

  it('returns empty when there are no active subjects', () => {
    expect(calculateSemesterGwa([], testTable)).toEqual({ status: 'empty' })
  })

  it('converts each subject before weighting and keeps exact values', () => {
    const result = calculateSubjectGrade(
      subject(
        's',
        3,
        [category('c', 'All', 100)],
        [activity('a', 'c', 86, 100)],
      ),
      testTable,
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.percentage).toBe(86)
      expect(result.grade).toBe(1.75)
    }
  })
})

describe('display rounding', () => {
  it('shows two decimals without changing the exact value', () => {
    const exact = 1.804
    expect(formatNumber(exact, 2)).toBe('1.80')
    expect(exact).toBe(1.804)
  })
})
