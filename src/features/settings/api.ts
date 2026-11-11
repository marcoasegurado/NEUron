import { apiRequest } from '../../lib/api'
import type { ConversionRow } from '../../lib/grading/types'

export interface ConversionTableResponse {
  rows: ConversionRow[]
  configured: boolean
  valid: boolean
  errors: string[]
}

/**
 * Reads the central, read-only percentage-to-grade table. Students cannot
 * write to it; rows are applied by owner tooling (GRADING_RULES.md §6).
 */
export function getConversionTable(): Promise<ConversionTableResponse> {
  return apiRequest<ConversionTableResponse>('/api/settings/conversion')
}
