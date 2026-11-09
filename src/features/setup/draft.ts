import type { CreateSemesterInput } from './api'

export const MAX_SUBJECTS = 30
export const MAX_CATEGORIES = 30
const WEIGHT_TOLERANCE = 1e-6
const ACADEMIC_YEAR_PATTERN = /^(\d{4})\s*[-–]\s*(\d{4})$/

let draftSequence = 0

function createDraftId(prefix: string): string {
  draftSequence += 1
  return `${prefix}-${Date.now()}-${draftSequence}`
}

export interface CategoryDraft {
  id: string
  name: string
  weight: string
}

export interface SubjectDraft {
  id: string
  name: string
  units: string
  professor: string
  categories: CategoryDraft[]
}

export interface SetupDraft {
  academicYear: string
  term: string
  label: string
  subjects: SubjectDraft[]
}

export interface BasicErrors {
  academicYear?: string
  term?: string
  label?: string
  subjects?: string
}

export interface CategoryErrors {
  name?: string
  weight?: string
}

export interface SubjectErrors {
  name?: string
  units?: string
  categories?: string
  categoryErrors: Record<string, CategoryErrors>
}

export type SubjectErrorsMap = Record<string, SubjectErrors>

export function createCategoryDraft(): CategoryDraft {
  return {
    id: createDraftId('category'),
    name: '',
    weight: '',
  }
}

export function createSubjectDraft(): SubjectDraft {
  return {
    id: createDraftId('subject'),
    name: '',
    units: '',
    professor: '',
    categories: [createCategoryDraft()],
  }
}

export function currentAcademicYear(now = new Date()): string {
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-${year + 1}`
}

export function createInitialDraft(now = new Date()): SetupDraft {
  return {
    academicYear: currentAcademicYear(now),
    term: '1st Semester',
    label: '',
    subjects: [createSubjectDraft()],
  }
}

export function resizeSubjects(
  draft: SetupDraft,
  count: number,
): SetupDraft {
  const target = Math.min(
    MAX_SUBJECTS,
    Math.max(1, Math.floor(Number.isFinite(count) ? count : 1)),
  )
  const subjects = draft.subjects.slice(0, target)
  while (subjects.length < target) {
    subjects.push(createSubjectDraft())
  }
  return { ...draft, subjects }
}

export function getWeightTotal(categories: CategoryDraft[]): number {
  return categories.reduce((total, category) => {
    const weight = Number(category.weight)
    return total + (Number.isFinite(weight) ? weight : 0)
  }, 0)
}

export function formatWeight(value: number): string {
  return String(Math.round(value * 100) / 100)
}

export function validateBasics(draft: SetupDraft): BasicErrors {
  const errors: BasicErrors = {}
  const academicYear = draft.academicYear.trim()

  if (!academicYear) {
    errors.academicYear = 'Enter the academic year.'
  } else if (!ACADEMIC_YEAR_PATTERN.test(academicYear)) {
    errors.academicYear = 'Use an academic year such as 2026-2027.'
  }

  if (!draft.term.trim()) {
    errors.term = 'Choose the semester term.'
  }

  if (draft.label.trim().length > 80) {
    errors.label = 'Semester label must be 80 characters or fewer.'
  }

  if (draft.subjects.length < 1 || draft.subjects.length > MAX_SUBJECTS) {
    errors.subjects = `Choose between 1 and ${MAX_SUBJECTS} subjects.`
  }

  return errors
}

export function validateSubjectDraft(
  subject: SubjectDraft,
  takenNames: Iterable<string> = [],
): SubjectErrors {
  const taken = new Set(
    Array.from(takenNames, (name) => name.trim().toLowerCase()),
  )
  const subjectError: SubjectErrors = { categoryErrors: {} }
  const name = subject.name.trim()

  if (!name) {
    subjectError.name = 'Enter the subject name.'
  } else if (taken.has(name.toLowerCase())) {
    subjectError.name = 'Subject names must be unique.'
  }

  const unitsText = subject.units.trim()
  const units = Number(unitsText)
  if (!unitsText || !Number.isFinite(units) || units <= 0) {
    subjectError.units = 'Units must be greater than zero.'
  }

  if (subject.categories.length === 0) {
    subjectError.categories = 'Add at least one grading category.'
  } else {
    const categoryNames = new Set<string>()
    let totalWeight = 0
    let hasCategoryFieldError = false

    for (const category of subject.categories) {
      const categoryError: CategoryErrors = {}
      const categoryName = category.name.trim()

      if (!categoryName) {
        categoryError.name = 'Enter the category name.'
      } else {
        const key = categoryName.toLowerCase()
        if (categoryNames.has(key)) {
          categoryError.name = 'Category names must be unique.'
        }
        categoryNames.add(key)
      }

      const weightText = category.weight.trim()
      const weight = Number(weightText)
      if (
        !weightText ||
        !Number.isFinite(weight) ||
        weight <= 0 ||
        weight > 100
      ) {
        categoryError.weight = 'Use a weight from 0.01 to 100.'
      } else {
        totalWeight += weight
      }

      if (Object.keys(categoryError).length > 0) {
        hasCategoryFieldError = true
        subjectError.categoryErrors[category.id] = categoryError
      }
    }

    if (
      !hasCategoryFieldError &&
      Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE
    ) {
      subjectError.categories = `Weights total ${formatWeight(totalWeight)}%; they must total 100%.`
    }
  }

  return subjectError
}

export function validateSubjects(draft: SetupDraft): SubjectErrorsMap {
  const errors: SubjectErrorsMap = {}
  const subjectNames = new Set<string>()

  for (const subject of draft.subjects) {
    const subjectError = validateSubjectDraft(subject, subjectNames)
    const name = subject.name.trim().toLowerCase()

    if (name && !subjectError.name) {
      subjectNames.add(name)
    }

    if (hasSubjectError(subjectError)) {
      errors[subject.id] = subjectError
    }
  }

  return errors
}

export function hasBasicErrors(errors: BasicErrors): boolean {
  return Object.keys(errors).length > 0
}

export function hasSubjectError(errors: SubjectErrors): boolean {
  return Boolean(
    errors.name ||
      errors.units ||
      errors.categories ||
      Object.keys(errors.categoryErrors).length > 0,
  )
}

export function hasSubjectErrors(errors: SubjectErrorsMap): boolean {
  return Object.values(errors).some(hasSubjectError)
}

export function buildCreateInput(draft: SetupDraft): CreateSemesterInput {
  return {
    academicYear: draft.academicYear.trim(),
    term: draft.term.trim(),
    label: draft.label.trim() || undefined,
    subjects: draft.subjects.map((subject) => ({
      name: subject.name.trim(),
      units: Number(subject.units),
      professor: subject.professor.trim() || null,
      categories: subject.categories.map((category) => ({
        name: category.name.trim(),
        weightPercent: Number(category.weight),
      })),
    })),
  }
}
