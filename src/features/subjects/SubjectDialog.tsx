import { useState, type FormEvent } from 'react'
import { Button, Input, Modal } from '../../components/ui'
import {
  academicErrorMessage,
  createSubject,
  type Subject,
} from '../../lib/academic-api'
import { cx } from '../../lib/cx'
import {
  formatWeight,
  getWeightTotal,
  hasSubjectError,
  type SubjectDraft,
  type SubjectErrors,
} from '../setup/draft'
import {
  addSubjectCategory,
  buildCreateSubjectInput,
  createSubjectForm,
  MAX_SUBJECT_CATEGORIES,
  removeSubjectCategory,
  validateSubjectForm,
} from './subject-form'
import styles from './SubjectDialog.module.css'

export interface SubjectDialogProps {
  semesterId: string
  existingNames: string[]
  onClose: () => void
  onSaved: (subject: Subject) => void
}

export function SubjectDialog({
  semesterId,
  existingNames,
  onClose,
  onSaved,
}: SubjectDialogProps) {
  const [form, setForm] = useState<SubjectDraft>(createSubjectForm)
  const [errors, setErrors] = useState<SubjectErrors>(() => ({
    categoryErrors: {},
  }))
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const totalWeight = getWeightTotal(form.categories)
  const weightValid = Math.abs(totalWeight - 100) <= 1e-6

  function update(patch: Partial<SubjectDraft>) {
    setForm((current) => ({ ...current, ...patch }))
    setSubmitError(null)
  }

  function clearField(field: keyof Omit<SubjectErrors, 'categoryErrors'>) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function updateCategory(
    categoryId: string,
    patch: { name?: string; weight?: string },
  ) {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category,
      ),
    }))
    setErrors((current) => {
      const categoryError = current.categoryErrors[categoryId] ?? {}
      return {
        ...current,
        categoryErrors: {
          ...current.categoryErrors,
          [categoryId]: {
            ...categoryError,
            name: patch.name !== undefined ? undefined : categoryError.name,
            weight:
              patch.weight !== undefined ? undefined : categoryError.weight,
          },
        },
      }
    })
    setSubmitError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSubjectForm(form, existingNames)
    setErrors(nextErrors)
    if (hasSubjectError(nextErrors)) {
      return
    }

    setSaving(true)
    setSubmitError(null)

    createSubject(semesterId, buildCreateSubjectInput(form))
      .then(({ subject }) => onSaved(subject))
      .catch((error: unknown) => {
        setSubmitError(
          academicErrorMessage(
            error,
            'Could not add the subject. Check your connection and try again.',
          ),
        )
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      title="Add subject"
      description="Add a subject you left out during semester setup. Its grading categories must total 100%."
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        ) : null}

        <div className={styles.row}>
          <Input
            label="Subject name"
            value={form.name}
            onChange={(event) => {
              update({ name: event.target.value })
              clearField('name')
            }}
            placeholder="Mathematics"
            error={errors.name}
          />
          <Input
            label="Units"
            type="number"
            min={0.01}
            step="0.01"
            inputMode="decimal"
            value={form.units}
            onChange={(event) => {
              update({ units: event.target.value })
              clearField('units')
            }}
            placeholder="3"
            error={errors.units}
          />
        </div>

        <Input
          label="Professor (optional)"
          value={form.professor}
          onChange={(event) => update({ professor: event.target.value })}
          placeholder="Ms. Cruz"
        />

        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>Grading categories</h3>
          <span
            className={cx(
              styles.weightTotal,
              weightValid ? styles.weightValid : styles.weightInvalid,
            )}
            role="status"
          >
            Total: {formatWeight(totalWeight)}%
          </span>
        </div>

        <div className={styles.categoryList}>
          {form.categories.map((category, index) => {
            const categoryError = errors.categoryErrors[category.id]
            return (
              <div key={category.id} className={styles.categoryRow}>
                <Input
                  label={`Category ${index + 1}`}
                  value={category.name}
                  onChange={(event) =>
                    updateCategory(category.id, {
                      name: event.target.value,
                    })
                  }
                  placeholder="Quizzes"
                  error={categoryError?.name}
                />
                <Input
                  label="Weight %"
                  type="number"
                  min={0.01}
                  max={100}
                  step="0.01"
                  inputMode="decimal"
                  value={category.weight}
                  onChange={(event) =>
                    updateCategory(category.id, {
                      weight: event.target.value,
                    })
                  }
                  placeholder="100"
                  error={categoryError?.weight}
                />
                <Button
                  variant="ghost"
                  className={styles.categoryRemove}
                  onClick={() =>
                    setForm((current) =>
                      removeSubjectCategory(current, category.id),
                    )
                  }
                  disabled={form.categories.length === 1}
                  aria-label={`Remove category ${index + 1}`}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>

        {errors.categories ? (
          <p className={styles.fieldError} role="alert">
            {errors.categories}
          </p>
        ) : null}

        <Button
          variant="secondary"
          className={styles.addCategory}
          onClick={() => setForm((current) => addSubjectCategory(current))}
          disabled={form.categories.length >= MAX_SUBJECT_CATEGORIES}
        >
          Add category
        </Button>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save subject'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
