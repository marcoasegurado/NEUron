import { useState } from 'react'
import { Input, type InputProps } from '../../components/ui'
import styles from './PasswordInput.module.css'

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Hide password' : 'Show password'

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-label={label}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}
