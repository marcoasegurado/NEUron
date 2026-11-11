import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { useOnlineStatus } from '../../app/useOnlineStatus'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Toast,
} from '../../components/ui'
import {
  academicErrorMessage,
  deleteScheduleClass,
  getSchedule,
  getSemester,
  listSemesters,
  type ScheduleClass,
  type Semester,
  type SemesterSetup,
} from '../../lib/academic-api'
import { cx } from '../../lib/cx'
import { ClassDialog } from './ClassDialog'
import {
  buildScheduleView,
  buildTimeAxis,
  dayLabel,
  entryPosition,
  formatTime,
  formatTimeRange,
  todayDayOfWeek,
  type ScheduleDayValue,
  type ScheduleEntry,
} from './view-model'
import styles from './SchedulePage.module.css'

const HOUR_HEIGHT = 64

type ScheduleState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; semesters: Semester[] }
  | {
      status: 'ready'
      semesters: Semester[]
      setup: SemesterSetup
      classes: ScheduleClass[]
    }

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; entry: ScheduleEntry }
  | null

const LOAD_ERROR =
  'Could not load your schedule. Check your connection and try again.'

function hourLabel(hour: number): string {
  return formatTime(`${String(hour).padStart(2, '0')}:00`)
}

export function SchedulePage() {
  const navigate = useNavigate()
  const [state, setState] = useState<ScheduleState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedDay, setSelectedDay] = useState<ScheduleDayValue>(() =>
    todayDayOfWeek(),
  )
  const [dialog, setDialog] = useState<DialogState>(null)
  const [details, setDetails] = useState<ScheduleEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const online = useOnlineStatus()

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

        const [setup, schedule] = await Promise.all([
          getSemester(active.id),
          getSchedule(active.id),
        ])
        if (!cancelled) {
          setState({
            status: 'ready',
            semesters,
            setup,
            classes: schedule.classes,
          })
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
    const [setup, schedule] = await Promise.all([
      getSemester(active.id),
      getSchedule(active.id),
    ])
    setState({
      status: 'ready',
      semesters,
      setup,
      classes: schedule.classes,
    })
  }, [])

  const handleSaved = useCallback(
    async (saved: ScheduleClass) => {
      const wasEditing = dialog?.mode === 'edit'
      setDialog(null)
      setDetails(null)
      setSelectedDay(saved.dayOfWeek as ScheduleDayValue)
      setNotice(
        wasEditing
          ? 'Class updated in your weekly schedule.'
          : 'Class saved in your weekly schedule.',
      )
      try {
        await refresh()
      } catch (error) {
        setNotice(
          academicErrorMessage(
            error,
            'The class was saved, but the schedule could not refresh.',
          ),
        )
      }
    },
    [dialog, refresh],
  )

  const closeDelete = useCallback(() => {
    setDeleteTarget(null)
    setDeleteError(null)
  }, [])

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteScheduleClass(deleteTarget.class.id)
      setDeleteTarget(null)
      setNotice('Class deleted from your weekly schedule.')
      await refresh()
    } catch (error) {
      setDeleteError(
        academicErrorMessage(
          error,
          'Could not delete the class. Check your connection and try again.',
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
          title="Schedule"
          description="Loading your active semester."
          stickyOnPhone
          compactOnPhone
        />
        <Card>
          <p className={styles.loading} role="status">
            Loading your schedule…
          </p>
        </Card>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <PageHeader
          title="Schedule"
          actions={<Badge tone="danger">Unavailable</Badge>}
          stickyOnPhone
          compactOnPhone
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
          title="Schedule"
          description="Your weekly classes appear here after semester setup."
          actions={<Badge tone="pending">No active semester</Badge>}
          stickyOnPhone
          compactOnPhone
        />
        <Card>
          <EmptyState
            title="No semester yet"
            description="Set up a semester with its subjects before adding classes to a schedule."
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

  const { setup, classes } = state
  const subjects = setup.subjects
  const view = buildScheduleView(classes, subjects)
  const classCount = view.total
  const selectedDayView =
    view.days.find((day) => day.dayOfWeek === selectedDay) ?? view.days[0]
  const axis = buildTimeAxis(classes, HOUR_HEIGHT)
  const today = todayDayOfWeek()

  function openCreate() {
    setDialog({ mode: 'create' })
  }

  return (
    <>
      <PageHeader
        title="Schedule"
        description={`${setup.semester.label} · ${classCount} ${
          classCount === 1 ? 'class' : 'classes'
        }`}
        stickyOnPhone
        compactOnPhone
        actions={
          <Button
            onClick={openCreate}
            disabled={!online || subjects.length === 0}
          >
            Add class
          </Button>
        }
      />

      {notice ? (
        <Toast message={notice} onDismiss={() => setNotice(null)} />
      ) : null}

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            title="No subjects in this semester"
            description="Add subjects during semester setup before creating a weekly class schedule."
            action={
              <Button onClick={() => navigate('/setup')}>
                Set up semester
              </Button>
            }
          />
        </Card>
      ) : classCount === 0 ? (
        <Card>
          <EmptyState
            title="No classes this week"
            description="Add your first class with its subject, day, start and end time, and an optional room."
            action={
              <Button onClick={openCreate} disabled={!online}>
                Add class
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className={styles.phoneView}>
            <div
              className={styles.dayStrip}
              role="tablist"
              aria-label="Schedule days"
            >
              {view.days.map((day) => {
                const active = day.dayOfWeek === selectedDay
                return (
                  <button
                    key={day.dayOfWeek}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`day-panel-${day.dayOfWeek}`}
                    className={cx(
                      styles.dayTab,
                      active && styles.dayTabActive,
                      day.dayOfWeek === today && styles.dayTabToday,
                    )}
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                  >
                    <span>{day.shortLabel}</span>
                    <span className={styles.dayCount}>
                      {day.entries.length}
                    </span>
                  </button>
                )
              })}
            </div>

            <section
              id={`day-panel-${selectedDayView.dayOfWeek}`}
              role="tabpanel"
              aria-label={`${selectedDayView.label} classes`}
              className={styles.agendaPanel}
            >
              <div className={styles.agendaHead}>
                <h2 className={styles.dayTitle}>{selectedDayView.label}</h2>
                <span className={styles.daySummary}>
                  {selectedDayView.entries.length}{' '}
                  {selectedDayView.entries.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {selectedDayView.entries.length === 0 ? (
                <Card>
                  <p className={styles.emptyDay}>
                    No classes on {selectedDayView.label}.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={openCreate}
                    disabled={!online}
                  >
                    Add class
                  </Button>
                </Card>
              ) : (
                <ul className={styles.agenda}>
                  {selectedDayView.entries.map((entry) => (
                    <li key={entry.class.id}>
                      <button
                        type="button"
                        className={cx(
                          styles.agendaItem,
                          styles[`tone${entry.subjectTone}`],
                        )}
                        onClick={() => setDetails(entry)}
                        aria-label={`${entry.subjectName}, ${formatTimeRange(
                          entry.class.startTime,
                          entry.class.endTime,
                        )}${entry.class.room ? `, ${entry.class.room}` : ''}${
                          entry.conflicts.length > 0
                            ? ', overlaps another class'
                            : ''
                        }`}
                      >
                        <span className={styles.agendaTime}>
                          {formatTime(entry.class.startTime)}
                          <span>{formatTime(entry.class.endTime)}</span>
                        </span>
                        <span className={styles.agendaCopy}>
                          <span className={styles.agendaSubject}>
                            {entry.subjectName}
                          </span>
                          {entry.class.room ? (
                            <span className={styles.agendaRoom}>
                              {entry.class.room}
                            </span>
                          ) : null}
                          {entry.conflicts.length > 0 ? (
                            <span className={styles.conflictNote}>
                              Overlaps with{' '}
                              {entry.conflicts
                                .map((conflict) => conflict.subjectName)
                                .join(', ')}
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.agendaChevron} aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className={styles.desktopView}>
            <div
              className={styles.weekBoard}
              aria-label="Weekly class schedule"
            >
              <div className={styles.corner} aria-hidden="true" />
              {view.days.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={cx(
                    styles.dayHead,
                    day.dayOfWeek === today && styles.dayHeadToday,
                  )}
                >
                  {day.label}
                </div>
              ))}

              <div className={styles.timeColumn} aria-hidden="true">
                {axis.hours.map((hour) => (
                  <div
                    key={hour}
                    className={styles.timeCell}
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {hourLabel(hour)}
                  </div>
                ))}
              </div>

              {view.days.map((day) => (
                <div key={day.dayOfWeek} className={styles.dayColumn}>
                  <div
                    className={styles.dayBody}
                    style={{ height: axis.height }}
                  >
                    {axis.hours.map((hour) => (
                      <div
                        key={hour}
                        className={styles.hourLine}
                        style={{ height: HOUR_HEIGHT }}
                      />
                    ))}

                    {day.entries.map((entry) => {
                      const position = entryPosition(
                        entry,
                        axis,
                        HOUR_HEIGHT,
                      )
                      return (
                        <button
                          key={entry.class.id}
                          type="button"
                          className={cx(
                            styles.classBlock,
                            styles[`tone${entry.subjectTone}`],
                          )}
                          style={{
                            top: position.top,
                            height: position.height,
                          }}
                          onClick={() => setDetails(entry)}
                          aria-label={`${entry.subjectName}, ${formatTimeRange(
                            entry.class.startTime,
                            entry.class.endTime,
                          )}${entry.class.room ? `, ${entry.class.room}` : ''}${
                            entry.conflicts.length > 0
                              ? ', overlaps another class'
                              : ''
                          }`}
                        >
                          <span className={styles.blockTime}>
                            {formatTime(entry.class.startTime)} –{' '}
                            {formatTime(entry.class.endTime)}
                          </span>
                          <span className={styles.blockSubject}>
                            {entry.subjectName}
                          </span>
                          {entry.class.room ? (
                            <span className={styles.blockRoom}>
                              {entry.class.room}
                            </span>
                          ) : null}
                          {entry.conflicts.length > 0 ? (
                            <span
                              className={styles.blockConflict}
                              title="Overlaps another class"
                              aria-hidden="true"
                            >
                              !
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {dialog ? (
        <ClassDialog
          semesterId={setup.semester.id}
          subjects={subjects}
          classes={classes}
          selectedDay={selectedDay}
          entry={dialog.mode === 'edit' ? dialog.entry.class : null}
          onClose={() => setDialog(null)}
          onSaved={(saved) => void handleSaved(saved)}
        />
      ) : null}

      {details ? (
        <Modal
          title={details.subjectName}
          description={`${dayLabel(details.class.dayOfWeek)} · ${formatTimeRange(
            details.class.startTime,
            details.class.endTime,
          )}`}
          onClose={() => setDetails(null)}
        >
          <div className={styles.details}>
            <dl className={styles.detailList}>
              <div>
                <dt>Day</dt>
                <dd>{dayLabel(details.class.dayOfWeek)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {formatTimeRange(
                    details.class.startTime,
                    details.class.endTime,
                  )}
                </dd>
              </div>
              <div>
                <dt>Room</dt>
                <dd>{details.class.room ?? 'Not set'}</dd>
              </div>
            </dl>

            {details.conflicts.length > 0 ? (
              <p className={styles.detailConflict} role="status">
                Overlaps with{' '}
                {details.conflicts
                  .map(
                    (conflict) =>
                      `${conflict.subjectName} (${formatTimeRange(
                        conflict.startTime,
                        conflict.endTime,
                      )})`,
                  )
                  .join(', ')}
                .
              </p>
            ) : null}

            <div className={styles.detailsActions}>
              <Button variant="ghost" onClick={() => setDetails(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const entry = details
                  setDetails(null)
                  setDialog({ mode: 'edit', entry })
                }}
                disabled={!online}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteTarget(details)
                  setDetails(null)
                }}
                disabled={!online}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal
          title="Delete this class?"
          description="The class is permanently removed from the weekly schedule. This cannot be undone."
          onClose={closeDelete}
        >
          <div className={styles.deleteBody}>
            <p className={styles.deleteSummary}>
              <strong>{deleteTarget.subjectName}</strong> ·{' '}
              {dayLabel(deleteTarget.class.dayOfWeek)} ·{' '}
              {formatTimeRange(
                deleteTarget.class.startTime,
                deleteTarget.class.endTime,
              )}
              {deleteTarget.class.room
                ? ` · ${deleteTarget.class.room}`
                : ''}
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
                disabled={!online || deleting}
              >
                {deleting ? 'Deleting…' : 'Delete class'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
