import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PageSkeleton } from './PageSkeleton'

afterEach(cleanup)

const bars = (node: HTMLElement) =>
  node.querySelectorAll('[aria-hidden="true"]').length

describe('PageSkeleton', () => {
  it('announces the loading state and hides the placeholder bars', () => {
    const { container } = render(
      <PageSkeleton label="Loading your dashboard…" summary count={3} layout="grid" />,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading your dashboard…')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(bars(container)).toBeGreaterThan(3)
  })

  it('renders one placeholder card per requested item', () => {
    const three = render(<PageSkeleton label="Loading settings…" count={3} />)
    const five = render(<PageSkeleton label="Loading settings…" count={5} />)

    expect(bars(five.container)).toBeGreaterThan(bars(three.container))
  })

  it('omits the summary card unless it is requested', () => {
    const withoutSummary = render(
      <PageSkeleton label="Loading settings…" count={1} />,
    )
    const withSummary = render(
      <PageSkeleton label="Loading dashboard…" summary count={1} />,
    )

    expect(bars(withSummary.container)).toBe(bars(withoutSummary.container) + 3)
  })

  it('renders the weekly board plus the agenda rows for schedules', () => {
    const { container } = render(
      <PageSkeleton label="Loading your schedule…" count={2} layout="schedule" />,
    )
    const list = render(
      <PageSkeleton label="Loading your schedule…" count={2} layout="list" />,
    )

    // One decorative board wrapper (six day columns plus a time gutter) and a
    // richer placeholder than the plain list layout.
    expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1)
    expect(bars(container)).toBeGreaterThan(bars(list.container) * 2)
  })
})
