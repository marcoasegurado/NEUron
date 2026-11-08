import { ApiError, apiRequest } from './api'

export interface Semester {
  id: string
  userId: string
  academicYear: string
  term: string
  label: string
  isActive: boolean
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
  sortOrder: number
  createdAt: string
  updatedAt: string
  categories: GradingCategory[]
}

export interface SemesterSetup {
  semester: Semester
  subjects: Subject[]
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

export function academicErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof ApiError ? error.message : fallback
}
