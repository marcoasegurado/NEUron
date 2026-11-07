import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  type AuthUser,
} from './api'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    fetchCurrentUser()
      .then((current) => {
        if (!active) {
          return
        }
        setUser(current)
        setStatus(current ? 'authenticated' : 'anonymous')
      })
      .catch(() => {
        if (!active) {
          return
        }
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const current = await fetchCurrentUser()
      setUser(current)
      setStatus(current ? 'authenticated' : 'anonymous')
    } catch {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const current = await loginRequest(identifier, password)
    setUser(current)
    setStatus('authenticated')
    return current
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Clear the local session even if the network request fails.
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value: AuthContextValue = useMemo(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
