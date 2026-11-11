import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { cx } from '../../lib/cx'
import {
  createSemester,
  setupErrorMessage,
  type SemesterSetup,
} from './api'
import {
  buildCreateInput,
  createCategoryDraft,
  createInitialDraft,
  createSubjectDraft,
  formatWeight,
  getWeightTotal,
  hasBasicErrors,
  hasSubjectErrors,
  resizeSubjects,
  validateBasics,
  validateSubjects,
  type BasicErrors,
  type CategoryDraft,
  type SetupDraft,
  type SubjectErrorsMap,
  type SubjectDraft,
} from './draft'
import { useMediaQuery } from './useMediaQuery'
import styles from './SetupPage.module.css'

interface ReviewSummaryProps {
  draft: SetupDraft
}

function ReviewSummary({ draft }: ReviewSummaryProps) {
  const label =
    draft.label.trim() || `${draft.term} ${draft.academicYear}`

  return (
    <div className={styles.review}>
      <dl className={styles.reviewFacts}>
        <div>
          <dt>Academic year</dt>
          <dd>{draft.academicYear}</dd>
        </div>
        <div>
          <dt>Term</dt>
          <dd>{draft.term}</dd>
        </div>
        <div>
          <dt>Label</dt>
          <dd>{label}</dd>
        </div>
        <div>
          <dt>Subjects</dt>
          <dd>{draft.subjects.length}</dd>
        </div>
      </dl>

      <ul className={styles.reviewSubjects}>
        {draft.subjects.map((subject) => (
          <li key={subject.id} className={styles.reviewSubject}>
            <div className={styles.reviewSubjectHead}>
              <strong>{subject.name || 'Untitled subject'}</strong>
              <span>
                {subject.units || '—'} units
                {subject.professor ? ` · ${subject.professor}` : ''}
              </span>
            </div>
            <div className={styles.reviewCategories}>
              {subject.categories.map((category) => (
                <span key={category.id} className={styles.reviewCategory}>
                  {category.name || 'Untitled'} ·{' '}
                  {formatWeight(Number(category.weight) || 0)}%
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function updateSubject(
  draft: SetupDraft,
  subjectId: string,
  update: (subject: SubjectDraft) => SubjectDraft,
): SetupDraft {
  return {
    ...draft,
    subjects: draft.subjects.map((subject) =>
      subject.id === subjectId ? update(subject) : subject,
    ),
  }
}

function updateCategory(
  draft: SetupDraft,
  subjectId: string,
  categoryId: string,
  update: (category: CategoryDraft) => CategoryDraft,
): SetupDraft {
  return updateSubject(draft, subjectId, (subject) => ({
    ...subject,
    categories: subject.categories.map((category) =>
      category.id === categoryId ? update(category) : category,
    ),
  }))
}

export function SetupPage() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const totalSteps = isDesktop ? 2 : 3
  const [stepState, setStep] = useState(1)
  // Clamp instead of syncing in an effect so switching layouts cannot strand
  // the phone-only review step on desktop.
  const step = Math.min(stepState, totalSteps)
  const [draft, setDraft] = useState<SetupDraft>(() => createInitialDraft())
  const [basicErrors, setBasicErrors] = useState<BasicErrors>({})
  const [subjectErrors, setSubjectErrors] = useState<SubjectErrorsMap>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState<SemesterSetup | null>(null)
  const [dirty, setDirty] = useState(false)

  const stepLabels = useMemo(
    () =>
      isDesktop
        ? ['Semester', 'Subjects & review']
        : ['Semester', 'Subjects', 'Review'],
    [isDesktop],
  )

  useEffect(() => {
    if (!dirty || saved) {
      return
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, saved])

  function changeDraft(updater: (current: SetupDraft) => SetupDraft) {
    setDraft((current) => updater(current))
    setDirty(true)
    setSubmitError(null)
  }

  function handleBasicsNext(): boolean {
    const errors = validateBasics(draft)
    setBasicErrors(errors)
    if (hasBasicErrors(errors)) {
      return false
    }
    setStep(2)
    return true
  }

  async function handleSave() {
    const basics = validateBasics(draft)
    const subjects = validateSubjects(draft)
    setBasicErrors(basics)
    setSubjectErrors(subjects)

    if (hasBasicErrors(basics)) {
      setStep(1)
      return
    }
    if (hasSubjectErrors(subjects)) {
      if (!isDesktop) {
        setStep(2)
      }
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createSemester(buildCreateInput(draft))
      setSaved(result)
      setDirty(false)
    } catch (error) {
      setSubmitError(setupErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubjectsNext() {
    const errors = validateSubjects(draft)
    setSubjectErrors(errors)
    if (hasSubjectErrors(errors)) {
      return
    }

    if (isDesktop) {
      await handleSave()
      return
    }
    setStep(3)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1) {
      handleBasicsNext()
      return
    }
    if (step === 2) {
      await handleSubjectsNext()
      return
    }
    await handleSave()
  }

  function handleReset() {
    setDraft(createInitialDraft())
    setBasicErrors({})
    setSubjectErrors({})
    setSubmitError(null)
    setSaved(null)
    setDirty(false)
    setStep(1)
  }

  if (saved) {
    return (
      <>
        <PageHeader
          title="Semester saved"
          description="Your semester and subject configuration are ready."
          actions={<Badge tone="success">Active semester</Badge>}
        />
        <Card className={styles.successCard}>
          <span className={styles.successMark} aria-hidden="true">
            ✓
          </span>
          <h2 className={styles.successTitle}>{saved.semester.label}</h2>
          <p className={styles.successCopy}>
            {saved.subjects.length}{' '}
            {saved.subjects.length === 1 ? 'subject' : 'subjects'} saved with
            grading categories and weights.
          </p>
          <div className={styles.successActions}>
            <Button onClick={() => navigate('/home')}>Go to Home</Button>
            <Button variant="secondary" onClick={handleReset}>
              Set up another semester
            </Button>
          </div>
        </Card>
      </>
    )
  }

  const nextLabel =
    step === 1
      ? 'Continue to subjects'
      : step === 2 && !isDesktop
        ? 'Review semester'
        : 'Save semester'

  return (
    <>
      <PageHeader
        title="Semester setup"
        description="Create a semester and configure each subject's grading categories."
        actions={
          <Badge tone={dirty ? 'warning' : 'primary'}>
            {dirty ? 'Unsaved changes' : `Step ${step} of ${totalSteps}`}
          </Badge>
        }
      />

      <Card className={styles.setupCard}>
        <ol className={styles.steps} aria-label="Semester setup progress">
          {stepLabels.map((label, index) => {
            const number = index + 1
            const isActive = number === step
            const isDone = number < step
            return (
              <li
                key={label}
                className={cx(
                  styles.step,
                  isActive && styles.stepActive,
                  isDone && styles.stepDone,
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className={styles.stepNumber}>
                  {isDone ? '✓' : number}
                </span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            )
          })}
        </ol>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          ) : null}

          {step === 1 ? (
            <section className={styles.stepPanel}>
              <div className={styles.panelIntro}>
                <h2 className={styles.sectionTitle}>Semester details</h2>
                <p>
                  Set the academic year and term, then choose how many subjects
                  to configure.
                </p>
              </div>

              <div className={styles.basicsGrid}>
                <Input
                  label="Academic year"
                  value={draft.academicYear}
                  onChange={(event) =>
                    changeDraft((current) => ({
                      ...current,
                      academicYear: event.target.value,
                    }))
                  }
                  placeholder="2026-2027"
                  hint="Example: 2026-2027"
                  error={basicErrors.academicYear}
                />

                <Select
                  label="Term"
                  value={draft.term}
                  options={[
                    { value: '1st Semester', label: '1st Semester' },
                    { value: '2nd Semester', label: '2nd Semester' },
                    { value: 'Summer', label: 'Summer' },
                  ]}
                  onChange={(value) =>
                    changeDraft((current) => ({ ...current, term: value }))
                  }
                  hint="Choose the term for this semester."
                  error={basicErrors.term}
                />

                <Input
                  label="Number of subjects"
                  type="number"
                  min={1}
                  max={30}
                  inputMode="numeric"
                  value={String(draft.subjects.length)}
                  onChange={(event) => {
                    const value = event.target.value
                    changeDraft((current) =>
                      resizeSubjects(current, value ? Number(value) : 1),
                    )
                  }}
                  hint="You can add or remove subjects later."
                  error={basicErrors.subjects}
                />

                <Input
                  label="Semester label (optional)"
                  value={draft.label}
                  onChange={(event) =>
                    changeDraft((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder={`${draft.term} ${draft.academicYear}`}
                  hint="Leave blank to use the term and academic year."
                  error={basicErrors.label}
                />
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className={styles.stepPanel}>
              <div className={styles.panelIntro}>
                <h2 className={styles.sectionTitle}>Subjects and weights</h2>
                <p>
                  Every subject needs at least one category, and the active
                  weights must total 100%.
                </p>
              </div>

              <div
                className={cx(
                  styles.subjectLayout,
                  isDesktop && styles.subjectLayoutDesktop,
                )}
              >
                <div className={styles.subjectsColumn}>
                  <div className={styles.subjectsGrid}>
                    {draft.subjects.map((subject, subjectIndex) => {
                      const subjectError = subjectErrors[subject.id]
                      const totalWeight = getWeightTotal(subject.categories)
                      const weightValid =
                        Math.abs(totalWeight - 100) <= 1e-6

                      return (
                        <div key={subject.id} className={styles.subjectCard}>
                          <div className={styles.subjectCardHeader}>
                            <h3>Subject {subjectIndex + 1}</h3>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                changeDraft((current) => ({
                                  ...current,
                                  subjects: current.subjects.filter(
                                    (item) => item.id !== subject.id,
                                  ),
                                }))
                              }
                              disabled={draft.subjects.length === 1}
                            >
                              Remove
                            </Button>
                          </div>

                          <div className={styles.subjectFields}>
                            <Input
                              label="Subject name"
                              value={subject.name}
                              onChange={(event) =>
                                changeDraft((current) =>
                                  updateSubject(
                                    current,
                                    subject.id,
                                    (item) => ({
                                      ...item,
                                      name: event.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="Mathematics"
                              error={subjectError?.name}
                            />
                            <Input
                              label="Units"
                              type="number"
                              min={0.01}
                              step="0.01"
                              inputMode="decimal"
                              value={subject.units}
                              onChange={(event) =>
                                changeDraft((current) =>
                                  updateSubject(
                                    current,
                                    subject.id,
                                    (item) => ({
                                      ...item,
                                      units: event.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="3"
                              error={subjectError?.units}
                            />
                            <Input
                              label="Professor (optional)"
                              value={subject.professor}
                              onChange={(event) =>
                                changeDraft((current) =>
                                  updateSubject(
                                    current,
                                    subject.id,
                                    (item) => ({
                                      ...item,
                                      professor: event.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="Ms. Cruz"
                              className={styles.spanTwo}
                            />
                          </div>

                          <div className={styles.categoryHeader}>
                            <h4>Grading categories</h4>
                            <span
                              className={cx(
                                styles.weightTotal,
                                weightValid
                                  ? styles.weightValid
                                  : styles.weightInvalid,
                              )}
                              role="status"
                            >
                              Total: {formatWeight(totalWeight)}%
                            </span>
                          </div>

                          <div className={styles.categoryList}>
                            {subject.categories.map(
                              (category, categoryIndex) => {
                                const categoryError =
                                  subjectError?.categoryErrors[category.id]
                                return (
                                  <div
                                    key={category.id}
                                    className={styles.categoryRow}
                                  >
                                    <Input
                                      label={`Category ${categoryIndex + 1}`}
                                      value={category.name}
                                      onChange={(event) =>
                                        changeDraft((current) =>
                                          updateCategory(
                                            current,
                                            subject.id,
                                            category.id,
                                            (item) => ({
                                              ...item,
                                              name: event.target.value,
                                            }),
                                          ),
                                        )
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
                                        changeDraft((current) =>
                                          updateCategory(
                                            current,
                                            subject.id,
                                            category.id,
                                            (item) => ({
                                              ...item,
                                              weight: event.target.value,
                                            }),
                                          ),
                                        )
                                      }
                                      placeholder="30"
                                      error={categoryError?.weight}
                                    />
                                    <Button
                                      variant="ghost"
                                      className={styles.categoryRemove}
                                      onClick={() =>
                                        changeDraft((current) =>
                                          updateSubject(
                                            current,
                                            subject.id,
                                            (item) => ({
                                              ...item,
                                              categories: item.categories.filter(
                                                (entry) =>
                                                  entry.id !== category.id,
                                              ),
                                            }),
                                          ),
                                        )
                                      }
                                      disabled={
                                        subject.categories.length === 1
                                      }
                                      aria-label={`Remove category ${categoryIndex + 1} from ${subject.name || `subject ${subjectIndex + 1}`}`}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                )
                              },
                            )}
                          </div>

                          {subjectError?.categories ? (
                            <p className={styles.fieldError} role="alert">
                              {subjectError.categories}
                            </p>
                          ) : null}

                          <Button
                            variant="secondary"
                            onClick={() =>
                              changeDraft((current) =>
                                updateSubject(
                                  current,
                                  subject.id,
                                  (item) => ({
                                    ...item,
                                    categories: [
                                      ...item.categories,
                                      createCategoryDraft(),
                                    ],
                                  }),
                                ),
                              )
                            }
                            disabled={subject.categories.length >= 30}
                          >
                            Add category
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      changeDraft((current) => ({
                        ...current,
                        subjects: [
                          ...current.subjects,
                          createSubjectDraft(),
                        ],
                      }))
                    }
                    disabled={draft.subjects.length >= 30}
                  >
                    Add subject
                  </Button>
                </div>

                {isDesktop ? (
                  <aside className={styles.reviewAside}>
                    <h2 className={styles.sectionTitle}>Review</h2>
                    <ReviewSummary draft={draft} />
                  </aside>
                ) : null}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className={styles.stepPanel}>
              <div className={styles.panelIntro}>
                <h2 className={styles.sectionTitle}>Review and save</h2>
                <p>
                  Check the semester details and grading weights before saving.
                </p>
              </div>
              <ReviewSummary draft={draft} />
            </section>
          ) : null}

          <div className={styles.footer}>
            <div>
              {step > 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((current) => current - 1)}
                  disabled={submitting}
                >
                  Back
                </Button>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? 'Saving…' : nextLabel}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
