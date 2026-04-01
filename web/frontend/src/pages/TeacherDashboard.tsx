import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface DashboardData {
  students: { id: string; username: string; display_name: string | null; conversations: number }[]
  apps: { app_id: string; name: string; is_active: boolean; status: string; usage_count: number }[]
  oauth_connections: { user_id: string; app_id: string }[]
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleApp(appId: string) {
    const res = await fetch(`/api/teacher/apps/${appId}`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (res.ok) {
      const result = await res.json()
      setData(prev => prev ? {
        ...prev,
        apps: prev.apps.map(a => a.app_id === appId ? { ...a, is_active: result.is_active } : a),
      } : null)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.display_name || user?.username}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* App Management */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">App Management</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data?.apps.map(app => (
              <div key={app.app_id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{app.name}</div>
                    <div className="text-xs text-gray-400">{app.usage_count} invocations</div>
                  </div>
                  <button
                    onClick={() => toggleApp(app.app_id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      app.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {app.is_active ? 'Active' : 'Suspended'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Students */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Students</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Username</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Conversations</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">OAuth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.students.map(s => {
                  const oauthApps = data.oauth_connections
                    .filter(o => o.user_id === s.id)
                    .map(o => o.app_id)
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2 font-mono text-gray-700">{s.username}</td>
                      <td className="px-4 py-2 text-gray-600">{s.display_name || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{s.conversations}</td>
                      <td className="px-4 py-2">
                        {oauthApps.length > 0 ? (
                          oauthApps.map(a => (
                            <span key={a} className="mr-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">{a}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
