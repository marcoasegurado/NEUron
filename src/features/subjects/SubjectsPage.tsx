import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
} from '../../components/ui'
import {
  academicErrorMessage,
  deleteActivity,
  getSemester,
  listSemesters,
  type Activity,
  type Semester,
  type SemesterSetup,
} from '../../lib/academic-api'
import { formatNumber } from '../../lib/grading/grading'
import {
  ActivityDialog,
  type ActivityDialogProps,
} from '../activities/ActivityDialog'
import {
  buildSubjectsView,
  formatActivityDate,
  type ActivityDetail,
} from './view-model'
import styles from './SubjectsPage.module.css'

type SubjectsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; semesters: Semester[] }
  | {
      status: 'ready'
      semesters: Semester[]
      setup: SemesterSetup
    }

type DialogState =
  | {
      mode: 'create'
      subjectId: string
      categoryId: string
    }
  | { mode: 'edit'; activity: ActivityDetail }
  | null

const LOAD_ERROR =
  'Could not load your subjects. Check your connection and try again.'

function categoryCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'category' : 'categories'}`
}

export function SubjectsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<SubjectsState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<ActivityDetail | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const { semesters } = await listSemesters()
        const active = semesters.find((semester) => semester.isActive)
        if (!active) {
          if (!cancelled) {
            setState({ status: 'empty', semesters })
          }
          return
        }

        const setup = await getSemester(active.id)
        if (!cancelled) {
          setState({ status: 'ready', semesters, setup })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: academicErrorMessage(error, LOAD_ERROR),
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refresh = useCallback(async () => {
    const { semesters } = await listSemesters()
    const active = semesters.find((semester) => semester.isActive)
    if (!active) {
      setState({ status: 'empty', semesters })
      return
    }
    const setup = await getSemester(active.id)
    setState({ status: 'ready', semesters, setup })
  }, [])

  const closeDialog = useCallback(() => setDialog(null), [])

  const closeDelete = useCallback(() => {
    setDeleteTarget(null)
    setDeleteError(null)
  }, [])

  const handleSaved = useCallback(
    async (activity: Activity) => {
      const wasEditing = dialog?.mode === 'edit'
      setDialog(null)
      setNotice(
        wasEditing
          ? `“${activity.name}” updated. Percentages recalculated.`
          : `“${activity.name}” saved. Percentages recalculated.`,
      )
      try {
        await refresh()
      } catch (error) {
        setNotice(
          academicErrorMessage(
            error,
            'The score was saved, but the subjects could not refresh.',
          ),
        )
      }
    },
    [dialog, refresh],
  )

  function toggleSubject(subjectId: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.add(subjectId)
      }
      return next
    })
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteActivity(deleteTarget.id)
      const name = deleteTarget.name
      setDeleteTarget(null)
      setNotice(`“${name}” deleted. Percentages recalculated.`)
      await refresh()
    } catch (error) {
      setDeleteError(
        academicErrorMessage(
          error,
          'Could not delete the score. Check your connection and try again.',
        ),
      )
    } finally {
      setDeleting(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader
          title="Subjects"
          description="Loading your active semester."
          stickyOnPhone
        />
        <Card>
          <p className={styles.loading} role="status">
            Loading your subjects…
          </p>
        </Card>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <PageHeader
          title="Subjects"
          actions={<Badge tone="danger">Unavailable</Badge>}
          stickyOnPhone
        />
        <Card>
          <p className={styles.loadError} role="alert">
            {state.message}
          </p>
          <div className={styles.errorActions}>
            <Button onClick={() => setReloadKey((current) => current + 1)}>
              Try again
            </Button>
          </div>
        </Card>
      </>
    )
  }

  if (state.status === 'empty') {
    return (
      <>
        <PageHeader
          title="Subjects"
          description="Subject details appear here after semester setup."
          actions={<Badge tone="pending">No active semester</Badge>}
          stickyOnPhone
        />
        <Card>
          <EmptyState
            title="No semester yet"
            description="Set up a semester with its subjects and grading categories before recording scores."
            action={
              <Button onClick={() => navigate('/setup')}>
                Set up semester
              </Button>
            }
          />
        </Card>
      </>
    )
  }

  const { setup } = state
  const view = buildSubjectsView(setup.subjects)
  const subjectCount = view.subjects.length

  const dialogProps: ActivityDialogProps | null =
    dialog?.mode === 'create'
      ? {
          subjects: setup.subjects,
          defaults: {
            subjectId: dialog.subjectId,
            categoryId: dialog.categoryId,
          },
          onClose: closeDialog,
          onSaved: (activity) => void handleSaved(activity),
        }
      : dialog?.mode === 'edit'
        ? {
            subjects: setup.subjects,
            activity: dialog.activity,
            onClose: closeDialog,
            onSaved: (activity) => void handleSaved(activity),
          }
        : null

  return (
    <>
      <PageHeader
        title="Subjects"
        description={`${setup.semester.label} · ${subjectCount} ${
          subjectCount === 1 ? 'subject' : 'subjects'
        }`}
        stickyOnPhone
      />

      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      {subjectCount === 0 ? (
        <Card>
          <EmptyState
            title="No subjects in this semester"
            description="Add subjects and grading categories before recording scores."
            action={
              <Button onClick={() => navigate('/setup')}>
                Set up semester
              </Button>
            }
          />
        </Card>
      ) : (
        <section className={styles.list} aria-label="Subjects and scores">
          {view.subjects.map((subject) => {
            const isExpanded = expanded.has(subject.id)
            const panelId = `subject-panel-${subject.id}`

            return (
              <Card key={subject.id} className={styles.subjectCard}>
                <div className={styles.subjectHead}>
                  <h2 className={styles.subjectTitle}>
                    <button
                      type="button"
                      className={styles.toggle}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() => toggleSubject(subject.id)}
                    >
                      <span
                        className={styles.chevron}
                        data-expanded={isExpanded}
                        aria-hidden="true"
                      >
                        ›
                      </span>
                      <span className={styles.subjectCopy}>
                        <span className={styles.subjectName}>
                          {subject.name}
                        </span>
                        <span className={styles.subjectMeta}>
                          {subject.units}{' '}
                          {subject.units === 1 ? 'unit' : 'units'}
                          {subject.professor
                            ? ` · ${subject.professor}`
                            : ''}
                          {` · ${categoryCountLabel(
                            subject.activeCategoryCount,
                          )}`}
                        </span>
                      </span>
                    </button>
                  </h2>

                  <div className={styles.subjectSummary}>
                    {subject.percentage !== null ? (
                      <>
                        <span className={styles.percentage}>
                          {formatNumber(subject.percentage, 2)}%
                        </span>
                        <Badge tone="pending">Grade Pending</Badge>
                      </>
                    ) : (
                      <Badge tone="pending">No Grade Yet</Badge>
                    )}
                  </div>
                </div>

                {isExpanded ? (
                  <div id={panelId} className={styles.subjectBody}>
                    {subject.pendingReason ? (
                      <p className={styles.pendingReason}>
                        {subject.pendingMessage}
                      </p>
                    ) : (
                      <p className={styles.gradedNote}>
                        All active categories have scores.
                      </p>
                    )}

                    <div className={styles.categoryList}>
                      {subject.categories.map((category) => (
                        <section
                          key={category.id}
                          className={styles.category}
                          aria-label={category.name}
                        >
                          <div className={styles.categoryHead}>
                            <div className={styles.categoryCopy}>
                              <h3 className={styles.categoryName}>
                                {category.name}
                                {category.isActive ? null : (
                                  <Badge tone="neutral">Inactive</Badge>
                                )}
                              </h3>
                              <p className={styles.categoryMeta}>
                                {formatNumber(category.weightPercent, 2)}% of
                                grade ·{' '}
                                {category.activities.length}{' '}
                                {category.activities.length === 1
                                  ? 'activity'
                                  : 'activities'}
                              </p>
                            </div>

                            <div className={styles.categoryScore}>
                              {category.average !== null ? (
                                <span className={styles.categoryAverage}>
                                  {formatNumber(category.average, 2)}%
                                </span>
                              ) : (
                                <span className={styles.categoryPending}>
                                  No scores yet
                                </span>
                              )}
                              {category.isActive ? (
                                <Button
                                  variant="secondary"
                                  className={styles.categoryAddButton}
                                  onClick={() =>
                                    setDialog({
                                      mode: 'create',
                                      subjectId: subject.id,
                                      categoryId: category.id,
                                    })
                                  }
                                  aria-label={`Add score for ${category.name} in ${subject.name}`}
                                >
                                  Add score
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          {category.activities.length === 0 ? (
                            <p className={styles.emptyCategory}>
                              No scores in this category yet. Add one to start
                              its average.
                            </p>
                          ) : (
                            <ul className={styles.activityList}>
                              {category.activities.map((activity) => (
                                <li
                                  key={activity.id}
                                  className={styles.activityRow}
                                >
                                  <div className={styles.activityCopy}>
                                    <span className={styles.activityName}>
                                      {activity.name}
                                    </span>
                                    <span className={styles.activityDate}>
                                      {formatActivityDate(activity.date)}
                                    </span>
                                  </div>
                                  <span className={styles.activityResult}>
                                    <span className={styles.activityScore}>
                                      {formatNumber(activity.scoreEarned, 2)} /{' '}
                                      {formatNumber(activity.totalPoints, 2)}
                                    </span>
                                    <span className={styles.activityPercent}>
                                      {activity.percentage === null
                                        ? '—'
                                        : `${formatNumber(
                                            activity.percentage,
                                            2,
                                          )}%`}
                                    </span>
                                  </span>
                                  <div className={styles.activityActions}>
                                    <Button
                                      variant="ghost"
                                      onClick={() =>
                                        setDialog({
                                          mode: 'edit',
                                          activity,
                                        })
                                      }
                                      aria-label={`Edit ${activity.name}`}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={() => {
                                        setDeleteError(null)
                                        setDeleteTarget(activity)
                                      }}
                                      aria-label={`Delete ${activity.name}`}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            )
          })}
        </section>
      )}

      {dialogProps ? <ActivityDialog {...dialogProps} /> : null}

      {deleteTarget ? (
        <Modal
          title="Delete this score?"
          description="The activity is permanently removed and every affected average is recalculated. This cannot be undone."
          onClose={closeDelete}
        >
          <div className={styles.deleteBody}>
            <p className={styles.deleteSummary}>
              <strong>{deleteTarget.name}</strong> ·{' '}
              {formatNumber(deleteTarget.scoreEarned, 2)} /{' '}
              {formatNumber(deleteTarget.totalPoints, 2)} on{' '}
              {formatActivityDate(deleteTarget.date)}
            </p>

            {deleteError ? (
              <p className={styles.submitError} role="alert">
                {deleteError}
              </p>
            ) : null}

            <div className={styles.deleteActions}>
              <Button
                variant="ghost"
                onClick={closeDelete}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete score'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
