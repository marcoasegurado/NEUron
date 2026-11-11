import type { ConversionRow } from '../../lib/grading/types'
import { formatNumber } from '../../lib/grading/grading'

export interface GradeScaleRow {
  threshold: string
  grade: string
}

/**
 * Formats conversion rows for the read-only Grade scale card, highest
 * threshold first. Formatting only; the values come from the shared table.
 */
export function buildGradeScale(rows: ConversionRow[]): GradeScaleRow[] {
  return [...rows]
    .sort((a, b) => b.minimumPercentage - a.minimumPercentage)
    .map((row) => ({
      threshold: `${formatNumber(row.minimumPercentage)}%`,
      grade: formatNumber(row.grade),
    }))
}

export function semesterStatsLabel(
  units: number | undefined,
  subjectCount: number | undefined,
): string {
  const unitTotal =
    typeof units === 'number' && Number.isFinite(units) ? units : 0
  const count =
    typeof subjectCount === 'number' && Number.isFinite(subjectCount)
      ? subjectCount
      : 0
  return `${formatNumber(unitTotal, 0)} units · ${count} ${
    count === 1 ? 'subject' : 'subjects'
  }`
}
