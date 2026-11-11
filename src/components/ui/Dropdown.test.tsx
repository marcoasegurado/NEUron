import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dropdown, type DropdownOption } from './Dropdown'

const options: DropdownOption[] = [
  { value: 'first', label: 'First semester' },
  { value: 'second', label: 'Second semester' },
  { value: 'summer', label: 'Summer', disabled: true },
]

function renderDropdown(
  overrides: Partial<{
    value: string
    disabled: boolean
    onChange: (value: string) => void
  }> = {},
) {
  const onChange = overrides.onChange ?? vi.fn()
  render(
    <Dropdown
      id="semester"
      label="Semester"
      value={overrides.value ?? 'first'}
      options={options}
      onChange={onChange}
      disabled={overrides.disabled}
    />,
  )
  return { onChange, trigger: screen.getByLabelText('Semester') }
}

afterEach(cleanup)

describe('Dropdown', () => {
  it('opens, selects an option, and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const { onChange, trigger } = renderDropdown()

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('listbox', { name: 'Semester' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'First semester' }),
    ).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('option', { name: 'Second semester' }))

    expect(onChange).toHaveBeenCalledWith('second')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('supports arrow keys and Enter', async () => {
    const user = userEvent.setup()
    const { onChange, trigger } = renderDropdown()

    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toMatch(/-1$/)

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('second')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup()
    const { onChange, trigger } = renderDropdown()

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    const { trigger } = renderDropdown()

    await user.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not open while disabled', async () => {
    const user = userEvent.setup()
    const { trigger } = renderDropdown({ disabled: true })

    await user.click(trigger)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('skips disabled options with the arrow keys', async () => {
    const user = userEvent.setup()
    const { trigger } = renderDropdown()

    trigger.focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')

    // Summer is disabled, so navigation wraps back to the first option.
    expect(trigger.getAttribute('aria-activedescendant')).toMatch(/-0$/)
  })
})
