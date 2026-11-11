import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface DropdownProps {
  id: string
  /** Accessible name for the trigger and the listbox. */
  label: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
  triggerClassName?: string
  renderTrigger?: (selectedLabel: string) => ReactNode
}

const TYPEAHEAD_RESET_MS = 500

function CheckIcon() {
  return (
    <svg
      className={styles.check}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m3.5 8.5 3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Accessible listbox dropdown. The trigger keeps DOM focus and points at the
 * active row with `aria-activedescendant`, following the ARIA 1.2 combobox
 * pattern, so keyboard and screen-reader behaviour stays predictable.
 */
export function Dropdown({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
  className,
  triggerClassName,
  renderTrigger,
}: DropdownProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLLIElement | null>>([])
  const typeaheadRef = useRef('')
  const typeaheadTimer = useRef<number | undefined>(undefined)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  )

  const selectedLabel =
    selectedIndex >= 0 ? options[selectedIndex].label : ''

  useEffect(() => {
    return () => window.clearTimeout(typeaheadTimer.current)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    optionRefs.current[activeIndex]?.scrollIntoView?.({
      block: 'nearest',
    })
  }, [open, activeIndex])

  function firstEnabledIndex(from = 0, step = 1) {
    const total = options.length
    for (let offset = 0; offset < total; offset += 1) {
      const index = (from + offset * step + total) % total
      if (!options[index]?.disabled) {
        return index
      }
    }
    return -1
  }

  function moveActive(delta: number) {
    const total = options.length
    if (total === 0) {
      return
    }
    let next = activeIndex
    for (let step = 0; step < total; step += 1) {
      next = (next + delta + total) % total
      if (!options[next]?.disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  function openList(index: number) {
    if (disabled || options.length === 0) {
      return
    }
    const fallback = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex()
    const candidate = index >= 0 ? index : fallback
    setActiveIndex(options[candidate]?.disabled ? fallback : candidate)
    setOpen(true)
  }

  function closeList(refocus = false) {
    setOpen(false)
    if (refocus) {
      triggerRef.current?.focus()
    }
  }

  function commit(index: number) {
    const option = options[index]
    if (!option || option.disabled) {
      closeList(true)
      return
    }
    if (option.value !== value) {
      onChange(option.value)
    }
    closeList(true)
  }

  function handleTypeahead(character: string) {
    typeaheadRef.current += character.toLowerCase()
    window.clearTimeout(typeaheadTimer.current)
    typeaheadTimer.current = window.setTimeout(() => {
      typeaheadRef.current = ''
    }, TYPEAHEAD_RESET_MS)

    const term = typeaheadRef.current
    const total = options.length
    if (total === 0) {
      return
    }

    const start = open && activeIndex >= 0 ? activeIndex : selectedIndex
    for (let offset = 1; offset <= total; offset += 1) {
      const index = (Math.max(start, 0) + offset) % total
      const option = options[index]
      if (option && !option.disabled && option.label.toLowerCase().startsWith(term)) {
        setActiveIndex(index)
        setOpen(true)
        return
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (open) {
          moveActive(1)
        } else {
          openList(selectedIndex)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (open) {
          moveActive(-1)
        } else {
          openList(firstEnabledIndex(options.length - 1, -1))
        }
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActiveIndex(firstEnabledIndex())
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActiveIndex(firstEnabledIndex(options.length - 1, -1))
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) {
          commit(activeIndex)
        } else {
          openList(selectedIndex)
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeList(true)
        }
        break
      case 'Tab':
        if (open) {
          setOpen(false)
        }
        break
      default:
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          handleTypeahead(event.key)
        }
    }
  }

  return (
    <div ref={rootRef} className={cx(styles.dropdown, className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cx(
          styles.trigger,
          triggerClassName,
          open && styles.triggerOpen,
          invalid && styles.triggerInvalid,
          disabled && styles.triggerDisabled,
        )}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList(selectedIndex))}
        onKeyDown={handleKeyDown}
      >
        {renderTrigger ? (
          renderTrigger(selectedLabel)
        ) : (
          <span className={styles.value}>{selectedLabel}</span>
        )}
        <svg
          className={cx(styles.chevron, open && styles.chevronOpen)}
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M4 6.25 8 10.25 12 6.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul id={listId} role="listbox" aria-label={label} className={styles.panel}>
          {options.length === 0 ? (
            <li className={styles.empty} role="option" aria-disabled="true">
              No options
            </li>
          ) : (
            options.map((option, index) => {
              const selected = option.value === value
              return (
                <li
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node
                  }}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  className={cx(
                    styles.option,
                    index === activeIndex && styles.optionActive,
                    selected && styles.optionSelected,
                    option.disabled && styles.optionDisabled,
                  )}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setActiveIndex(index)
                    }
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {selected ? <CheckIcon /> : null}
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
