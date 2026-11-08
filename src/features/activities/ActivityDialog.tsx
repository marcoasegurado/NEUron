import { useState, type FormEvent } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import {
  academicErrorMessage,
  createActivity,
  updateActivity,
  type Activity,
  type Subject,
} from '../../lib/academic-api'
import {
  activeCategories,
  buildActivityInput,
  buildActivityUpdate,
  createEditScoreForm,
  createScoreForm,
  hasScoreErrors,
  validateScoreForm,
  type EditableActivity,
  type ScoreFormDefaults,
  type ScoreFormErrors,
  type ScoreFormValues,
} from './score-form'
import styles from './ActivityDialog.module.css'

export interface ActivityDialogProps {
  subjects: Subject[]
  activity?: EditableActivity | null
  defaults?: ScoreFormDefaults
  onClose: () => void
  onSaved: (activity: Activity) => void
}

export function ActivityDialog({
  subjects,
  activity,
  defaults,
  onClose,
  onSaved,
}: ActivityDialogProps) {
  const editing = Boolean(activity)
  const [values, setValues] = useState<ScoreFormValues>(() =>
    activity
      ? createEditScoreForm(subjects, activity)
      : createScoreForm(subjects, new Date(), defaults),
  )
  const [errors, setErrors] = useState<ScoreFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedSubject = subjects.find(
    (subject) => subject.id === values.subjectId,
  )
  const categories = activeCategories(selectedSubject)

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

    const request = activity
      ? updateActivity(activity.id, buildActivityUpdate(values))
      : createActivity(buildActivityInput(values))

    request
      .then(({ activity: saved }) => onSaved(saved))
      .catch((error: unknown) => {
        setSubmitError(
          academicErrorMessage(
            error,
            editing
              ? 'Could not update the score. Check your connection and try again.'
              : 'Could not save the score. Check your connection and try again.',
          ),
        )
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      title={editing ? 'Edit score' : 'Add score'}
      description={
        editing
          ? 'Update the activity name, score, or date. Its subject and grading category stay the same.'
          : 'Record one activity for a grading category. The category average updates as soon as the score is saved.'
      }
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
          disabled={editing || subjects.length === 0}
          hint={editing ? 'The subject cannot be changed here.' : undefined}
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
            editing
              ? 'The grading category cannot be changed here.'
              : categories.length === 0
                ? 'This subject has no active grading categories.'
                : undefined
          }
          error={errors.categoryId}
          disabled={editing || categories.length === 0}
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

        <div className={styles.row}>
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

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || categories.length === 0}
          >
            {saving
              ? 'Saving…'
              : editing
                ? 'Save changes'
                : 'Save score'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
