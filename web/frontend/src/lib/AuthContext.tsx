import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, type User } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const { user } = await api.me()
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Session timeout: periodically check auth status and auto-logout on expiry
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try {
        await api.me()
      } catch {
        // Token expired — try refresh, then logout if that fails
        try {
          await api.refresh()
        } catch {
          setUser(null)
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [user])

  const login = async (username: string, password: string) => {
    const { user } = await api.login(username, password)
    setUser(user)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  const refresh = async () => {
    await api.refresh()
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
