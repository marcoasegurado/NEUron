import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CatMascot } from './CatMascot'

afterEach(cleanup)

describe('CatMascot', () => {
  it('renders as decorative when no title is provided', () => {
    const { container } = render(<CatMascot />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes an accessible name when a title is provided', () => {
    render(<CatMascot title="Ming the NEUming mascot" />)

    expect(
      screen.getByRole('img', { name: 'Ming the NEUming mascot' }),
    ).toBeInTheDocument()
  })
})
