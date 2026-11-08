import { describe, expect, it } from 'vitest'
import {
  parseScheduleClassInput,
  parseScheduleClassUpdate,
} from './schedule-validation'

function validBody() {
  return {
    semesterId: ' semester-1 ',
    subjectId: ' subject-1 ',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:30',
    room: '  Room 204  ',
  }
}

describe('schedule validation', () => {
  it('normalizes a valid class entry', () => {
    expect(parseScheduleClassInput(validBody())).toEqual({
      semesterId: 'semester-1',
      subjectId: 'subject-1',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:30',
      room: 'Room 204',
    })
  })

  it('treats an omitted or blank room as null', () => {
    const body = validBody()
    delete (body as { room?: string }).room
    expect(parseScheduleClassInput(body).room).toBeNull()
    expect(parseScheduleClassInput({ ...validBody(), room: '   ' }).room).toBeNull()
  })

  it('requires a semester and subject', () => {
    expect(() =>
      parseScheduleClassInput({ ...validBody(), semesterId: ' ' }),
    ).toThrow('Choose a semester.')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), subjectId: '' }),
    ).toThrow('Choose a subject.')
  })

  it('accepts Monday through Saturday only', () => {
    for (const day of [1, 2, 3, 4, 5, 6]) {
      expect(
        parseScheduleClassInput({ ...validBody(), dayOfWeek: day }).dayOfWeek,
      ).toBe(day)
    }
    expect(() =>
      parseScheduleClassInput({ ...validBody(), dayOfWeek: 0 }),
    ).toThrow('Choose a class day between Monday and Saturday.')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), dayOfWeek: 7 }),
    ).toThrow('Choose a class day between Monday and Saturday.')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), dayOfWeek: 1.5 }),
    ).toThrow('Choose a class day between Monday and Saturday.')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), dayOfWeek: '1' }),
    ).toThrow('Choose a class day between Monday and Saturday.')
  })

  it('rejects malformed times', () => {
    expect(() =>
      parseScheduleClassInput({ ...validBody(), startTime: '8:00' }),
    ).toThrow('Use a valid start time (HH:MM).')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), endTime: '24:00' }),
    ).toThrow('Use a valid end time (HH:MM).')
    expect(() =>
      parseScheduleClassInput({ ...validBody(), endTime: '12:60' }),
    ).toThrow('Use a valid end time (HH:MM).')
  })

  it('requires the end time to be after the start time', () => {
    expect(() =>
      parseScheduleClassInput({
        ...validBody(),
        startTime: '09:00',
        endTime: '09:00',
      }),
    ).toThrow('The end time must be after the start time.')
    expect(() =>
      parseScheduleClassInput({
        ...validBody(),
        startTime: '10:00',
        endTime: '09:00',
      }),
    ).toThrow('The end time must be after the start time.')
  })

  it('rejects an overlong room', () => {
    expect(() =>
      parseScheduleClassInput({ ...validBody(), room: 'a'.repeat(121) }),
    ).toThrow('Room must be 120 characters or fewer.')
  })

  it('validates an update without requiring a semester ID', () => {
    expect(
      parseScheduleClassUpdate({
        subjectId: 'subject-2',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '14:30',
        room: '',
      }),
    ).toEqual({
      subjectId: 'subject-2',
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '14:30',
      room: null,
    })
  })
})
