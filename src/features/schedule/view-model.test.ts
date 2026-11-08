import { describe, expect, it } from 'vitest'
import type {
  GradingCategory,
  ScheduleClass,
  Subject,
} from '../../lib/academic-api'
import {
  buildScheduleView,
  buildTimeAxis,
  dayLabel,
  dayShortLabel,
  entryPosition,
  formatTime,
  formatTimeRange,
  minutesToTime,
  timeToMinutes,
  todayDayOfWeek,
} from './view-model'

function scheduleClass(
  id: string,
  subjectId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  room: string | null = null,
): ScheduleClass {
  return {
    id,
    semesterId: 'semester-1',
    subjectId,
    dayOfWeek,
    startTime,
    endTime,
    room,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }
}

function subject(id: string, name: string): Subject {
  return {
    id,
    semesterId: 'semester-1',
    name,
    units: 3,
    professor: null,
    sortOrder: 0,
    createdAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    categories: [] as GradingCategory[],
  }
}

const subjects = [
  subject('subject-1', 'Mathematics'),
  subject('subject-2', 'Science'),
]

describe('schedule view model', () => {
  it('formats times in 12-hour form', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('08:05')).toBe('8:05 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
    expect(formatTime('13:30')).toBe('1:30 PM')
    expect(formatTimeRange('08:00', '09:30')).toBe(
      '8:00 AM – 9:30 AM',
    )
    expect(timeToMinutes('09:30')).toBe(570)
    expect(minutesToTime(570)).toBe('09:30')
  })

  it('labels Monday through Saturday', () => {
    expect(dayLabel(1)).toBe('Monday')
    expect(dayLabel(6)).toBe('Saturday')
    expect(dayShortLabel(3)).toBe('Wed')
    expect(dayLabel(0)).toBe('Unknown day')
  })

  it('maps Sunday to Monday and keeps Monday through Saturday', () => {
    expect(todayDayOfWeek(new Date('2026-11-08T12:00:00'))).toBe(1)
    expect(todayDayOfWeek(new Date('2026-11-11T12:00:00'))).toBe(3)
    expect(todayDayOfWeek(new Date('2026-11-14T12:00:00'))).toBe(6)
  })

  it('groups classes by day and sorts them by start time', () => {
    const view = buildScheduleView(
      [
        scheduleClass('b', 'subject-2', 1, '10:00', '11:00'),
        scheduleClass('a', 'subject-1', 1, '08:00', '09:00', 'Room 2'),
        scheduleClass('c', 'subject-1', 3, '13:00', '14:00'),
      ],
      subjects,
    )

    expect(view.total).toBe(3)
    expect(view.days).toHaveLength(6)
    expect(view.days[0].entries.map((entry) => entry.class.id)).toEqual([
      'a',
      'b',
    ])
    expect(view.days[0].entries[0].subjectName).toBe('Mathematics')
    expect(view.days[0].entries[0].subjectTone).toBe(0)
    expect(view.days[0].entries[1].subjectTone).toBe(1)
    expect(view.days[2].entries[0].subjectName).toBe('Mathematics')
  })

  it('detects overlaps on the same day only', () => {
    const view = buildScheduleView(
      [
        scheduleClass('a', 'subject-1', 1, '08:00', '09:30'),
        scheduleClass('b', 'subject-2', 1, '09:00', '10:00'),
        scheduleClass('c', 'subject-1', 1, '10:00', '11:00'),
        scheduleClass('d', 'subject-2', 2, '08:00', '09:30'),
      ],
      subjects,
    )

    expect(view.days[0].entries[0].conflicts).toEqual([
      {
        id: 'b',
        subjectName: 'Science',
        startTime: '09:00',
        endTime: '10:00',
      },
    ])
    expect(view.days[0].entries[1].conflicts[0].id).toBe('a')
    expect(view.days[0].entries[2].conflicts).toEqual([])
    expect(view.days[1].entries[0].conflicts).toEqual([])
    expect(view.conflictCount).toBe(2)
  })

  it('builds a default time axis and expands for early or late classes', () => {
    const empty = buildTimeAxis([], 60)
    expect(empty.startHour).toBe(8)
    expect(empty.endHour).toBe(18)
    expect(empty.height).toBe(600)

    const wide = buildTimeAxis(
      [
        scheduleClass('early', 'subject-1', 1, '06:30', '07:30'),
        scheduleClass('late', 'subject-1', 2, '19:15', '21:00'),
      ],
      60,
    )
    expect(wide.startHour).toBe(6)
    expect(wide.endHour).toBe(21)
    expect(wide.height).toBe(15 * 60)
  })

  it('positions classes inside the time axis', () => {
    const axis = buildTimeAxis(
      [scheduleClass('a', 'subject-1', 1, '09:00', '10:30')],
      60,
    )
    const view = buildScheduleView(
      [scheduleClass('a', 'subject-1', 1, '09:00', '10:30')],
      subjects,
    )
    const position = entryPosition(view.days[0].entries[0], axis, 60)

    expect(position.top).toBe(60)
    expect(position.height).toBe(90)
  })
})
