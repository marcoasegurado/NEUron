import type { CreateActivityInput, Subject } from '../../lib/academic-api'

export interface ScoreFormValues {
  subjectId: string
  categoryId: string
  name: string
  scoreEarned: string
  totalPoints: string
  date: string
}

export interface ScoreFormErrors {
  subjectId?: string
  categoryId?: string
  name?: string
  scoreEarned?: string
  totalPoints?: string
  date?: string
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function localToday(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function activeCategories(subject: Subject | undefined) {
  return subject?.categories.filter((category) => category.isActive) ?? []
}

export function createScoreForm(
  subjects: Subject[],
  now = new Date(),
): ScoreFormValues {
  const subject =
    subjects.find((entry) => activeCategories(entry).length > 0) ?? subjects[0]
  const category = activeCategories(subject)[0]

  return {
    subjectId: subject?.id ?? '',
    categoryId: category?.id ?? '',
    name: '',
    scoreEarned: '',
    totalPoints: '',
    date: localToday(now),
  }
}

function parseNumber(value: string): number {
  if (!value.trim()) {
    return Number.NaN
  }
  return Number(value)
}

export function validateScoreForm(
  values: ScoreFormValues,
): ScoreFormErrors {
  const errors: ScoreFormErrors = {}

  if (!values.subjectId) {
    errors.subjectId = 'Choose a subject.'
  }
  if (!values.categoryId) {
    errors.categoryId = 'Choose a grading category.'
  }

  const name = values.name.trim()
  if (!name) {
    errors.name = 'Enter an activity name.'
  } else if (name.length > 120) {
    errors.name = 'Activity name must be 120 characters or fewer.'
  }

  const scoreEarned = parseNumber(values.scoreEarned)
  if (!Number.isFinite(scoreEarned) || scoreEarned < 0) {
    errors.scoreEarned = 'Enter an earned score of zero or greater.'
  }

  const totalPoints = parseNumber(values.totalPoints)
  if (!Number.isFinite(totalPoints) || totalPoints <= 0) {
    errors.totalPoints = 'Enter total points greater than zero.'
  }

  if (
    Number.isFinite(scoreEarned) &&
    Number.isFinite(totalPoints) &&
    totalPoints > 0 &&
    scoreEarned > totalPoints
  ) {
    errors.scoreEarned = 'Earned score cannot exceed total points.'
  }

  if (values.date.trim() && !isCalendarDate(values.date.trim())) {
    errors.date = 'Use a valid date.'
  }

  return errors
}

export function hasScoreErrors(errors: ScoreFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function buildActivityInput(
  values: ScoreFormValues,
): CreateActivityInput {
  return {
    subjectId: values.subjectId,
    categoryId: values.categoryId,
    name: values.name.trim(),
    scoreEarned: Number(values.scoreEarned),
    totalPoints: Number(values.totalPoints),
    date: values.date.trim() || undefined,
  }
}
