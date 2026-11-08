import { ApiError, apiRequest } from '../../lib/api'

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

export interface GradingCategory {
  id: string
  subjectId: string
  name: string
  weightPercent: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
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

export async function createSemester(
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

export function setupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Could not save the semester. Check your connection and try again.'
}
