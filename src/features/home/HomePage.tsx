import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { usePhoneScrolled } from '../../app/usePhoneScrolled'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  Select,
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
import { formatNumber } from '../../lib/grading/grading'
import { ActivityDialog } from '../activities/ActivityDialog'
import { buildHomeView } from './view-model'
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

export function HomePage() {
  const navigate = useNavigate()
  const [state, setState] = useState<HomeState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  const compactHeader = usePhoneScrolled()

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
            description="NEUron needs a semester and its subjects before it can calculate grades."
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

  return (
    <>
      <PageHeader
        title="Home"
        description={`${state.setup.semester.label} · ${subjectCount} ${
          subjectCount === 1 ? 'subject' : 'subjects'
        }`}
        stickyOnPhone
        compactOnPhone={compactHeader}
        actions={
          <>
            {compactHeader ? null : (
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
            )}
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

      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      <Card className={styles.statusBanner}>
        <div className={styles.statusCopy}>
          <Badge tone="pending">Grade Pending</Badge>
          <h2 className={styles.statusTitle}>
            Percentages are exact; numeric grades are pending
          </h2>
          <p className={styles.statusText}>
            Official NEU percentage-to-grade thresholds are still being
            verified. NEUron will not show invented grades or a GWA.
          </p>
        </div>
      </Card>

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
        <section className={styles.grid} aria-label="Subject percentages">
          {view.subjects.map((subject) => {
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
