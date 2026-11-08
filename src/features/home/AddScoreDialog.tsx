import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { Button, Input, Select } from '../../components/ui'
import {
  academicErrorMessage,
  createActivity,
  type Activity,
  type Subject,
} from '../../lib/academic-api'
import {
  activeCategories,
  buildActivityInput,
  createScoreForm,
  hasScoreErrors,
  validateScoreForm,
  type ScoreFormErrors,
  type ScoreFormValues,
} from './score-form'
import styles from './HomePage.module.css'

export interface AddScoreDialogProps {
  subjects: Subject[]
  onClose: () => void
  onSaved: (activity: Activity) => void
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AddScoreDialog({
  subjects,
  onClose,
  onSaved,
}: AddScoreDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<ScoreFormValues>(() =>
    createScoreForm(subjects),
  )
  const [errors, setErrors] = useState<ScoreFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedSubject = subjects.find(
    (subject) => subject.id === values.subjectId,
  )
  const categories = activeCategories(selectedSubject)

  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = dialog?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialog) {
        return
      }

      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      )
      if (nodes.length === 0) {
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = bodyOverflow
      previous?.focus()
    }
  }, [onClose])

  function update(patch: Partial<ScoreFormValues>) {
    setValues((current) => ({ ...current, ...patch }))
    setSubmitError(null)
  }

  function handleSubjectChange(subjectId: string) {
    const subject = subjects.find((entry) => entry.id === subjectId)
    const category = activeCategories(subject)[0]
    setValues((current) => ({
      ...current,
      subjectId,
      categoryId: category?.id ?? '',
    }))
    setErrors((current) => ({
      ...current,
      subjectId: undefined,
      categoryId: undefined,
    }))
    setSubmitError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateScoreForm(values)
    setErrors(nextErrors)
    if (hasScoreErrors(nextErrors)) {
      return
    }

    setSaving(true)
    setSubmitError(null)
    createActivity(buildActivityInput(values))
      .then(({ activity }) => onSaved(activity))
      .catch((error: unknown) => {
        setSubmitError(
          academicErrorMessage(
            error,
            'Could not save the score. Check your connection and try again.',
          ),
        )
      })
      .finally(() => setSaving(false))
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={styles.dialogHead}>
          <h2 id={titleId} className={styles.dialogTitle}>
            Add score
          </h2>
          <p id={descriptionId} className={styles.dialogDescription}>
            Record one activity for a grading category. The category average
            updates as soon as the score is saved.
          </p>
        </div>

        <form className={styles.dialogForm} onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          ) : null}

          <Select
            label="Subject"
            value={values.subjectId}
            onChange={(event) => handleSubjectChange(event.target.value)}
            error={errors.subjectId}
            disabled={subjects.length === 0}
          >
            {subjects.length === 0 ? (
              <option value="">No subjects available</option>
            ) : null}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>

          <Select
            label="Grading category"
            value={values.categoryId}
            onChange={(event) => {
              update({ categoryId: event.target.value })
              setErrors((current) => ({
                ...current,
                categoryId: undefined,
              }))
            }}
            hint={
              categories.length === 0
                ? 'This subject has no active grading categories.'
                : undefined
            }
            error={errors.categoryId}
            disabled={categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">No active categories</option>
            ) : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} · {category.weightPercent}%
              </option>
            ))}
          </Select>

          <Input
            label="Activity name"
            value={values.name}
            onChange={(event) => {
              update({ name: event.target.value })
              setErrors((current) => ({ ...current, name: undefined }))
            }}
            placeholder="Quiz 1"
            error={errors.name}
          />

          <div className={styles.dialogRow}>
            <Input
              label="Score earned"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={values.scoreEarned}
              onChange={(event) => {
                update({ scoreEarned: event.target.value })
                setErrors((current) => ({
                  ...current,
                  scoreEarned: undefined,
                  totalPoints: undefined,
                }))
              }}
              placeholder="18"
              error={errors.scoreEarned}
            />
            <Input
              label="Total points"
              type="number"
              min={0.01}
              step="any"
              inputMode="decimal"
              value={values.totalPoints}
              onChange={(event) => {
                update({ totalPoints: event.target.value })
                setErrors((current) => ({
                  ...current,
                  scoreEarned: undefined,
                  totalPoints: undefined,
                }))
              }}
              placeholder="20"
              error={errors.totalPoints}
            />
          </div>

          <Input
            label="Date (optional)"
            type="date"
            value={values.date}
            onChange={(event) => {
              update({ date: event.target.value })
              setErrors((current) => ({ ...current, date: undefined }))
            }}
            hint="Defaults to today when left blank."
            error={errors.date}
          />

          <div className={styles.dialogActions}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || categories.length === 0}
            >
              {saving ? 'Saving…' : 'Save score'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
