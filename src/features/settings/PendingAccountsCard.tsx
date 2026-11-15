import { useCallback, useEffect, useState } from 'react'
import { useOnlineStatus } from '../../app/useOnlineStatus'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageSkeleton,
} from '../../components/ui'
import { ApiError } from '../../lib/api'
import {
  approveAccount,
  listPendingAccounts,
  rejectAccount,
  type PendingAccount,
} from './accounts-api'
import styles from './PendingAccountsCard.module.css'

type PendingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; accounts: PendingAccount[] }

function actionMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Could not update that request. Check your connection and try again.'
}

export function PendingAccountsCard() {
  const [state, setState] = useState<PendingState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const online = useOnlineStatus()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const accounts = await listPendingAccounts()
        if (!cancelled) {
          setState({ status: 'ready', accounts })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', message: actionMessage(error) })
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

  async function decide(
    account: PendingAccount,
    decision: 'approve' | 'reject',
  ) {
    setBusyId(account.id)
    setActionError(null)
    setNotice(null)
    try {
      if (decision === 'approve') {
        await approveAccount(account.id)
      } else {
        await rejectAccount(account.id)
      }
      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              accounts: current.accounts.filter(
                (entry) => entry.id !== account.id,
              ),
            }
          : current,
      )
      setNotice(
        decision === 'approve'
          ? `${account.displayName} can now log in.`
          : `Request from ${account.displayName} was rejected.`,
      )
    } catch (error) {
      setActionError(actionMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>Account requests</h2>
          {state.status === 'ready' && state.accounts.length > 0 ? (
            <Badge tone="warning">{state.accounts.length} waiting</Badge>
          ) : null}
        </div>
        <p className={styles.sectionHint}>
          New registrations wait here until you approve them. Only the owner
          sees this card.
        </p>
      </div>

      {state.status === 'loading' ? (
        <PageSkeleton label="Loading account requests…" count={2} layout="list" />
      ) : null}

      {state.status === 'error' ? (
        <div className={styles.inlineError} role="alert">
          <p>{state.message}</p>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        state.accounts.length === 0 ? (
          <EmptyState
            title="No account requests"
            description="When someone registers, their request appears here for approval."
          />
        ) : (
          <ul className={styles.list}>
            {state.accounts.map((account) => {
              return (
                <li
                  key={account.id}
                  className={styles.row}
                  aria-busy={busyId === account.id}
                >
                  <div className={styles.rowMain}>
                    <span className={styles.rowLabel}>
                      {account.displayName}
                    </span>
                    <span className={styles.rowMeta}>
                      {account.email}
                      {account.username ? ` · ${account.username}` : ''}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    <Button
                      variant="secondary"
                      onClick={() => void decide(account, 'reject')}
                      aria-label={`Reject ${account.displayName}`}
                      disabled={!online || Boolean(busyId)}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => void decide(account, 'approve')}
                      aria-label={`Approve ${account.displayName}`}
                      disabled={!online || Boolean(busyId)}
                    >
                      Approve
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      ) : null}

      {actionError ? (
        <p className={styles.inlineErrorText} role="alert">
          {actionError}
        </p>
      ) : null}

      {notice ? (
        <p className={styles.success} role="status">
          {notice}
        </p>
      ) : null}
    </Card>
  )
}
