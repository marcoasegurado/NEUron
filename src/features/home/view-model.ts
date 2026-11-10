import type { Subject as ApiSubject } from '../../lib/academic-api'
import { toGradingSubject } from '../../lib/academic-grading'
import {
  calculateCategoryAverage,
  calculateSemesterGwa,
  calculateSubjectGrade,
  calculateSubjectPercentage,
  isSubjectActive,
} from '../../lib/grading/grading'
import type {
  ConversionRow,
  SubjectPendingReason,
} from '../../lib/grading/types'

export { toGradingSubject } from '../../lib/academic-grading'

export interface SubjectSummary {
  id: string
  name: string
  units: number
  professor: string | null
  percentage: number | null
  pendingReason: SubjectPendingReason | null
  pendingMessage: string
  incompleteCategoryNames: string[]
  activeCategoryCount: number
  completedCategoryCount: number
  scoreCount: number
}

export interface HomeView {
  subjects: SubjectSummary[]
}

export function formatList(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? ''
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`
}

export function pendingMessage(
  reason: SubjectPendingReason,
  incompleteCategoryNames: string[],
): string {
  switch (reason) {
    case 'no-categories':
      return 'Add a grading category before a percentage can be computed.'
    case 'invalid-weights':
      return 'Active category weights must total 100%.'
    case 'invalid-activities':
      return 'A recorded score is invalid. Check the scores for this subject.'
    case 'incomplete-categories':
      return incompleteCategoryNames.length > 0
        ? `Add scores for ${formatList(incompleteCategoryNames)}.`
        : 'Some grading categories still need scores.'
    case 'no-conversion':
      return 'No grade conversion table is available.'
  }
}

export function buildHomeView(subjects: ApiSubject[]): HomeView {
  return {
    subjects: subjects.map((subject) => {
      const grading = toGradingSubject(subject)
      const activeCategories = grading.categories.filter(
        (category) => category.active !== false,
      )
      const completedCategoryCount = activeCategories.filter(
        (category) =>
          calculateCategoryAverage(category, grading.activities).status ===
          'complete',
      ).length
      const result = calculateSubjectPercentage(grading)

      if (result.status === 'graded') {
        return {
          id: subject.id,
          name: subject.name,
          units: subject.units,
          professor: subject.professor,
          percentage: result.percentage,
          pendingReason: null,
          pendingMessage: '',
          incompleteCategoryNames: [],
          activeCategoryCount: activeCategories.length,
          completedCategoryCount,
          scoreCount: grading.activities.length,
        }
      }

      const categoryNames = new Map(
        grading.categories.map((category) => [category.id, category.name]),
      )
      const incompleteNames = result.incompleteCategoryIds
        .map((id) => categoryNames.get(id))
        .filter((name): name is string => Boolean(name))

      return {
        id: subject.id,
        name: subject.name,
        units: subject.units,
        professor: subject.professor,
        percentage: null,
        pendingReason: result.reason,
        pendingMessage: pendingMessage(result.reason, incompleteNames),
        incompleteCategoryNames: incompleteNames,
        activeCategoryCount: activeCategories.length,
        completedCategoryCount,
        scoreCount: grading.activities.length,
      }
    }),
  }
}

export type SemesterGwaView =
  | { status: 'empty' }
  | {
      status: 'graded'
      gwa: number
      units: number
      subjectCount: number
    }
  | {
      status: 'pending'
      reason: 'incomplete-subjects' | 'thresholds'
      pendingSubjectNames: string[]
    }

/**
 * Reads the semester GWA from the shared grading engine. An empty conversion
 * table means the official NEU thresholds are not configured yet, so every
 * complete subject is pending with the `thresholds` reason instead of listing
 * subjects that are only waiting on the conversion table.
 */
export function buildSemesterGwa(
  subjects: ApiSubject[],
  table: ConversionRow[] = [],
): SemesterGwaView {
  const gradingSubjects = subjects.map(toGradingSubject)
  const result = calculateSemesterGwa(gradingSubjects, table)

  if (result.status === 'empty') {
    return { status: 'empty' }
  }

  if (result.status === 'graded') {
    const active = gradingSubjects.filter(isSubjectActive)
    return {
      status: 'graded',
      gwa: result.gwa,
      units: active.reduce((total, subject) => total + subject.units, 0),
      subjectCount: active.length,
    }
  }

  const byId = new Map(gradingSubjects.map((subject) => [subject.id, subject]))
  const pending = result.pendingSubjectIds.flatMap((id) => {
    const subject = byId.get(id)
    return subject ? [subject] : []
  })
  const missingGrades = pending.filter((subject) => {
    const grade = calculateSubjectGrade(subject, table)
    return grade.status !== 'pending' || grade.reason !== 'no-conversion'
  })

  if (missingGrades.length === 0) {
    return {
      status: 'pending',
      reason: 'thresholds',
      pendingSubjectNames: [],
    }
  }

  return {
    status: 'pending',
    reason: 'incomplete-subjects',
    pendingSubjectNames: missingGrades.map((subject) => subject.name),
  }
}
