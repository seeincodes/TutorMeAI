import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface DashboardData {
  students: { id: string; username: string; display_name: string | null; conversations: number }[]
  apps: { app_id: string; name: string; is_active: boolean; status: string; usage_count: number }[]
  oauth_connections: { user_id: string; app_id: string }[]
}

interface Flag {
  id: string
  username: string
  display_name: string | null
  app_id: string
  flagged_content: string
  reason: string
  reviewed: boolean
  created_at: string | null
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/dashboard', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/teacher/flags', { credentials: 'include' }).then(r => r.json()),
    ]).then(([dashData, flagData]) => {
      setData(dashData)
      setFlags(flagData)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function reviewFlag(flagId: string) {
    const res = await fetch(`/api/teacher/flags/${flagId}/review`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, reviewed: true } : f))
    }
  }

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

        {/* Content Flags */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">
            Content Flags
            {flags.filter(f => !f.reviewed).length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {flags.filter(f => !f.reviewed).length} new
              </span>
            )}
          </h2>
          {flags.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              No content flags — all clear
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Student</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">App</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Searched</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Reason</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">When</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {flags.map(f => (
                    <tr key={f.id} className={f.reviewed ? 'opacity-50' : ''}>
                      <td className="px-4 py-2 font-mono text-gray-700">{f.display_name || f.username}</td>
                      <td className="px-4 py-2 text-gray-600">{f.app_id}</td>
                      <td className="px-4 py-2 font-medium text-red-600">{f.flagged_content}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{f.reason}</td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {f.created_at ? new Date(f.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {f.reviewed ? (
                          <span className="text-xs text-gray-400">Reviewed</span>
                        ) : (
                          <button
                            onClick={() => reviewFlag(f.id)}
                            className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                          >
                            Mark reviewed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
