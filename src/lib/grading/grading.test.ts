import { describe, expect, it } from 'vitest'
import {
  calculateCategoryAverage,
  calculateSemesterGwa,
  calculateSubjectGrade,
  calculateSubjectPercentage,
  convertPercentage,
  formatNumber,
  roundForDisplay,
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

  it('rejects negative and non-finite scores or totals', () => {
    expect(validateActivity(activity('a', 'c', -1, 10)).valid).toBe(false)
    expect(
      validateActivity(activity('a', 'c', Number.NaN, 10)).valid,
    ).toBe(false)
    expect(
      validateActivity(activity('a', 'c', Number.POSITIVE_INFINITY, 10)).valid,
    ).toBe(false)
    expect(
      validateActivity(activity('a', 'c', 10, Number.NaN)).valid,
    ).toBe(false)
    expect(
      validateActivity(activity('a', 'c', 10, Number.POSITIVE_INFINITY)).valid,
    ).toBe(false)
  })

  it('accepts decimal scores and requires an activity name', () => {
    expect(validateActivity(activity('a', 'c', 9.5, 10)).valid).toBe(true)
    expect(
      validateActivity({ ...activity('a', 'c', 1, 2), name: '   ' }).valid,
    ).toBe(false)
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

  it('rejects zero, negative, and non-finite weights', () => {
    expect(validateWeights([category('a', 'A', 0)]).valid).toBe(false)
    expect(validateWeights([category('a', 'A', -10)]).valid).toBe(false)
    expect(validateWeights([category('a', 'A', Number.NaN)]).valid).toBe(false)
  })

  it('requires at least one active category', () => {
    const result = validateWeights([category('a', 'Old', 100, false)])
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'At least one active grading category is required.',
    )
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

  it('reaches 100% when every activity is perfect', () => {
    const result = calculateSubjectPercentage(
      subject(
        's',
        3,
        [category('a', 'Quizzes', 40), category('b', 'Exams', 60)],
        [activity('a1', 'a', 20, 20), activity('b1', 'b', 60, 60)],
      ),
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.percentage).toBe(100)
    }
  })

  it('returns pending when there are no active categories', () => {
    const result = calculateSubjectPercentage(
      subject('s', 3, [category('a', 'Old', 100, false)], []),
    )

    expect(result).toMatchObject({
      status: 'pending',
      reason: 'no-categories',
    })
  })

  it('returns pending when the active weights are invalid', () => {
    const result = calculateSubjectPercentage(
      subject(
        's',
        3,
        [category('a', 'Quizzes', 90)],
        [activity('a1', 'a', 9, 10)],
      ),
    )

    expect(result).toMatchObject({
      status: 'pending',
      reason: 'invalid-weights',
    })
  })

  it('returns pending when an active category has an invalid activity', () => {
    const result = calculateSubjectPercentage(
      subject(
        's',
        3,
        [category('a', 'Quizzes', 100)],
        [activity('a1', 'a', 10, 0)],
      ),
    )

    expect(result).toMatchObject({
      status: 'pending',
      reason: 'invalid-activities',
    })
  })

  it('ignores inactive categories and their activities', () => {
    const result = calculateSubjectPercentage(
      subject(
        's',
        3,
        [category('a', 'Active', 100), category('b', 'Old', 0, false)],
        [
          activity('a1', 'a', 90, 100),
          // Invalid on purpose: an inactive category must not affect grading.
          activity('b1', 'b', 10, 0),
        ],
      ),
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.percentage).toBe(90)
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

  it('accepts the inclusive 1.0 and 5.0 grade bounds', () => {
    const result = validateConversionTable([
      { minimumPercentage: 100, grade: 1.0 },
      { minimumPercentage: 0, grade: 5.0 },
    ])
    expect(result.valid).toBe(true)
  })

  it('rejects grades outside the NEU 1.0-5.0 scale', () => {
    const result = validateConversionTable([
      { minimumPercentage: 100, grade: 0.99 },
      { minimumPercentage: 50, grade: 2.5 },
      { minimumPercentage: 0, grade: 5.01 },
    ])
    expect(result.valid).toBe(false)
    expect(
      result.errors.filter((error) => error.includes('NEU grades')),
    ).toHaveLength(2)
  })

  it('rejects thresholds outside the 0-100 range', () => {
    const result = validateConversionTable([
      { minimumPercentage: -1, grade: 1 },
      { minimumPercentage: 101, grade: 5 },
      { minimumPercentage: 0, grade: 5 },
    ])
    expect(result.valid).toBe(false)
    expect(
      result.errors.filter((error) => error.includes('between 0 and 100')),
    ).toHaveLength(2)
  })

  it('sorts an unordered table before converting', () => {
    const unordered: ConversionRow[] = [
      { minimumPercentage: 0, grade: 5.0 },
      { minimumPercentage: 95, grade: 1.25 },
      { minimumPercentage: 90, grade: 1.5 },
      { minimumPercentage: 98, grade: 1.0 },
    ]

    expect(convertPercentage(95, unordered)).toBe(1.25)
    expect(convertPercentage(93, unordered)).toBe(1.5)
  })

  it('returns null for percentages outside 0-100 or an invalid table', () => {
    expect(convertPercentage(-0.1, testTable)).toBeNull()
    expect(convertPercentage(100.1, testTable)).toBeNull()
    expect(convertPercentage(Number.NaN, testTable)).toBeNull()
    expect(
      convertPercentage(95, [{ minimumPercentage: 95, grade: 1.25 }]),
    ).toBeNull()
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

    const inactive: Subject = {
      ...subject(
        'inactive',
        3,
        [category('c', 'All', 100)],
        [activity('a', 'c', 90, 100)],
      ),
      active: false,
    }
    expect(calculateSemesterGwa([inactive], testTable)).toEqual({
      status: 'empty',
    })
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

  it('treats a recorded zero as complete for the subject', () => {
    const result = calculateSubjectGrade(
      subject(
        's',
        3,
        [category('c', 'All', 100)],
        [activity('a', 'c', 0, 10)],
      ),
      testTable,
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.percentage).toBe(0)
      expect(result.grade).toBe(5.0)
    }
  })

  it('returns pending when a subject has invalid units', () => {
    const complete = subject(
      'complete',
      3,
      [category('c', 'All', 100)],
      [activity('a', 'c', 90, 100)],
    )
    const invalidUnits = subject(
      'invalid-units',
      0,
      [category('c2', 'All', 100)],
      [activity('a2', 'c2', 90, 100)],
    )

    const result = calculateSemesterGwa([complete, invalidUnits], testTable)

    expect(result.status).toBe('pending')
    if (result.status === 'pending') {
      expect(result.pendingSubjectIds).toEqual(['invalid-units'])
    }
  })

  it('retains the exact GWA and rounds only for display', () => {
    const preciseTable: ConversionRow[] = [
      { minimumPercentage: 0, grade: 1.804 },
    ]
    const perfect = (id: string, units: number) =>
      subject(
        id,
        units,
        [category(`${id}-c`, 'All', 100)],
        [activity(`${id}-a`, `${id}-c`, 100, 100)],
      )

    const result = calculateSemesterGwa(
      [perfect('a', 3), perfect('b', 7)],
      preciseTable,
    )

    expect(result.status).toBe('graded')
    if (result.status === 'graded') {
      expect(result.gwa).toBeCloseTo(1.804, 12)
      expect(result.gwa).not.toBe(1.8)
      expect(formatNumber(result.gwa, 2)).toBe('1.80')
    }
  })
})

describe('display rounding', () => {
  it('shows two decimals without changing the exact value', () => {
    const exact = 1.804
    expect(formatNumber(exact, 2)).toBe('1.80')
    expect(exact).toBe(1.804)
  })

  it('rounds only the display copy', () => {
    expect(roundForDisplay(1.804, 2)).toBe(1.8)
    expect(roundForDisplay(1.805, 2)).toBe(1.81)
  })
})
