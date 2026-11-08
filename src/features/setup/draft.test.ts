import { describe, expect, it } from 'vitest'
import {
  buildCreateInput,
  createInitialDraft,
  hasBasicErrors,
  hasSubjectErrors,
  resizeSubjects,
  validateBasics,
  validateSubjects,
  type SetupDraft,
} from './draft'

function validDraft(): SetupDraft {
  const draft = createInitialDraft(new Date('2026-11-08T00:00:00.000Z'))
  draft.subjects[0] = {
    ...draft.subjects[0],
    name: 'Mathematics',
    units: '3.5',
    professor: 'Ms. Cruz',
    categories: [
      {
        id: 'category-1',
        name: 'Quizzes',
        weight: '40',
      },
      {
        id: 'category-2',
        name: 'Exams',
        weight: '60',
      },
    ],
  }
  return draft
}

describe('semester setup drafts', () => {
  it('accepts a complete draft', () => {
    const draft = validDraft()
    expect(hasBasicErrors(validateBasics(draft))).toBe(false)
    expect(hasSubjectErrors(validateSubjects(draft))).toBe(false)
  })

  it('builds the API payload with numeric units and weights', () => {
    const input = buildCreateInput(validDraft())
    expect(input.academicYear).toBe('2026-2027')
    expect(input.label).toBeUndefined()
    expect(input.subjects[0].units).toBe(3.5)
    expect(input.subjects[0].categories[1].weightPercent).toBe(60)
  })

  it('requires a valid academic year', () => {
    const draft = validDraft()
    draft.academicYear = '2026/2027'
    expect(validateBasics(draft).academicYear).toContain('2026-2027')
  })

  it('rejects missing subject details', () => {
    const draft = validDraft()
    draft.subjects[0].name = ''
    draft.subjects[0].units = '0'
    const errors = validateSubjects(draft)
    expect(errors[draft.subjects[0].id].name).toBe('Enter the subject name.')
    expect(errors[draft.subjects[0].id].units).toContain('greater than zero')
  })

  it('rejects weights that do not total 100%', () => {
    const draft = validDraft()
    draft.subjects[0].categories[1].weight = '50'
    const errors = validateSubjects(draft)
    expect(errors[draft.subjects[0].id].categories).toContain('must total 100%')
  })

  it('rejects duplicate subject and category names', () => {
    const draft = validDraft()
    draft.subjects.push({
      ...validDraft().subjects[0],
      id: 'subject-2',
      name: 'mathematics',
    })
    expect(Object.keys(validateSubjects(draft))).toHaveLength(1)

    const categoryDraft = validDraft()
    categoryDraft.subjects[0].categories[1].name = 'quizzes'
    const errors = validateSubjects(categoryDraft)
    expect(
      errors[categoryDraft.subjects[0].id].categoryErrors[
        categoryDraft.subjects[0].categories[1].id
      ].name,
    ).toContain('unique')
  })

  it('resizes subject drafts without losing existing entries', () => {
    const draft = resizeSubjects(validDraft(), 3)
    expect(draft.subjects).toHaveLength(3)
    expect(draft.subjects[0].name).toBe('Mathematics')
    expect(resizeSubjects(draft, 1).subjects).toHaveLength(1)
  })
})
