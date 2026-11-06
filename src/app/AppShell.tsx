import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            N
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>NEUron</span>
            <span className={styles.brandTag}>Grade monitoring</span>
          </div>
        </div>

        <nav className={styles.sideNav} aria-label="Primary">
          {primaryNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
          <div className={styles.navDivider} />
          {secondaryNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            S
          </span>
          <div>
            <p className={styles.profileName}>Student</p>
            <p className={styles.profileMeta}>Signed out</p>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
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
