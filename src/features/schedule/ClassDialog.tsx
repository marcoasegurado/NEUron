import { useState, type FormEvent } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import {
  academicErrorMessage,
  createScheduleClass,
  updateScheduleClass,
  type ScheduleClass,
  type Subject,
} from '../../lib/academic-api'
import {
  buildCreateClassInput,
  buildUpdateClassInput,
  createClassForm,
  draftConflicts,
  hasClassErrors,
  validateClassForm,
  type ClassFormErrors,
  type ClassFormValues,
} from './class-form'
import {
  SCHEDULE_DAYS,
  dayLabel,
  formatTimeRange,
  type ScheduleDayValue,
} from './view-model'
import styles from './ClassDialog.module.css'

export interface ClassDialogProps {
  semesterId: string
  subjects: Subject[]
  classes: ScheduleClass[]
  selectedDay: ScheduleDayValue
  entry?: ScheduleClass | null
  onClose: () => void
  onSaved: (saved: ScheduleClass) => void
}

export function ClassDialog({
  semesterId,
  subjects,
  classes,
  selectedDay,
  entry,
  onClose,
  onSaved,
}: ClassDialogProps) {
  const editing = Boolean(entry)
  const [values, setValues] = useState<ClassFormValues>(() =>
    createClassForm(subjects, selectedDay, entry ?? undefined),
  )
  const [errors, setErrors] = useState<ClassFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const conflicts = draftConflicts(values, classes, entry?.id)
  const conflictNames = conflicts.map(
    (conflict) =>
      subjects.find((subject) => subject.id === conflict.subjectId)?.name ??
      'another class',
  )

  function update(patch: Partial<ClassFormValues>) {
    setValues((current) => ({ ...current, ...patch }))
    setSubmitError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateClassForm(values)
    setErrors(nextErrors)
    if (hasClassErrors(nextErrors)) {
      return
    }

    setSaving(true)
    setSubmitError(null)

    const request = entry
      ? updateScheduleClass(entry.id, buildUpdateClassInput(values))
      : createScheduleClass(buildCreateClassInput(values, semesterId))

    request
      .then(({ class: saved }) => onSaved(saved))
      .catch((error: unknown) => {
        setSubmitError(
          academicErrorMessage(
            error,
            editing
              ? 'Could not update the class. Check your connection and try again.'
              : 'Could not save the class. Check your connection and try again.',
          ),
        )
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      title={editing ? 'Edit class' : 'Add class'}
      description={
        editing
          ? 'Update the subject, day, time, or room for this class.'
          : 'Add one meeting to your weekly schedule. Subjects come from the active semester.'
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
          onChange={(event) => {
            update({ subjectId: event.target.value })
            setErrors((current) => ({ ...current, subjectId: undefined }))
          }}
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
          label="Day"
          value={values.dayOfWeek}
          onChange={(event) => {
            update({ dayOfWeek: event.target.value })
            setErrors((current) => ({ ...current, dayOfWeek: undefined }))
          }}
          error={errors.dayOfWeek}
        >
          {SCHEDULE_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.long}
            </option>
          ))}
        </Select>

        <div className={styles.row}>
          <Input
            label="Start time"
            type="time"
            value={values.startTime}
            onChange={(event) => {
              update({ startTime: event.target.value })
              setErrors((current) => ({
                ...current,
                startTime: undefined,
                endTime: undefined,
              }))
            }}
            error={errors.startTime}
          />
          <Input
            label="End time"
            type="time"
            value={values.endTime}
            onChange={(event) => {
              update({ endTime: event.target.value })
              setErrors((current) => ({
                ...current,
                startTime: undefined,
                endTime: undefined,
              }))
            }}
            error={errors.endTime}
          />
        </div>

        <Input
          label="Room or location (optional)"
          value={values.room}
          onChange={(event) => {
            update({ room: event.target.value })
            setErrors((current) => ({ ...current, room: undefined }))
          }}
          placeholder="Room 204"
          error={errors.room}
        />

        {conflicts.length > 0 ? (
          <p className={styles.conflict} role="status">
            <strong>Overlaps with {conflictNames.join(', ')}</strong> on{' '}
            {dayLabel(Number(values.dayOfWeek))} (
            {formatTimeRange(values.startTime, values.endTime)}). You can still
            save this class.
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || subjects.length === 0}
          >
            {saving
              ? 'Saving…'
              : editing
                ? 'Save changes'
                : 'Save class'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
