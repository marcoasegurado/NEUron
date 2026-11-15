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
  PageSkeleton,
  Toast,
} from '../../components/ui'
import {
  academicErrorMessage,
  activateSemester,
  listSemesters,
  type Semester,
} from '../../lib/academic-api'
import { useAuth } from '../auth/useAuth'
import { getConversionTable, type ConversionTableResponse } from './api'
import { PendingAccountsCard } from './PendingAccountsCard'
import { buildGradeScale, semesterStatsLabel } from './view-model'
import styles from './SettingsPage.module.css'

type SettingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      semesters: Semester[]
      table: ConversionTableResponse
    }

const LOAD_ERROR =
  'Could not load your settings. Check your connection and try again.'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [state, setState] = useState<SettingsState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [confirmTarget, setConfirmTarget] = useState<Semester | null>(null)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const online = useOnlineStatus()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const [semesterResponse, table] = await Promise.all([
          listSemesters(),
          getConversionTable(),
        ])
        if (!cancelled) {
          setState({
            status: 'ready',
            semesters: semesterResponse.semesters,
            table,
          })
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: LOAD_ERROR })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  async function handleSwitch(semester: Semester) {
    setSwitchingId(semester.id)
    setSwitchError(null)
    try {
      await activateSemester(semester.id)
      setConfirmTarget(null)
      setNotice(`Switched to ${semester.label}.`)
      reload()
    } catch (error) {
      setSwitchError(
        academicErrorMessage(error, 'Could not switch semesters. Try again.'),
      )
    } finally {
      setSwitchingId(null)
    }
  }

  async function handleSignOut() {
    if (signingOut) {
      return
    }
    setSigningOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const scale = state.status === 'ready' ? buildGradeScale(state.table.rows) : []

  return (
    <>
      <PageHeader
        title="Settings"
        description="Semester, grade scale, and account settings."
      />

      {state.status === 'loading' ? (
        <PageSkeleton label="Loading settings…" count={3} layout="list" />
      ) : null}

      {state.status === 'error' ? (
        <div className={styles.loadError} role="alert">
          <p>{state.message}</p>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className={styles.stack}>
          <Card className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Semester</h2>
              <p className={styles.sectionHint}>
                The active semester drives Home, Subjects, and Schedule.
              </p>
            </div>

            {state.semesters.length === 0 ? (
              <EmptyState
                title="No semesters yet"
                description="Create your first semester to start tracking grades."
                action={
                  <Button onClick={() => navigate('/setup')}>
                    Set up new semester
                  </Button>
                }
              />
            ) : (
              <ul className={styles.list}>
                {state.semesters.map((semester) => (
                  <li
                    key={semester.id}
                    className={
                      semester.isActive
                        ? `${styles.row} ${styles.rowActive}`
                        : styles.row
                    }
                  >
                    <div className={styles.rowMain}>
                      <span className={styles.rowLabel}>{semester.label}</span>
                      <span className={styles.rowMeta}>
                        {`${semester.term} · ${semesterStatsLabel(
                          semester.units,
                          semester.subjectCount,
                        )}`}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      {semester.isActive ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSwitchError(null)
                            setConfirmTarget(semester)
                          }}
                          aria-label={`Switch to ${semester.label}`}
                          disabled={!online}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {switchError ? (
              <p className={styles.inlineError} role="alert">
                {switchError}
              </p>
            ) : null}

            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => navigate('/setup')}>
                Set up new semester
              </Button>
            </div>
          </Card>

          {user?.role === 'owner' ? <PendingAccountsCard /> : null}

          <Card className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Grade scale</h2>
              <p className={styles.sectionHint}>
                One shared table is used for every subject and semester.
              </p>
            </div>

            {!state.table.configured ? (
              <EmptyState
                title="Official NEU thresholds not set"
                description="Percentages stay exact, and numeric grades and GWA show Pending until the table is configured."
              />
            ) : !state.table.valid ? (
              <p className={styles.inlineError} role="alert">
                The conversion table is invalid and cannot be used yet.
                {state.table.errors.length > 0
                  ? ` ${state.table.errors.join(' ')}`
                  : ''}
              </p>
            ) : (
              <ul className={styles.scaleGrid}>
                {scale.map((row) => (
                  <li key={row.threshold} className={styles.scaleRow}>
                    <span className={styles.scaleThreshold}>
                      ≥ {row.threshold}
                    </span>
                    <span className={styles.scaleGrade}>{row.grade}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className={styles.footerNote}>Managed by the NEUming owner.</p>
          </Card>

          <Card className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Account</h2>
            </div>
            <dl className={styles.accountList}>
              <div className={styles.accountRow}>
                <dt className={styles.accountLabel}>Display name</dt>
                <dd className={styles.accountValue}>
                  {user?.displayName ?? 'Student'}
                </dd>
              </div>
              <div className={styles.accountRow}>
                <dt className={styles.accountLabel}>Email</dt>
                <dd className={styles.accountValue}>{user?.email ?? '—'}</dd>
              </div>
            </dl>
            <div className={styles.footer}>
              <Button
                variant="secondary"
                block
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmTarget ? (
        <Modal
          title="Switch semester"
          description={`Switch to ${confirmTarget.label}? Home, Subjects, and Schedule will show this semester.`}
          onClose={() => {
            if (!switchingId) {
              setConfirmTarget(null)
            }
          }}
        >
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setConfirmTarget(null)}
              disabled={Boolean(switchingId)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSwitch(confirmTarget)}
              disabled={!online || Boolean(switchingId)}
            >
              {switchingId === confirmTarget.id
                ? 'Switching…'
                : 'Switch semester'}
            </Button>
          </div>
        </Modal>
      ) : null}

      {notice ? (
        <Toast message={notice} onDismiss={() => setNotice(null)} />
      ) : null}
    </>
  )
}
