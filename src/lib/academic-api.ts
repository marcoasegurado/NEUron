import { ApiError, apiRequest } from './api'

export interface Semester {
  id: string
  userId: string
  academicYear: string
  term: string
  label: string
  isActive: boolean
  units?: number
  subjectCount?: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  categoryId: string
  name: string
  scoreEarned: number
  totalPoints: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface GradingCategory {
  id: string
  subjectId: string
  name: string
  weightPercent: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  activities: Activity[]
}

export interface Subject {
  id: string
  semesterId: string
  name: string
  units: number
  professor: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  categories: GradingCategory[]
}

export interface SemesterSetup {
  semester: Semester
  subjects: Subject[]
}

export interface ScheduleClass {
  id: string
  semesterId: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSemesterInput {
  academicYear: string
  term: string
  label?: string
  subjects: Array<{
    name: string
    units: number
    professor?: string | null
    categories: Array<{
      name: string
      weightPercent: number
    }>
  }>
}

export interface CreateSubjectInput {
  name: string
  units: number
  professor?: string | null
  categories: Array<{
    name: string
    weightPercent: number
  }>
}

export interface CreateActivityInput {
  subjectId: string
  categoryId: string
  name: string
  scoreEarned: number
  totalPoints: number
  date?: string
}

export interface UpdateActivityInput {
  name: string
  scoreEarned: number
  totalPoints: number
  date?: string
}

export interface CreateScheduleClassInput {
  semesterId: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
}

export interface UpdateScheduleClassInput {
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
}

export function listSemesters(): Promise<{ semesters: Semester[] }> {
  return apiRequest<{ semesters: Semester[] }>('/api/semesters')
}

export function getSemester(semesterId: string): Promise<SemesterSetup> {
  return apiRequest<SemesterSetup>(
    `/api/semesters/${encodeURIComponent(semesterId)}`,
  )
}

export function createSemester(
  input: CreateSemesterInput,
): Promise<SemesterSetup> {
  return apiRequest<SemesterSetup>('/api/semesters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export function activateSemester(
  semesterId: string,
): Promise<{ semester: Semester }> {
  return apiRequest<{ semester: Semester }>(
    `/api/semesters/${encodeURIComponent(semesterId)}/activate`,
    { method: 'POST' },
  )
}

export function createSubject(
  semesterId: string,
  input: CreateSubjectInput,
): Promise<{ subject: Subject }> {
  return apiRequest<{ subject: Subject }>(
    `/api/semesters/${encodeURIComponent(semesterId)}/subjects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )
}

export function updateSubjectStatus(
  subjectId: string,
  active: boolean,
): Promise<{ subject: Subject }> {
  return apiRequest<{ subject: Subject }>(
    `/api/subjects/${encodeURIComponent(subjectId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
    },
  )
}

export function createActivity(
  input: CreateActivityInput,
): Promise<{ activity: Activity }> {
  return apiRequest<{ activity: Activity }>('/api/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export function updateActivity(
  activityId: string,
  input: UpdateActivityInput,
): Promise<{ activity: Activity }> {
  return apiRequest<{ activity: Activity }>(
    `/api/activities/${encodeURIComponent(activityId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )
}

export function deleteActivity(activityId: string): Promise<void> {
  return apiRequest<void>(
    `/api/activities/${encodeURIComponent(activityId)}`,
    { method: 'DELETE' },
  )
}

export function getSchedule(
  semesterId: string,
): Promise<{ classes: ScheduleClass[] }> {
  return apiRequest<{ classes: ScheduleClass[] }>(
    `/api/semesters/${encodeURIComponent(semesterId)}/schedule`,
  )
}

export function createScheduleClass(
  input: CreateScheduleClassInput,
): Promise<{ class: ScheduleClass }> {
  return apiRequest<{ class: ScheduleClass }>('/api/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export function updateScheduleClass(
  classId: string,
  input: UpdateScheduleClassInput,
): Promise<{ class: ScheduleClass }> {
  return apiRequest<{ class: ScheduleClass }>(
    `/api/schedule/${encodeURIComponent(classId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )
}

export function deleteScheduleClass(classId: string): Promise<void> {
  return apiRequest<void>(`/api/schedule/${encodeURIComponent(classId)}`, {
    method: 'DELETE',
  })
}

export function academicErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof ApiError ? error.message : fallback
}
