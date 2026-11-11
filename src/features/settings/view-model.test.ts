import { describe, expect, it } from 'vitest'
import { buildGradeScale, semesterStatsLabel } from './view-model'

describe('settings view model', () => {
  it('orders conversion rows by threshold, highest first, with two decimals', () => {
    const rows = buildGradeScale([
      { minimumPercentage: 0, grade: 5 },
      { minimumPercentage: 95, grade: 1.25 },
      { minimumPercentage: 88, grade: 1.75 },
    ])

    expect(rows).toEqual([
      { threshold: '95.00%', grade: '1.25' },
      { threshold: '88.00%', grade: '1.75' },
      { threshold: '0.00%', grade: '5.00' },
    ])
  })

  it('does not mutate the source rows', () => {
    const source = [
      { minimumPercentage: 0, grade: 5 },
      { minimumPercentage: 90, grade: 1.5 },
    ]

    buildGradeScale(source)

    expect(source[0].minimumPercentage).toBe(0)
  })

  it('formats semester units and a pluralized subject count', () => {
    expect(semesterStatsLabel(21, 6)).toBe('21 units · 6 subjects')
    expect(semesterStatsLabel(3, 1)).toBe('3 units · 1 subject')
    expect(semesterStatsLabel(0, 0)).toBe('0 units · 0 subjects')
  })

  it('falls back to zero when counts are missing', () => {
    expect(semesterStatsLabel(undefined, undefined)).toBe(
      '0 units · 0 subjects',
    )
  })
})
