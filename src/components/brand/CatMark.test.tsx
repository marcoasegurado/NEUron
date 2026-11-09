import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CatMark } from './CatMark'

afterEach(cleanup)

describe('CatMark', () => {
  it('renders as decorative when no title is provided', () => {
    const { container } = render(<CatMark />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('exposes an accessible name when a title is provided', () => {
    render(<CatMark title="NEUming" />)

    expect(screen.getByRole('img', { name: 'NEUming' })).toBeInTheDocument()
  })
})
