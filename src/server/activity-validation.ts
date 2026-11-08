import { validateActivity } from '../lib/grading/grading'
import { HttpError } from './http'

const MAX_NAME = 120
const MAX_ID = 64

export interface ActivityInput {
  subjectId: string
  categoryId: string
  name: string
  scoreEarned: number
  totalPoints: number
  date: string
}

function requireId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `Choose a ${field}.`)
  }
  const id = value.trim()
  if (id.length > MAX_ID) {
    throw new HttpError(400, `The ${field} identifier is invalid.`)
  }
  return id
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function parseDate(value: unknown, now: Date): string {
  if (value === undefined || value === null || value === '') {
    return todayIso(now)
  }
  if (typeof value !== 'string' || !isCalendarDate(value.trim())) {
    throw new HttpError(400, 'Use a valid activity date (YYYY-MM-DD).')
  }
  return value.trim()
}

export function parseActivityInput(
  body: Record<string, unknown>,
  now = new Date(),
): ActivityInput {
  const subjectId = requireId(body.subjectId, 'subject')
  const categoryId = requireId(body.categoryId, 'grading category')

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name.length > MAX_NAME) {
    throw new HttpError(
      400,
      `Activity name must be ${MAX_NAME} characters or fewer.`,
    )
  }

  const scoreEarned =
    typeof body.scoreEarned === 'number' ? body.scoreEarned : Number.NaN
  const totalPoints =
    typeof body.totalPoints === 'number' ? body.totalPoints : Number.NaN

  // Reuse the grading engine's activity rules so the API and calculations agree.
  const validation = validateActivity({
    id: 'pending',
    categoryId,
    name,
    scoreEarned,
    totalPoints,
  })
  if (!validation.valid) {
    throw new HttpError(400, validation.errors[0])
  }

  return {
    subjectId,
    categoryId,
    name,
    scoreEarned,
    totalPoints,
    date: parseDate(body.date, now),
  }
}
