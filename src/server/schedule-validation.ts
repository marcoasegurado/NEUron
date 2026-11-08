import { HttpError } from './http'

const MAX_ID = 64
const MAX_ROOM = 120
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export interface ScheduleClassFields {
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
}

export interface ScheduleClassInput extends ScheduleClassFields {
  semesterId: string
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

function parseDay(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 6
  ) {
    throw new HttpError(400, 'Choose a class day between Monday and Saturday.')
  }
  return value
}

function parseTime(value: unknown, label: string): string {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value.trim())) {
    throw new HttpError(400, `Use a valid ${label} time (HH:MM).`)
  }
  return value.trim()
}

function parseRoom(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Room must be text.')
  }
  const room = value.trim()
  if (!room) {
    return null
  }
  if (room.length > MAX_ROOM) {
    throw new HttpError(
      400,
      `Room must be ${MAX_ROOM} characters or fewer.`,
    )
  }
  return room
}

function parseFields(body: Record<string, unknown>): ScheduleClassFields {
  const startTime = parseTime(body.startTime, 'start')
  const endTime = parseTime(body.endTime, 'end')

  if (startTime >= endTime) {
    throw new HttpError(400, 'The end time must be after the start time.')
  }

  return {
    subjectId: requireId(body.subjectId, 'subject'),
    dayOfWeek: parseDay(body.dayOfWeek),
    startTime,
    endTime,
    room: parseRoom(body.room),
  }
}

export function parseScheduleClassInput(
  body: Record<string, unknown>,
): ScheduleClassInput {
  return {
    semesterId: requireId(body.semesterId, 'semester'),
    ...parseFields(body),
  }
}

export function parseScheduleClassUpdate(
  body: Record<string, unknown>,
): ScheduleClassFields {
  return parseFields(body)
}
