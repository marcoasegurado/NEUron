import { createContext } from 'react'
import type { AuthUser } from './api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (identifier: string, password: string) => Promise<AuthUser>
  demoLogin: () => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
