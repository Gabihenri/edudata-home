'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type AuthUser = {
  id: string
  email?: string
  name?: string
  metadata?: Record<string, unknown>
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refreshSession: () => Promise<void>
}

type SessionResponse = {
  success: boolean
  authenticated: boolean
  user: AuthUser | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshSession(): Promise<void> {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const result = (await response.json()) as SessionResponse

      setUser(
        result.success && result.authenticated
          ? result.user
          : null,
      )
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro de AuthProvider.',
    )
  }

  return context
}