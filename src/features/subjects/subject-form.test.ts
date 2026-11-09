import { describe, expect, it } from 'vitest'
import {
  addSubjectCategory,
  buildCreateSubjectInput,
  createSubjectForm,
  removeSubjectCategory,
  validateSubjectForm,
} from './subject-form'

function validForm() {
  return {
    ...createSubjectForm(),
    name: '  History  ',
    units: '3',
    professor: '  Mr. Santos  ',
    categories: [
      { id: 'category-1', name: '  Quizzes  ', weight: '40' },
      { id: 'category-2', name: 'Exams', weight: '60' },
    ],
  }
}

describe('subject form', () => {
  it('starts with one empty category', () => {
    const form = createSubjectForm()
    expect(form.categories).toHaveLength(1)
  })

  it('validates a complete subject', () => {
    expect(validateSubjectForm(validForm())).toEqual({ categoryErrors: {} })
  })

  it('requires a name, positive units, and complete categories', () => {
    const errors = validateSubjectForm({
      ...createSubjectForm(),
      name: '',
      units: '0',
      categories: [{ id: 'category-1', name: '', weight: '' }],
    })

    expect(errors.name).toBe('Enter the subject name.')
    expect(errors.units).toBe('Units must be greater than zero.')
    expect(errors.categoryErrors['category-1']).toEqual({
      name: 'Enter the category name.',
      weight: 'Use a weight from 0.01 to 100.',
    })
  })

  it('rejects a subject name already used in the semester', () => {
    const errors = validateSubjectForm(validForm(), ['history'])
    expect(errors.name).toBe('Subject names must be unique.')
  })

  it('requires the weights to total 100%', () => {
    const form = validForm()
    form.categories = [
      { id: 'category-1', name: 'Quizzes', weight: '40' },
      { id: 'category-2', name: 'Exams', weight: '50' },
    ]

    expect(validateSubjectForm(form).categories).toBe(
      'Weights total 90%; they must total 100%.',
    )
  })

  it('builds the API input with trimmed text and numbers', () => {
    expect(buildCreateSubjectInput(validForm())).toEqual({
      name: 'History',
      units: 3,
      professor: 'Mr. Santos',
      categories: [
        { name: 'Quizzes', weightPercent: 40 },
        { name: 'Exams', weightPercent: 60 },
      ],
    })
  })

  it('adds and removes categories but keeps at least one', () => {
    const form = validForm()
    const added = addSubjectCategory(form)
    expect(added.categories).toHaveLength(3)

    const removed = removeSubjectCategory(added, 'category-2')
    expect(removed.categories.map((category) => category.id)).toEqual([
      'category-1',
      added.categories[2].id,
    ])

    expect(removeSubjectCategory({ ...form, categories: [form.categories[0]] }, 'category-1')).toEqual({
      ...form,
      categories: [form.categories[0]],
    })
  })
})
