import { useId } from 'react'
import { cx } from '../../lib/cx'
import { Dropdown, type DropdownOption } from './Dropdown'
import styles from './Select.module.css'

export interface SelectProps {
  label: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  hint?: string
  error?: string
  disabled?: boolean
  id?: string
  className?: string
  /** `pill` hides the visible label and renders the compact switcher shell. */
  variant?: 'field' | 'pill'
}

export function Select({
  label,
  value,
  options,
  onChange,
  hint,
  error,
  disabled,
  id,
  className,
  variant = 'field',
}: SelectProps) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const messageId = `${triggerId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div
      className={cx(
        styles.field,
        variant === 'pill' && styles.pill,
        className,
      )}
    >
      {variant === 'pill' ? null : (
        <label className={styles.label} htmlFor={triggerId}>
          {label}
        </label>
      )}
      <Dropdown
        id={triggerId}
        label={label}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        invalid={Boolean(error)}
        describedBy={hasMessage ? messageId : undefined}
        triggerClassName={variant === 'pill' ? styles.pillTrigger : undefined}
        renderTrigger={
          variant === 'pill'
            ? (selectedLabel) => (
                <span className={styles.pillContent}>
                  <span className={styles.pillLabel}>{selectedLabel}</span>
                  <span className={styles.pillAction} aria-hidden="true">
                    Switch
                  </span>
                </span>
              )
            : undefined
        }
      />
      {hasMessage ? (
        <p
          id={messageId}
          className={cx(styles.message, error && styles.error)}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
}
