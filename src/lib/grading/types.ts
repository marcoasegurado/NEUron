export interface Activity {
  id: string
  name: string
  categoryId: string
  scoreEarned: number
  totalPoints: number
  date?: string
}

export interface GradingCategory {
  id: string
  name: string
  weight: number
  active?: boolean
  sortOrder?: number
}

export interface Subject {
  id: string
  name: string
  units: number
  professor?: string
  active?: boolean
  categories: GradingCategory[]
  activities: Activity[]
}

export interface ConversionRow {
  minimumPercentage: number
  grade: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface WeightValidation extends ValidationResult {
  total: number
  direction?: 'below' | 'above'
}

export type CategoryResult =
  | {
      status: 'complete'
      average: number
      earned: number
      total: number
      activityCount: number
    }
  | { status: 'incomplete'; reason: 'no-activities' }

export type SubjectPendingReason =
  | 'no-categories'
  | 'invalid-weights'
  | 'invalid-activities'
  | 'incomplete-categories'
  | 'no-conversion'

export interface SubjectPendingResult {
  status: 'pending'
  reason: SubjectPendingReason
  incompleteCategoryIds: string[]
}

export type SubjectPercentageResult =
  | { status: 'graded'; percentage: number }
  | SubjectPendingResult

export type SubjectGradeResult =
  | { status: 'graded'; percentage: number; grade: number }
  | SubjectPendingResult

export type SemesterGwaResult =
  | { status: 'graded'; gwa: number }
  | {
      status: 'pending'
      reason: 'incomplete-subjects'
      pendingSubjectIds: string[]
    }
  | { status: 'empty' }
