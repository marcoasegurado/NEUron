import { Card } from './Card'
import { Skeleton } from './Skeleton'
import styles from './PageSkeleton.module.css'

/** Shape the placeholder takes; each matches a real page layout. */
export type PageSkeletonLayout = 'list' | 'grid' | 'schedule'

export interface PageSkeletonProps {
  /** Announced to assistive tech while the page loads. */
  label: string
  /** Number of placeholder cards or rows. Ignored by the `schedule` board. */
  count?: number
  /** Adds a summary card sized like the Semester GWA card. */
  summary?: boolean
  /**
   * `list` for full-width stacked cards (Subjects, Settings), `grid` for the
   * responsive subject grid (Home), `schedule` for the weekly board.
   */
  layout?: PageSkeletonLayout
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_ROWS = 6

/**
 * Page-level loading placeholder shaped like the content that replaces it, per
 * `DESIGN.md` §6 "Loading and skeleton states". The bars are decorative and
 * hidden from assistive tech; the wrapper carries the live status message.
 */
export function PageSkeleton({
  label,
  count = 3,
  summary = false,
  layout = 'list',
}: PageSkeletonProps) {
  const items = Array.from({ length: count }, (_, index) => index)

  return (
    <div
      className={styles.wrap}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>{label}</span>

      {summary ? (
        <Card className={styles.summary}>
          <Skeleton width="34%" height="1rem" radius={8} />
          <Skeleton width="58%" height="2.25rem" radius={12} />
          <Skeleton width="42%" height="0.85rem" radius={8} />
        </Card>
      ) : null}

      {layout === 'list' ? (
        <div className={styles.list}>
          {items.map((index) => (
            <Card key={index} className={styles.listCard}>
              <span className={styles.listHead}>
                <Skeleton width="46%" height="1.05rem" radius={8} />
                <Skeleton width="92px" height="1.5rem" radius={999} />
              </span>
              <Skeleton width="34%" height="0.8rem" radius={8} />
              <Skeleton width="62%" height="0.65rem" radius={999} />
            </Card>
          ))}
        </div>
      ) : null}

      {layout === 'grid' ? (
        <div className={styles.grid}>
          {items.map((index) => (
            <Card key={index} className={styles.gridCard}>
              <span className={styles.listHead}>
                <Skeleton width="52%" height="1.05rem" radius={8} />
                <Skeleton width="30%" height="1.05rem" radius={8} />
              </span>
              <Skeleton width="44%" height="0.8rem" radius={8} />
              <span className={styles.gridFoot}>
                <Skeleton width="46%" height="0.7rem" radius={999} />
                <Skeleton width="24%" height="0.7rem" radius={999} />
              </span>
              <Skeleton width="100%" height="0.55rem" radius={999} />
            </Card>
          ))}
        </div>
      ) : null}

      {layout === 'schedule' ? (
        <div className={styles.schedule}>
          {/* Desktop: the weekly board the real page renders at >= 1024px. */}
          <div className={styles.board} aria-hidden="true">
            <div className={styles.boardGutter}>
              <Skeleton width="32px" height="0.7rem" radius={6} />
              {Array.from({ length: TIME_ROWS }, (_, index) => (
                <Skeleton key={index} width="30px" height="0.55rem" radius={6} />
              ))}
            </div>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.boardDay}>
                <Skeleton width="70%" height="0.9rem" radius={8} />
                <Skeleton width="100%" height="3.2rem" radius={12} />
                <Skeleton width="100%" height="2.1rem" radius={12} />
                <Skeleton width="84%" height="2.6rem" radius={12} />
              </div>
            ))}
          </div>

          {/* Narrow screens: the stacked agenda rows the real page renders. */}
          <div className={styles.rows}>
            {items.map((index) => (
              <Card key={index} className={styles.row}>
                <Skeleton width="58px" height="2.2rem" radius={12} />
                <span className={styles.rowBody}>
                  <Skeleton width="56%" height="0.95rem" radius={8} />
                  <Skeleton width="38%" height="0.8rem" radius={8} />
                  <Skeleton width="30%" height="0.65rem" radius={8} />
                </span>
                <Skeleton width="12px" height="18px" radius={6} />
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
