import type { ScheduleClass, Subject } from '../../lib/academic-api'

export const SCHEDULE_DAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
] as const

export type ScheduleDayValue = (typeof SCHEDULE_DAYS)[number]['value']

export interface ScheduleConflict {
  id: string
  subjectName: string
  startTime: string
  endTime: string
}

export interface ScheduleEntry {
  class: ScheduleClass
  subjectName: string
  subjectTone: number
  conflicts: ScheduleConflict[]
}

export interface ScheduleDayView {
  dayOfWeek: ScheduleDayValue
  shortLabel: string
  label: string
  entries: ScheduleEntry[]
}

export interface ScheduleView {
  days: ScheduleDayView[]
  total: number
  conflictCount: number
}

export function dayLabel(dayOfWeek: number): string {
  return (
    SCHEDULE_DAYS.find((day) => day.value === dayOfWeek)?.long ?? 'Unknown day'
  )
}

export function dayShortLabel(dayOfWeek: number): string {
  return (
    SCHEDULE_DAYS.find((day) => day.value === dayOfWeek)?.short ?? '—'
  )
}

export function todayDayOfWeek(now = new Date()): ScheduleDayValue {
  const day = now.getDay()
  if (day === 0) {
    return 1
  }
  return day as ScheduleDayValue
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function minutesToTime(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`
}

export function formatTime(time: string): string {
  const minutes = timeToMinutes(time)
  const hours24 = Math.floor(minutes / 60)
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${pad(minutes % 60)} ${suffix}`
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}

function overlaps(a: ScheduleClass, b: ScheduleClass): boolean {
  return (
    a.dayOfWeek === b.dayOfWeek &&
    a.startTime < b.endTime &&
    b.startTime < a.endTime
  )
}

export function buildScheduleView(
  classes: ScheduleClass[],
  subjects: Subject[],
): ScheduleView {
  const subjectIndex = new Map(
    subjects.map((subject, index) => [subject.id, index]),
  )
  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  )
  const sorted = [...classes].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime) ||
      a.subjectId.localeCompare(b.subjectId),
  )

  const days: ScheduleDayView[] = SCHEDULE_DAYS.map((day) => {
    const dayClasses = sorted.filter(
      (entry) => entry.dayOfWeek === day.value,
    )

    return {
      dayOfWeek: day.value,
      shortLabel: day.short,
      label: day.long,
      entries: dayClasses.map((entry) => ({
        class: entry,
        subjectName:
          subjectNames.get(entry.subjectId) ?? 'Unknown subject',
        subjectTone: (subjectIndex.get(entry.subjectId) ?? 0) % 5,
        conflicts: dayClasses
          .filter(
            (other) => other.id !== entry.id && overlaps(entry, other),
          )
          .map((other) => ({
            id: other.id,
            subjectName:
              subjectNames.get(other.subjectId) ?? 'Unknown subject',
            startTime: other.startTime,
            endTime: other.endTime,
          })),
      })),
    }
  })

  return {
    days,
    total: sorted.length,
    conflictCount: days.reduce(
      (count, day) =>
        count +
        day.entries.filter((entry) => entry.conflicts.length > 0).length,
      0,
    ),
  }
}

export interface TimeAxis {
  startHour: number
  endHour: number
  hours: number[]
  height: number
}

export function buildTimeAxis(
  classes: ScheduleClass[],
  hourHeight = 64,
): TimeAxis {
  if (classes.length === 0) {
    return {
      startHour: 8,
      endHour: 18,
      hours: Array.from({ length: 10 }, (_, index) => index + 8),
      height: 10 * hourHeight,
    }
  }

  let earliest = Number.POSITIVE_INFINITY
  let latest = Number.NEGATIVE_INFINITY
  for (const entry of classes) {
    earliest = Math.min(earliest, timeToMinutes(entry.startTime))
    latest = Math.max(latest, timeToMinutes(entry.endTime))
  }

  const startHour = Math.max(0, Math.min(8, Math.floor(earliest / 60)))
  const endHour = Math.min(24, Math.max(18, Math.ceil(latest / 60)))
  const hours = Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index,
  )

  return {
    startHour,
    endHour,
    hours,
    height: hours.length * hourHeight,
  }
}

export function entryPosition(
  entry: ScheduleEntry,
  axis: TimeAxis,
  hourHeight = 64,
): { top: number; height: number } {
  const start = timeToMinutes(entry.class.startTime)
  const end = timeToMinutes(entry.class.endTime)
  const top = ((start - axis.startHour * 60) / 60) * hourHeight
  const height = Math.max(((end - start) / 60) * hourHeight, 28)
  return { top, height }
}
