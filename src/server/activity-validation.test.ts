import { describe, expect, it } from 'vitest'
import {
  parseActivityInput,
  parseActivityUpdate,
} from './activity-validation'

function validBody() {
  return {
    subjectId: ' subject-1 ',
    categoryId: 'category-1',
    name: '  Quiz 1  ',
    scoreEarned: 18,
    totalPoints: 20,
    date: '2026-11-08',
  }
}

const now = new Date('2026-11-08T10:30:00.000Z')

describe('activity validation', () => {
  it('normalizes a valid score entry', () => {
    const result = parseActivityInput(validBody(), now)
    expect(result).toEqual({
      subjectId: 'subject-1',
      categoryId: 'category-1',
      name: 'Quiz 1',
      scoreEarned: 18,
      totalPoints: 20,
      date: '2026-11-08',
    })
  })

  it('defaults an omitted date to today', () => {
    const body = validBody()
    delete (body as { date?: string }).date
    expect(parseActivityInput(body, now).date).toBe('2026-11-08')
  })

  it('accepts zero earned points and decimal values', () => {
    expect(
      parseActivityInput(
        { ...validBody(), scoreEarned: 0, totalPoints: 15.5 },
        now,
      ),
    ).toMatchObject({ scoreEarned: 0, totalPoints: 15.5 })
  })

  it('requires a subject and category', () => {
    expect(() =>
      parseActivityInput({ ...validBody(), subjectId: '  ' }, now),
    ).toThrow('Choose a subject.')
    expect(() =>
      parseActivityInput({ ...validBody(), categoryId: '' }, now),
    ).toThrow('Choose a grading category.')
  })

  it('rejects an empty or overlong name', () => {
    expect(() =>
      parseActivityInput({ ...validBody(), name: '   ' }, now),
    ).toThrow('Activity name is required.')
    expect(() =>
      parseActivityInput({ ...validBody(), name: 'a'.repeat(121) }, now),
    ).toThrow('Activity name must be 120 characters or fewer.')
  })

  it('rejects invalid scores and totals', () => {
    expect(() =>
      parseActivityInput({ ...validBody(), scoreEarned: -1 }, now),
    ).toThrow('Earned score must be a finite number greater than or equal to zero.')
    expect(() =>
      parseActivityInput({ ...validBody(), totalPoints: 0 }, now),
    ).toThrow('Total possible points must be a finite number greater than zero.')
    expect(() =>
      parseActivityInput({ ...validBody(), scoreEarned: 21 }, now),
    ).toThrow('Earned score cannot exceed total possible points.')
    expect(() =>
      parseActivityInput({ ...validBody(), scoreEarned: '18' }, now),
    ).toThrow('Earned score must be a finite number greater than or equal to zero.')
  })

  it('rejects malformed or impossible dates', () => {
    expect(() =>
      parseActivityInput({ ...validBody(), date: '11/08/2026' }, now),
    ).toThrow('Use a valid activity date (YYYY-MM-DD).')
    expect(() =>
      parseActivityInput({ ...validBody(), date: '2026-02-30' }, now),
    ).toThrow('Use a valid activity date (YYYY-MM-DD).')
  })

  it('validates an update without requiring subject or category IDs', () => {
    expect(
      parseActivityUpdate(
        {
          name: '  Quiz 1 retake  ',
          scoreEarned: 19,
          totalPoints: 20,
          date: '2026-11-09',
        },
        now,
      ),
    ).toEqual({
      name: 'Quiz 1 retake',
      scoreEarned: 19,
      totalPoints: 20,
      date: '2026-11-09',
    })
  })

  it('applies the same score and date rules to updates', () => {
    expect(() =>
      parseActivityUpdate(
        { name: 'Quiz', scoreEarned: 21, totalPoints: 20 },
        now,
      ),
    ).toThrow('Earned score cannot exceed total possible points.')
    expect(() =>
      parseActivityUpdate(
        { name: 'Quiz', scoreEarned: 1, totalPoints: 2, date: 'bad' },
        now,
      ),
    ).toThrow('Use a valid activity date (YYYY-MM-DD).')
  })
})
