import type {
  CreateScheduleClassInput,
  ScheduleClass,
  Subject,
  UpdateScheduleClassInput,
} from '../../lib/academic-api'
import {
  SCHEDULE_DAYS,
  timeToMinutes,
  type ScheduleDayValue,
} from './view-model'

export interface ClassFormValues {
  subjectId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
}

export interface ClassFormErrors {
  subjectId?: string
  dayOfWeek?: string
  startTime?: string
  endTime?: string
  room?: string
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const MAX_ROOM = 120

export function createClassForm(
  subjects: Subject[],
  selectedDay: ScheduleDayValue,
  entry?: ScheduleClass,
): ClassFormValues {
  if (entry) {
    return {
      subjectId: entry.subjectId,
      dayOfWeek: String(entry.dayOfWeek),
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room ?? '',
    }
  }

  return {
    subjectId: subjects[0]?.id ?? '',
    dayOfWeek: String(selectedDay),
    startTime: '08:00',
    endTime: '09:00',
    room: '',
  }
}

export function validateClassForm(
  values: ClassFormValues,
): ClassFormErrors {
  const errors: ClassFormErrors = {}

  if (!values.subjectId) {
    errors.subjectId = 'Choose a subject.'
  }

  const day = Number(values.dayOfWeek)
  if (!SCHEDULE_DAYS.some((entry) => entry.value === day)) {
    errors.dayOfWeek = 'Choose a day between Monday and Saturday.'
  }

  if (!TIME_PATTERN.test(values.startTime.trim())) {
    errors.startTime = 'Use a valid start time.'
  }
  if (!TIME_PATTERN.test(values.endTime.trim())) {
    errors.endTime = 'Use a valid end time.'
  }
  if (
    !errors.startTime &&
    !errors.endTime &&
    values.startTime.trim() >= values.endTime.trim()
  ) {
    errors.endTime = 'The end time must be after the start time.'
  }

  if (values.room.trim().length > MAX_ROOM) {
    errors.room = `Room must be ${MAX_ROOM} characters or fewer.`
  }

  return errors
}

export function hasClassErrors(errors: ClassFormErrors): boolean {
  return Object.keys(errors).length > 0
}

function roomValue(value: string): string | null {
  return value.trim() || null
}

export function buildCreateClassInput(
  values: ClassFormValues,
  semesterId: string,
): CreateScheduleClassInput {
  return {
    semesterId,
    subjectId: values.subjectId,
    dayOfWeek: Number(values.dayOfWeek),
    startTime: values.startTime.trim(),
    endTime: values.endTime.trim(),
    room: roomValue(values.room),
  }
}

export function buildUpdateClassInput(
  values: ClassFormValues,
): UpdateScheduleClassInput {
  return {
    subjectId: values.subjectId,
    dayOfWeek: Number(values.dayOfWeek),
    startTime: values.startTime.trim(),
    endTime: values.endTime.trim(),
    room: roomValue(values.room),
  }
}

export function draftConflicts(
  values: ClassFormValues,
  classes: ScheduleClass[],
  excludeId?: string,
): ScheduleClass[] {
  if (
    !TIME_PATTERN.test(values.startTime.trim()) ||
    !TIME_PATTERN.test(values.endTime.trim()) ||
    values.startTime >= values.endTime
  ) {
    return []
  }

  const day = Number(values.dayOfWeek)
  const start = timeToMinutes(values.startTime)
  const end = timeToMinutes(values.endTime)

  return classes.filter(
    (entry) =>
      entry.id !== excludeId &&
      entry.dayOfWeek === day &&
      start < timeToMinutes(entry.endTime) &&
      timeToMinutes(entry.startTime) < end,
  )
}
