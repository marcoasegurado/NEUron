import { describe, expect, it } from 'vitest'
import { parseSemesterSetup } from './academic-validation'

function validBody() {
  return {
    academicYear: '2026-2027',
    term: '1st Semester',
    subjects: [
      {
        name: 'Mathematics',
        units: 3,
        professor: '  Ms. Cruz  ',
        categories: [
          { name: 'Quizzes', weightPercent: 40 },
          { name: 'Exams', weightPercent: 60 },
        ],
      },
    ],
  }
}

describe('semester setup validation', () => {
  it('normalizes a valid setup and derives the default label', () => {
    const result = parseSemesterSetup(validBody())
    expect(result.academicYear).toBe('2026-2027')
    expect(result.label).toBe('1st Semester 2026-2027')
    expect(result.subjects[0].professor).toBe('Ms. Cruz')
    expect(result.subjects[0].categories).toHaveLength(2)
  })

  it('accepts en dashes, decimal units, and decimal weights', () => {
    const body = validBody()
    body.academicYear = '2026 – 2027'
    body.subjects[0].units = 3.5
    body.subjects[0].categories = [
      { name: 'Quizzes', weightPercent: 33.33 },
      { name: 'Exams', weightPercent: 66.67 },
    ]

    const result = parseSemesterSetup(body)
    expect(result.academicYear).toBe('2026-2027')
    expect(result.subjects[0].units).toBe(3.5)
    expect(result.subjects[0].categories[1].weightPercent).toBe(66.67)
  })

  it('requires at least one subject', () => {
    const body = validBody()
    body.subjects = []
    expect(() => parseSemesterSetup(body)).toThrow('Add at least one subject.')
  })

  it('requires at least one category per subject', () => {
    const body = validBody()
    body.subjects[0].categories = []
    expect(() => parseSemesterSetup(body)).toThrow(
      'Add at least one grading category',
    )
  })

  it('requires units greater than zero', () => {
    const body = validBody()
    body.subjects[0].units = 0
    expect(() => parseSemesterSetup(body)).toThrow(
      'Subject units must be greater than zero.',
    )
  })

  it('requires active category weights to total 100%', () => {
    const body = validBody()
    body.subjects[0].categories = [
      { name: 'Quizzes', weightPercent: 40 },
      { name: 'Exams', weightPercent: 50 },
    ]
    expect(() => parseSemesterSetup(body)).toThrow(
      'Grading weights for "Mathematics" must total 100%.',
    )
  })

  it('rejects invalid weights', () => {
    const body = validBody()
    body.subjects[0].categories = [
      { name: 'Quizzes', weightPercent: 0 },
      { name: 'Exams', weightPercent: 100 },
    ]
    expect(() => parseSemesterSetup(body)).toThrow(
      'Category weight must be greater than 0',
    )
  })

  it('rejects duplicate subject and category names', () => {
    const duplicateSubject = validBody()
    duplicateSubject.subjects.push({
      name: 'mathematics',
      units: 3,
      professor: '',
      categories: [{ name: 'Exams', weightPercent: 100 }],
    })
    expect(() => parseSemesterSetup(duplicateSubject)).toThrow(
      'Subject "mathematics" is duplicated.',
    )

    const duplicateCategory = validBody()
    duplicateCategory.subjects[0].categories = [
      { name: 'Exams', weightPercent: 50 },
      { name: 'exams', weightPercent: 50 },
    ]
    expect(() => parseSemesterSetup(duplicateCategory)).toThrow(
      'Grading category "exams" is duplicated',
    )
  })

  it('rejects malformed academic years', () => {
    const body = validBody()
    body.academicYear = '2026/2027'
    expect(() => parseSemesterSetup(body)).toThrow(
      'Use an academic year such as 2026-2027.',
    )
  })
})
