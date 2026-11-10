import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { useIsPhone } from '../../app/useIsPhone'
import { CatMascot } from '../../components/brand/CatMascot'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  Select,
  Toast,
} from '../../components/ui'
import {
  academicErrorMessage,
  activateSemester,
  getSemester,
  listSemesters,
  type Activity,
  type Semester,
  type SemesterSetup,
} from '../../lib/academic-api'
import { cx } from '../../lib/cx'
import { formatNumber } from '../../lib/grading/grading'
import { ActivityDialog } from '../activities/ActivityDialog'
import { buildHomeView, type SubjectSummary } from './view-model'
import styles from './HomePage.module.css'

type HomeState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; semesters: Semester[] }
  | {
      status: 'ready'
      semesters: Semester[]
      setup: SemesterSetup
    }

const LOAD_ERROR =
  'Could not load your dashboard. Check your connection and try again.'

function phoneStatus(subject: SubjectSummary): {
  text: string
  tone: 'strong' | 'low'
} {
  if (subject.percentage !== null) {
    return { text: 'All categories scored', tone: 'strong' }
  }
  if (
    subject.pendingReason === 'incomplete-categories' &&
    subject.incompleteCategoryNames.length > 0
  ) {
    return {
      text: `Needs: ${subject.incompleteCategoryNames.join(', ')}`,
      tone: 'low',
    }
  }
  if (subject.scoreCount === 0) {
    return { text: 'Add a score to get started.', tone: 'low' }
  }
  return { text: subject.pendingMessage, tone: 'low' }
}

export function HomePage() {
  const navigate = useNavigate()
  const [state, setState] = useState<HomeState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  const isPhone = useIsPhone()

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

  const closeDialog = useCallback(() => setDialogOpen(false), [])

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

  const handleSaved = useCallback(
    async (activity: Activity) => {
      setDialogOpen(false)
      setNotice(`“${activity.name}” saved.`)
      try {
        await refresh()
      } catch (error) {
        setNotice(
          academicErrorMessage(
            error,
            'The score was saved, but the dashboard could not refresh.',
          ),
        )
      }
    },
    [refresh],
  )

  async function handleSwitch(semesterId: string) {
    if (state.status !== 'ready' || semesterId === state.setup.semester.id) {
      return
    }

    setSwitching(true)
    setNotice(null)
    try {
      await activateSemester(semesterId)
      const setup = await getSemester(semesterId)
      setState({
        status: 'ready',
        semesters: state.semesters.map((semester) => ({
          ...semester,
          isActive: semester.id === semesterId,
        })),
        setup,
      })
    } catch (error) {
      setNotice(
        academicErrorMessage(error, 'Could not switch semesters. Try again.'),
      )
    } finally {
      setSwitching(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader
          title="Home"
          description="Loading your active semester."
        />
        <Card>
          <p className={styles.loading} role="status">
            Loading your dashboard…
          </p>
        </Card>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <PageHeader
          title="Home"
          actions={<Badge tone="danger">Unavailable</Badge>}
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
          title="Home"
          description="Your current grades will appear here once a semester is set up."
          actions={<Badge tone="pending">No active semester</Badge>}
        />
        <Card>
          <EmptyState
            title="No semester yet"
            description="NEUming needs a semester and its subjects before it can calculate grades."
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

  const view = buildHomeView(state.setup.subjects)
  const subjectCount = view.subjects.length
  const firstGraded = view.subjects.find(
    (subject) => subject.percentage !== null,
  )
  const heroMessage = firstGraded
    ? `${firstGraded.name} is looking great! Keep it up.`
    : 'Add scores to see how you are tracking.'

  return (
    <>
      {isPhone ? (
        <div className={styles.phoneHeader}>
          <div className={styles.phoneHero}>
            <CatMascot className={styles.heroMascot} />
            <p className={styles.heroBubble}>{heroMessage}</p>
          </div>

          <div className={styles.semesterPill}>
            <span className={styles.semesterLabel}>
              {state.setup.semester.label}
            </span>
            <span className={styles.semesterSwitch} aria-hidden="true">
              Switch
            </span>
            <select
              className={styles.semesterSelect}
              aria-label="Semester"
              value={state.setup.semester.id}
              onChange={(event) => void handleSwitch(event.target.value)}
              disabled={switching || state.semesters.length < 2}
            >
              {state.semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.label}
                  {semester.isActive ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <h1 className={styles.phoneTitle}>Current grades</h1>
        </div>
      ) : (
        <PageHeader
          title="Home"
          description={`${state.setup.semester.label} · ${subjectCount} ${
            subjectCount === 1 ? 'subject' : 'subjects'
          }`}
          actions={
            <>
              <Select
                label="Semester"
                value={state.setup.semester.id}
                onChange={(event) => void handleSwitch(event.target.value)}
                disabled={switching || state.semesters.length < 2}
                className={styles.switcher}
              >
                {state.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.label}
                    {semester.isActive ? ' (active)' : ''}
                  </option>
                ))}
              </Select>
              <Button
                className={styles.addScoreButton}
                onClick={() => setDialogOpen(true)}
                disabled={subjectCount === 0}
              >
                Add Score
              </Button>
            </>
          }
        />
      )}

      {notice ? (
        <Toast message={notice} onDismiss={() => setNotice(null)} />
      ) : null}

      {isPhone ? null : (
        <Card className={styles.statusBanner}>
          <div className={styles.statusCopy}>
            <Badge tone="pending">Grade Pending</Badge>
            <h2 className={styles.statusTitle}>
              Percentages are exact; numeric grades are pending
            </h2>
            <p className={styles.statusText}>
              Official NEU percentage-to-grade thresholds are still being
              verified. NEUming will not show invented grades or a GWA.
            </p>
          </div>
        </Card>
      )}

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
        <section
          className={cx(styles.grid, isPhone && styles.phoneGrid)}
          aria-label="Subject percentages"
        >
          {view.subjects.map((subject) => {
            if (isPhone) {
              const status = phoneStatus(subject)

              return (
                <Card
                  key={subject.id}
                  className={cx(styles.subjectCard, styles.phoneCard)}
                >
                  <div className={styles.phoneRow}>
                    <div className={styles.phoneCopy}>
                      <h2 className={styles.subjectName}>{subject.name}</h2>
                      <p className={styles.subjectMeta}>
                        {subject.units}{' '}
                        {subject.units === 1 ? 'unit' : 'units'}
                        {subject.professor ? ` | ${subject.professor}` : ''}
                      </p>
                      <p
                        className={cx(
                          styles.phoneStatus,
                          status.tone === 'strong'
                            ? styles.phoneStatusStrong
                            : styles.phoneStatusLow,
                        )}
                      >
                        {status.text}
                      </p>
                    </div>
                    <span
                      className={cx(
                        styles.gradeTile,
                        subject.percentage === null &&
                          styles.gradeTilePending,
                      )}
                    >
                      {subject.percentage === null
                        ? '—'
                        : `${formatNumber(subject.percentage, 0)}%`}
                    </span>
                  </div>
                </Card>
              )
            }

            const progress =
              subject.activeCategoryCount > 0
                ? (subject.completedCategoryCount /
                    subject.activeCategoryCount) *
                  100
                : 0

            return (
              <Card key={subject.id} className={styles.subjectCard}>
                <div className={styles.subjectHead}>
                  <div className={styles.subjectCopy}>
                    <h2 className={styles.subjectName}>{subject.name}</h2>
                    <p className={styles.subjectMeta}>
                      {subject.units}{' '}
                      {subject.units === 1 ? 'unit' : 'units'}
                      {subject.professor ? ` · ${subject.professor}` : ''}
                    </p>
                  </div>
                  {subject.percentage !== null ? (
                    <div className={styles.percentageBlock}>
                      <span className={styles.percentage}>
                        {formatNumber(subject.percentage, 2)}%
                      </span>
                      <Badge tone="pending">Grade Pending</Badge>
                    </div>
                  ) : (
                    <Badge tone="pending">No Grade Yet</Badge>
                  )}
                </div>

                <Progress
                  value={progress}
                  label={`${subject.completedCategoryCount} of ${subject.activeCategoryCount} categories scored`}
                  tone="gold"
                />

                {subject.pendingReason ? (
                  <p className={styles.pendingReason}>
                    {subject.pendingMessage}
                  </p>
                ) : (
                  <p className={styles.gradedNote}>
                    All active categories have scores.
                  </p>
                )}
              </Card>
            )
          })}
        </section>
      )}

      {isPhone ? (
        <button
          type="button"
          className={styles.fab}
          aria-label="Add score"
          onClick={() => setDialogOpen(true)}
          disabled={subjectCount === 0}
        >
          <span aria-hidden="true">+</span>
        </button>
      ) : null}

      {dialogOpen ? (
        <ActivityDialog
          subjects={state.setup.subjects}
          onClose={closeDialog}
          onSaved={(activity) => void handleSaved(activity)}
        />
      ) : null}
    </>
  )
}
