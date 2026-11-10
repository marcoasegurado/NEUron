import { useMemo, useState } from 'react'
import { Button, Input, Modal } from '../../components/ui'
import type { Subject } from '../../lib/academic-api'
import { toGradingSubject } from '../../lib/academic-grading'
import {
  calculateTargetPercentage,
  formatNumber,
} from '../../lib/grading/grading'
import type {
  TargetBlockedReason,
  TargetPercentageResult,
} from '../../lib/grading/types'
import styles from './TargetGradeDialog.module.css'

export interface TargetGradeDialogProps {
  subject: Subject
  onClose: () => void
}

type ParsedTarget = number | 'invalid' | null

function parseTarget(value: string): ParsedTarget {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : 'invalid'
}

function blockedMessage(reason: TargetBlockedReason): string {
  switch (reason) {
    case 'no-categories':
      return 'Add a grading category before using the target calculator.'
    case 'invalid-weights':
      return 'Active category weights must total 100% before using the target calculator.'
    case 'invalid-activities':
      return 'A recorded score is invalid. Fix it before using the target calculator.'
  }
}

function TargetResult({ result }: { result: TargetPercentageResult }) {
  switch (result.status) {
    case 'invalid-target':
      return (
        <p className={styles.resultText}>
          Enter a target between 0 and 100.
        </p>
      )
    case 'blocked':
      return (
        <p className={styles.resultText}>{blockedMessage(result.reason)}</p>
      )
    case 'reached':
      return (
        <>
          <p className={styles.resultTitle}>Target already reached</p>
          <p className={styles.resultText}>
            You are at {formatNumber(result.currentPercentage, 2)}%
            {result.remainingWeight > 0
              ? ` with ${formatNumber(result.remainingWeight, 2)}% of the grade still unscored.`
              : ' and every category has scores.'}
          </p>
        </>
      )
    case 'required':
      return (
        <>
          <p className={styles.resultValue}>
            {formatNumber(result.requiredPercentage, 2)}%
          </p>
          <p className={styles.resultText}>
            needed on the remaining {formatNumber(result.remainingWeight, 2)}%
            of the grade.
          </p>
          <p className={styles.resultMeta}>
            Current: {formatNumber(result.currentPercentage, 2)}%
          </p>
        </>
      )
    case 'unreachable':
      return (
        <>
          <p className={styles.resultTitle}>Not reachable</p>
          <p className={styles.resultText}>
            {result.reason === 'no-remaining'
              ? `Every category already has scores, and your current percentage is ${formatNumber(result.currentPercentage, 2)}%.`
              : `You would need ${formatNumber(result.requiredPercentage ?? 0, 2)}% on the remaining ${formatNumber(result.remainingWeight, 2)}%, which is above 100%.`}
          </p>
        </>
      )
  }
}

export function TargetGradeDialog({
  subject,
  onClose,
}: TargetGradeDialogProps) {
  const [target, setTarget] = useState('')
  const grading = useMemo(() => toGradingSubject(subject), [subject])

  const targetValue = parseTarget(target)
  const result: TargetPercentageResult | null =
    targetValue === null
      ? null
      : targetValue === 'invalid'
        ? { status: 'invalid-target' }
        : calculateTargetPercentage(grading, targetValue)

  const invalidTarget = result?.status === 'invalid-target'

  return (
    <Modal
      title="Target grade"
      description={`${subject.name} · this estimate does not change saved scores.`}
      onClose={onClose}
    >
      <div className={styles.body}>
        <Input
          label="Target percentage"
          type="number"
          min={0}
          max={100}
          step="0.01"
          inputMode="decimal"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="85"
          trailing="%"
          error={
            invalidTarget ? 'Enter a target between 0 and 100.' : undefined
          }
        />

        <div className={styles.result} aria-live="polite">
          {result ? (
            <TargetResult result={result} />
          ) : (
            <p className={styles.resultText}>
              Enter a target percentage to see what you need.
            </p>
          )}
        </div>

        <p className={styles.assumption}>
          Assumes all remaining work counts as one average and scored
          categories stay the same.
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
