import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin', icon: '🛡️' },
  { username: 'teacher1', password: 'teacher123', role: 'Teacher', icon: '👩‍🏫' },
  { username: 'emma_k', password: 'demo123', role: 'Kindergarten', icon: '🌱' },
  { username: 'liam_3', password: 'demo123', role: 'Grade 3', icon: '⭐' },
  { username: 'sofia_6', password: 'demo123', role: 'Grade 6', icon: '🔥' },
  { username: 'noah_9', password: 'demo123', role: 'Grade 9', icon: '👑' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function fillCredentials(u: string, p: string) {
    setUsername(u)
    setPassword(p)
    setError('')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-chatbox-background-secondary px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-chatbox-background-brand-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-chatbox-tint-primary">ChatBridge</h1>
          <p className="mt-1 text-sm text-chatbox-tint-tertiary">Sign in to continue</p>
        </div>

        {/* Login form */}
        <div className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-chatbox-tint-secondary">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="mt-1 block w-full rounded-md border border-chatbox-border-primary bg-chatbox-background-primary px-3 py-2 text-sm text-chatbox-tint-primary placeholder:text-chatbox-tint-placeholder focus:border-chatbox-border-brand focus:outline-none focus:ring-1 focus:ring-chatbox-border-brand"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-chatbox-tint-secondary">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="block w-full rounded-md border border-chatbox-border-primary bg-chatbox-background-primary px-3 py-2 pr-10 text-sm text-chatbox-tint-primary placeholder:text-chatbox-tint-placeholder focus:border-chatbox-border-brand focus:outline-none focus:ring-1 focus:ring-chatbox-border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-chatbox-background-error-secondary px-3 py-2">
                <p className="text-sm text-chatbox-tint-error" role="alert">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-chatbox-background-brand-primary px-4 py-2.5 text-sm font-medium text-chatbox-tint-white hover:bg-chatbox-background-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-chatbox-border-brand focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Demo accounts</p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map(({ username: u, password: p, role, icon }) => (
              <button
                key={u}
                type="button"
                onClick={() => fillCredentials(u, p)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-chatbox-background-secondary"
              >
                <span className="text-base">{icon}</span>
                <span className="flex-1 font-medium text-chatbox-tint-primary">{u}</span>
                <span className="rounded bg-chatbox-background-secondary px-1.5 py-0.5 text-[11px] font-medium text-chatbox-tint-tertiary">{role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
