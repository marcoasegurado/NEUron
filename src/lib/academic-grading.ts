import type { Subject as ApiSubject } from './academic-api'
import type { Subject as GradingSubject } from './grading/types'

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
