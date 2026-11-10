import type {
  Activity,
  CategoryResult,
  ConversionRow,
  GradingCategory,
  SemesterGwaResult,
  Subject,
  SubjectGradeResult,
  SubjectPercentageResult,
  TargetPercentageResult,
  ValidationResult,
  WeightValidation,
} from './types'

export const WEIGHT_TOTAL = 100
export const WEIGHT_TOLERANCE = 1e-9
export const MIN_GRADE = 1
export const MAX_GRADE = 5

export function isCategoryActive(category: GradingCategory): boolean {
  return category.active !== false
}

export function isSubjectActive(subject: Subject): boolean {
  return subject.active !== false
}

export function activeCategories(
  categories: GradingCategory[],
): GradingCategory[] {
  return categories.filter(isCategoryActive)
}

export function validateWeights(
  categories: GradingCategory[],
): WeightValidation {
  const active = activeCategories(categories)

  if (active.length === 0) {
    return {
      valid: false,
      total: 0,
      errors: ['At least one active grading category is required.'],
    }
  }

  const errors: string[] = []
  let total = 0

  for (const category of active) {
    if (!Number.isFinite(category.weight) || category.weight <= 0) {
      errors.push(
        `Category "${category.name}" must have a positive finite weight.`,
      )
      continue
    }
    total += category.weight
  }

  if (errors.length === 0) {
    const difference = total - WEIGHT_TOTAL
    if (Math.abs(difference) > WEIGHT_TOLERANCE) {
      const direction = difference < 0 ? 'below' : 'above'
      errors.push(
        `Active category weights total ${total}% (${direction} 100%).`,
      )
      return { valid: false, total, direction, errors }
    }
  }

  return { valid: errors.length === 0, total, errors }
}

export function validateActivity(activity: Activity): ValidationResult {
  const errors: string[] = []

  if (activity.name.trim().length === 0) {
    errors.push('Activity name is required.')
  }

  if (
    !Number.isFinite(activity.scoreEarned) ||
    activity.scoreEarned < 0
  ) {
    errors.push('Earned score must be a finite number greater than or equal to zero.')
  }

  if (
    !Number.isFinite(activity.totalPoints) ||
    activity.totalPoints <= 0
  ) {
    errors.push('Total possible points must be a finite number greater than zero.')
  }

  if (
    Number.isFinite(activity.scoreEarned) &&
    Number.isFinite(activity.totalPoints) &&
    activity.totalPoints > 0 &&
    activity.scoreEarned > activity.totalPoints
  ) {
    errors.push('Earned score cannot exceed total possible points.')
  }

  return { valid: errors.length === 0, errors }
}

export function calculateCategoryAverage(
  category: GradingCategory,
  activities: Activity[],
): CategoryResult {
  const relevant = activities.filter(
    (activity) => activity.categoryId === category.id,
  )

  if (relevant.length === 0) {
    return { status: 'incomplete', reason: 'no-activities' }
  }

  let earned = 0
  let total = 0

  for (const activity of relevant) {
    earned += activity.scoreEarned
    total += activity.totalPoints
  }

  if (total <= 0) {
    return { status: 'incomplete', reason: 'no-activities' }
  }

  return {
    status: 'complete',
    average: (earned / total) * 100,
    earned,
    total,
    activityCount: relevant.length,
  }
}

export function validateConversionTable(
  rows: ConversionRow[],
): ValidationResult {
  const errors: string[] = []

  if (rows.length === 0) {
    return { valid: false, errors: ['Conversion table cannot be empty.'] }
  }

  const seen = new Set<number>()

  for (const row of rows) {
    if (
      !Number.isFinite(row.minimumPercentage) ||
      row.minimumPercentage < 0 ||
      row.minimumPercentage > 100
    ) {
      errors.push('Thresholds must be finite percentages between 0 and 100.')
    }

    if (
      !Number.isFinite(row.grade) ||
      row.grade < MIN_GRADE ||
      row.grade > MAX_GRADE
    ) {
      errors.push(
        `Grades must be finite NEU grades between ${MIN_GRADE.toFixed(1)} and ${MAX_GRADE.toFixed(1)}.`,
      )
    }

    if (seen.has(row.minimumPercentage)) {
      errors.push(
        `Duplicate threshold ${row.minimumPercentage}% is not allowed.`,
      )
    }
    seen.add(row.minimumPercentage)
  }

  if (!seen.has(0)) {
    errors.push('The table must include a 0% threshold to cover the full range.')
  }

  return { valid: errors.length === 0, errors }
}

export function convertPercentage(
  percentage: number,
  rows: ConversionRow[],
): number | null {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return null
  }

  if (!validateConversionTable(rows).valid) {
    return null
  }

  const sorted = [...rows].sort(
    (a, b) => b.minimumPercentage - a.minimumPercentage,
  )
  const match = sorted.find((row) => percentage >= row.minimumPercentage)

  return match ? match.grade : null
}

export function calculateSubjectPercentage(
  subject: Subject,
): SubjectPercentageResult {
  const active = activeCategories(subject.categories)

  if (active.length === 0) {
    return {
      status: 'pending',
      reason: 'no-categories',
      incompleteCategoryIds: [],
    }
  }

  const weights = validateWeights(subject.categories)
  if (!weights.valid) {
    return {
      status: 'pending',
      reason: 'invalid-weights',
      incompleteCategoryIds: [],
    }
  }

  const activeCategoryIds = new Set(active.map((category) => category.id))
  const invalidActivity = subject.activities.some(
    (activity) =>
      activeCategoryIds.has(activity.categoryId) &&
      !validateActivity(activity).valid,
  )
  if (invalidActivity) {
    return {
      status: 'pending',
      reason: 'invalid-activities',
      incompleteCategoryIds: [],
    }
  }

  const incompleteCategoryIds: string[] = []
  let percentage = 0

  for (const category of active) {
    const result = calculateCategoryAverage(category, subject.activities)

    if (result.status === 'incomplete') {
      incompleteCategoryIds.push(category.id)
      continue
    }

    percentage += result.average * (category.weight / WEIGHT_TOTAL)
  }

  if (incompleteCategoryIds.length > 0) {
    return {
      status: 'pending',
      reason: 'incomplete-categories',
      incompleteCategoryIds,
    }
  }

  return { status: 'graded', percentage }
}

export function calculateSubjectGrade(
  subject: Subject,
  table: ConversionRow[],
): SubjectGradeResult {
  const percentageResult = calculateSubjectPercentage(subject)

  if (percentageResult.status === 'pending') {
    return percentageResult
  }

  const grade = convertPercentage(percentageResult.percentage, table)

  if (grade === null) {
    return {
      status: 'pending',
      reason: 'no-conversion',
      incompleteCategoryIds: [],
    }
  }

  return {
    status: 'graded',
    percentage: percentageResult.percentage,
    grade,
  }
}

export function calculateSemesterGwa(
  subjects: Subject[],
  table: ConversionRow[],
): SemesterGwaResult {
  const active = subjects.filter(isSubjectActive)

  if (active.length === 0) {
    return { status: 'empty' }
  }

  const pendingSubjectIds: string[] = []
  let weightedGrade = 0
  let totalUnits = 0

  for (const subject of active) {
    if (!Number.isFinite(subject.units) || subject.units <= 0) {
      pendingSubjectIds.push(subject.id)
      continue
    }

    const result = calculateSubjectGrade(subject, table)

    if (result.status === 'pending') {
      pendingSubjectIds.push(subject.id)
      continue
    }

    weightedGrade += result.grade * subject.units
    totalUnits += subject.units
  }

  if (pendingSubjectIds.length > 0) {
    return {
      status: 'pending',
      reason: 'incomplete-subjects',
      pendingSubjectIds,
    }
  }

  if (totalUnits <= 0) {
    return { status: 'empty' }
  }

  return { status: 'graded', gwa: weightedGrade / totalUnits }
}

/**
 * Calculates the average needed on the remaining active-category weight to
 * reach a target percentage. Scored categories keep their current averages;
 * every unscored active category is treated as one remaining bucket.
 */
export function calculateTargetPercentage(
  subject: Subject,
  targetPercentage: number,
): TargetPercentageResult {
  if (
    !Number.isFinite(targetPercentage) ||
    targetPercentage < 0 ||
    targetPercentage > WEIGHT_TOTAL
  ) {
    return { status: 'invalid-target' }
  }

  const active = activeCategories(subject.categories)
  if (active.length === 0) {
    return { status: 'blocked', reason: 'no-categories' }
  }

  if (!validateWeights(subject.categories).valid) {
    return { status: 'blocked', reason: 'invalid-weights' }
  }

  const activeCategoryIds = new Set(active.map((category) => category.id))
  const invalidActivity = subject.activities.some(
    (activity) =>
      activeCategoryIds.has(activity.categoryId) &&
      !validateActivity(activity).valid,
  )
  if (invalidActivity) {
    return { status: 'blocked', reason: 'invalid-activities' }
  }

  let currentPercentage = 0
  let remainingWeight = 0

  for (const category of active) {
    const result = calculateCategoryAverage(category, subject.activities)

    if (result.status === 'complete') {
      currentPercentage += result.average * (category.weight / WEIGHT_TOTAL)
    } else {
      remainingWeight += category.weight
    }
  }

  if (currentPercentage + WEIGHT_TOLERANCE >= targetPercentage) {
    return {
      status: 'reached',
      currentPercentage,
      remainingWeight,
    }
  }

  if (remainingWeight <= WEIGHT_TOLERANCE) {
    return {
      status: 'unreachable',
      reason: 'no-remaining',
      currentPercentage,
      remainingWeight: 0,
      requiredPercentage: null,
    }
  }

  const requiredPercentage =
    ((targetPercentage - currentPercentage) / remainingWeight) * WEIGHT_TOTAL

  if (requiredPercentage > WEIGHT_TOTAL + WEIGHT_TOLERANCE) {
    return {
      status: 'unreachable',
      reason: 'above-100',
      currentPercentage,
      remainingWeight,
      requiredPercentage,
    }
  }

  return {
    status: 'required',
    currentPercentage,
    remainingWeight,
    requiredPercentage,
  }
}

export function roundForDisplay(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}
