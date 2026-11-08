import type { Subject as ApiSubject } from '../../lib/academic-api'
import {
  calculateCategoryAverage,
  calculateSubjectPercentage,
} from '../../lib/grading/grading'
import type {
  Subject as GradingSubject,
  SubjectPendingReason,
} from '../../lib/grading/types'

export interface SubjectSummary {
  id: string
  name: string
  units: number
  professor: string | null
  percentage: number | null
  pendingReason: SubjectPendingReason | null
  pendingMessage: string
  activeCategoryCount: number
  completedCategoryCount: number
  scoreCount: number
}

export interface HomeView {
  subjects: SubjectSummary[]
}

export function toGradingSubject(subject: ApiSubject): GradingSubject {
  return {
    id: subject.id,
    name: subject.name,
    units: subject.units,
    professor: subject.professor ?? undefined,
    categories: subject.categories.map((category) => ({
      id: category.id,
      name: category.name,
      weight: category.weightPercent,
      active: category.isActive,
      sortOrder: category.sortOrder,
    })),
    activities: subject.categories.flatMap((category) =>
      category.activities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        categoryId: category.id,
        scoreEarned: activity.scoreEarned,
        totalPoints: activity.totalPoints,
        date: activity.date,
      })),
    ),
  }
}

function formatList(values: string[]): string {
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
        activeCategoryCount: activeCategories.length,
        completedCategoryCount,
        scoreCount: grading.activities.length,
      }
    }),
  }
}
