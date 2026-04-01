import { useState } from 'react'
import { api } from '@/lib/api'

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'teacher1', password: 'teacher123', role: 'Teacher' },
  { username: 'student1', password: 'student123', role: 'Student' },
  { username: 'student2', password: 'student234', role: 'Student' },
]

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(username, password)
      onLogin()
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          ChatBridge
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Demo accounts</p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map(({ username: u, password: p, role }) => (
              <button
                key={u}
                type="button"
                onClick={() => fillCredentials(u, p)}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="font-mono">{u}</span>
                <span className="text-xs text-gray-400">{role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
