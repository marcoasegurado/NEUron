import { HttpError } from './http'

export const MAX_SUBJECTS = 30
const MAX_CATEGORIES = 30
const MAX_SUBJECT_NAME = 120
const MAX_PROFESSOR = 120
const MAX_CATEGORY_NAME = 80
const MAX_ACADEMIC_YEAR = 20
const MAX_TERM = 40
const MAX_LABEL = 80
const WEIGHT_TOLERANCE = 1e-6

export interface CategorySetupInput {
  name: string
  weightPercent: number
}

export interface SubjectSetupInput {
  name: string
  units: number
  professor: string | null
  categories: CategorySetupInput[]
}

export interface SemesterSetupInput {
  academicYear: string
  term: string
  label: string
  subjects: SubjectSetupInput[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requireText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `Enter ${field}.`)
  }
  const text = value.trim()
  if (text.length > maxLength) {
    throw new HttpError(
      400,
      `${field[0].toUpperCase()}${field.slice(1)} must be ${maxLength} characters or fewer.`,
    )
  }
  return text
}

function normalizeAcademicYear(value: unknown): string {
  const text = requireText(value, 'academic year', MAX_ACADEMIC_YEAR)
  const match = text.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
  if (!match) {
    throw new HttpError(400, 'Use an academic year such as 2026-2027.')
  }
  return `${match[1]}-${match[2]}`
}

function requireUnits(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new HttpError(400, 'Subject units must be greater than zero.')
  }
  return value
}

function optionalProfessor(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Professor must be text.')
  }
  const professor = value.trim()
  if (!professor) {
    return null
  }
  if (professor.length > MAX_PROFESSOR) {
    throw new HttpError(
      400,
      `Professor must be ${MAX_PROFESSOR} characters or fewer.`,
    )
  }
  return professor
}

function requireWeight(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 100
  ) {
    throw new HttpError(
      400,
      'Category weight must be greater than 0 and at most 100.',
    )
  }
  return value
}

function parseCategories(value: unknown): CategorySetupInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(
      400,
      'Add at least one grading category to each subject.',
    )
  }
  if (value.length > MAX_CATEGORIES) {
    throw new HttpError(
      400,
      `Each subject can have at most ${MAX_CATEGORIES} grading categories.`,
    )
  }

  const names = new Set<string>()
  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new HttpError(400, `Grading category ${index + 1} is invalid.`)
    }
    const name = requireText(
      entry.name,
      `grading category ${index + 1} name`,
      MAX_CATEGORY_NAME,
    )
    const key = name.toLowerCase()
    if (names.has(key)) {
      throw new HttpError(
        400,
        `Grading category "${name}" is duplicated in one subject.`,
      )
    }
    names.add(key)
    return {
      name,
      weightPercent: requireWeight(entry.weightPercent),
    }
  })
}

function parseSubjectRecord(
  entry: unknown,
  nameField: string,
  names: Set<string>,
): SubjectSetupInput {
  if (!isRecord(entry)) {
    throw new HttpError(400, 'Subject details are invalid.')
  }
  const name = requireText(entry.name, nameField, MAX_SUBJECT_NAME)
  const key = name.toLowerCase()
  if (names.has(key)) {
    throw new HttpError(400, `Subject "${name}" is duplicated.`)
  }
  names.add(key)

  const categories = parseCategories(entry.categories)
  const totalWeight = categories.reduce(
    (total, category) => total + category.weightPercent,
    0,
  )
  if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE) {
    throw new HttpError(
      400,
      `Grading weights for "${name}" must total 100%.`,
    )
  }

  return {
    name,
    units: requireUnits(entry.units),
    professor: optionalProfessor(entry.professor),
    categories,
  }
}

function parseSubjects(value: unknown): SubjectSetupInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'Add at least one subject.')
  }
  if (value.length > MAX_SUBJECTS) {
    throw new HttpError(
      400,
      `A semester can have at most ${MAX_SUBJECTS} subjects.`,
    )
  }

  const names = new Set<string>()
  return value.map((entry, index) =>
    parseSubjectRecord(entry, `subject ${index + 1} name`, names),
  )
}

export function parseSubjectSetup(
  body: Record<string, unknown>,
  existingNames: Iterable<string> = [],
): SubjectSetupInput {
  const names = new Set(
    Array.from(existingNames, (name) => name.trim().toLowerCase()),
  )
  return parseSubjectRecord(body, 'subject name', names)
}

export function parseSemesterSetup(
  body: Record<string, unknown>,
): SemesterSetupInput {
  const academicYear = normalizeAcademicYear(body.academicYear)
  const term = requireText(body.term, 'semester term', MAX_TERM)
  const label =
    typeof body.label === 'string' && body.label.trim()
      ? requireText(body.label, 'semester label', MAX_LABEL)
      : `${term} ${academicYear}`

  return {
    academicYear,
    term,
    label,
    subjects: parseSubjects(body.subjects),
  }
}
