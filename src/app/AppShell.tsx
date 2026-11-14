import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CatMascot } from '../components/brand/CatMascot'
import { useAuth } from '../features/auth/useAuth'
import { cx } from '../lib/cx'
import { useOnlineStatus } from './useOnlineStatus'
import {
  HomeIcon,
  ScheduleIcon,
  SettingsIcon,
  SubjectsIcon,
} from './icons'
import styles from './AppShell.module.css'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const primaryNav: NavItem[] = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/subjects', label: 'Subjects', Icon: SubjectsIcon },
  { to: '/schedule', label: 'Schedule', Icon: ScheduleIcon },
]

const secondaryNav: NavItem[] = [
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

function NavItemLink({
  item,
  compact = false,
}: {
  item: NavItem
  compact?: boolean
}) {
  const { to, label, Icon } = item

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          styles.navItem,
          compact && styles.navItemCompact,
          isActive && styles.navItemActive,
        )
      }
    >
      <Icon className={styles.navIcon} />
      <span>{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnlineStatus()
  const [signingOut, setSigningOut] = useState(false)
  const [veilVisible, setVeilVisible] = useState(true)
  const veilRef = useRef<HTMLDivElement>(null)
  const initial = user?.displayName.trim().charAt(0).toUpperCase() || 'N'

  // The veil is a full-screen overlay, so it must never depend only on a CSS
  // animation running. The native animation listener removes it when the fade
  // finishes, and the timer removes it anyway if the animation never starts.
  useEffect(() => {
    const node = veilRef.current
    if (!node) {
      return
    }
    const remove = () => setVeilVisible(false)
    node.addEventListener('animationend', remove)
    const timer = window.setTimeout(remove, 1000)
    return () => {
      node.removeEventListener('animationend', remove)
      window.clearTimeout(timer)
    }
  }, [])

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

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <CatMascot className={styles.brandMark} />
          <span className={styles.brandName} aria-label="NEUming">
            <span className={styles.brandNeu}>NEU</span>
            <span className={styles.brandMing}>ming</span>
          </span>
        </div>

        <nav className={styles.sideNav} aria-label="Primary">
          {primaryNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
          {secondaryNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.profile}>
            <span className={styles.avatar} aria-hidden="true">
              {initial}
            </span>
            <p className={styles.profileName}>
              {user?.displayName ?? 'Student'}
            </p>
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.mobileBar}>
          <div className={styles.mobileBrand}>
            <CatMascot className={styles.mobileBrandMark} />
            <span aria-label="NEUming">
              <span className={styles.brandNeu}>NEU</span>
              <span className={styles.brandMing}>ming</span>
            </span>
          </div>
          <div className={styles.mobileActions}>
            {/*
              The sidebar is hidden below 1024px, so the top bar carries the
              Settings entry point there; the three-item bottom nav stays as
              specified in DESIGN.md.
            */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cx(
                  styles.mobileSettings,
                  isActive && styles.mobileSettingsActive,
                )
              }
              aria-label="Settings"
            >
              <SettingsIcon className={styles.mobileSettingsIcon} />
            </NavLink>
            <button
              type="button"
              className={styles.signOut}
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {!online ? (
            <p className={styles.offlineBanner} role="status" aria-live="polite">
              You are offline. Saved data is read-only until the connection
              returns.
            </p>
          ) : null}
          <div key={location.pathname} className={styles.page}>
            <Outlet />
          </div>
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Primary mobile">
        {primaryNav.map((item) => (
          <NavItemLink key={item.to} item={item} compact />
        ))}
      </nav>

      {/*
        One-shot cream veil: it fades out as the shell mounts, so the boot
        splash and the signed-in app cross-fade instead of hard-cutting. It is
        removed on animation end, with a timer fallback in the effect above.
      */}
      {veilVisible ? (
        <div
          ref={veilRef}
          className={styles.bootVeil}
          aria-hidden="true"
          data-testid="boot-veil"
        />
      ) : null}
    </div>
  )
}
