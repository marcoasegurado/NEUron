import { useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CatMascot } from '../components/brand/CatMascot'
import { useAuth } from '../features/auth/useAuth'
import { cx } from '../lib/cx'
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
  const [signingOut, setSigningOut] = useState(false)
  const initial = user?.displayName.trim().charAt(0).toUpperCase() || 'N'

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
        <div className={styles.content}>
          <div className={styles.mobileBar}>
            <div className={styles.mobileBrand}>
              <CatMascot className={styles.mobileBrandMark} />
              <span aria-label="NEUming">
                <span className={styles.brandNeu}>NEU</span>
                <span className={styles.brandMing}>ming</span>
              </span>
            </div>
            <button
              type="button"
              className={styles.signOut}
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          <Outlet />
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Primary mobile">
        {primaryNav.map((item) => (
          <NavItemLink key={item.to} item={item} compact />
        ))}
      </nav>
    </div>
  )
}
