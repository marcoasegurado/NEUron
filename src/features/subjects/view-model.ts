import type { Subject as ApiSubject } from '../../lib/academic-api'
import { toGradingSubject } from '../../lib/academic-grading'
import { calculateCategoryAverage } from '../../lib/grading/grading'
import {
  buildHomeView,
  type SubjectSummary,
} from '../home/view-model'

export interface ActivityDetail {
  id: string
  categoryId: string
  name: string
  date: string
  scoreEarned: number
  totalPoints: number
  percentage: number | null
}

export interface CategoryDetail {
  id: string
  name: string
  weightPercent: number
  isActive: boolean
  average: number | null
  activities: ActivityDetail[]
}

export interface SubjectDetail extends SubjectSummary {
  categories: CategoryDetail[]
}

export interface SubjectsView {
  subjects: SubjectDetail[]
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function formatActivityDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return value
  }
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function activityPercentage(
  scoreEarned: number,
  totalPoints: number,
): number | null {
  if (!Number.isFinite(scoreEarned) || !Number.isFinite(totalPoints)) {
    return null
  }
  if (totalPoints <= 0) {
    return null
  }
  return (scoreEarned / totalPoints) * 100
}

export function buildSubjectsView(subjects: ApiSubject[]): SubjectsView {
  const summaries = new Map(
    buildHomeView(subjects).subjects.map((summary) => [summary.id, summary]),
  )

  return {
    subjects: subjects.map((subject) => {
      const grading = toGradingSubject(subject)
      const summary = summaries.get(subject.id)

      return {
        ...(summary ?? {
          id: subject.id,
          name: subject.name,
          units: subject.units,
          professor: subject.professor,
          percentage: null,
          pendingReason: 'no-categories' as const,
          pendingMessage: '',
          incompleteCategoryNames: [],
          activeCategoryCount: 0,
          completedCategoryCount: 0,
          scoreCount: 0,
        }),
        categories: subject.categories.map((category) => {
          const gradingCategory = grading.categories.find(
            (entry) => entry.id === category.id,
          )
          const result = gradingCategory
            ? calculateCategoryAverage(gradingCategory, grading.activities)
            : null

          return {
            id: category.id,
            name: category.name,
            weightPercent: category.weightPercent,
            isActive: category.isActive,
            average:
              result && result.status === 'complete' ? result.average : null,
            activities: [...category.activities]
              .reverse()
              .map((activity) => ({
                id: activity.id,
                categoryId: activity.categoryId,
                name: activity.name,
                date: activity.date,
                scoreEarned: activity.scoreEarned,
                totalPoints: activity.totalPoints,
                percentage: activityPercentage(
                  activity.scoreEarned,
                  activity.totalPoints,
                ),
              })),
          }
        }),
      }
    }),
  }
}
