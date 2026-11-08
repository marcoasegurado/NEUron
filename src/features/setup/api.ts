import { ApiError } from '../../lib/api'

export {
  activateSemester,
  createActivity,
  createSemester,
  getSemester,
  listSemesters,
} from '../../lib/academic-api'

export type {
  Activity,
  CreateActivityInput,
  CreateSemesterInput,
  GradingCategory,
  Semester,
  SemesterSetup,
  Subject,
} from '../../lib/academic-api'

export function setupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Could not save the semester. Check your connection and try again.'
}
