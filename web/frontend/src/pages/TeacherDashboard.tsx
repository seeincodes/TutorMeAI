import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface DashboardData {
  students: { id: string; username: string; display_name: string | null; grade: number | null; allowed_levels: string[]; conversations: number }[]
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
          <div className="space-y-3">
            {data?.students.map(s => {
              const oauthApps = data.oauth_connections.filter(o => o.user_id === s.id).map(o => o.app_id)
              const ALL_LEVELS = ['K-2', '3-5', '6-8', '9-12']

              async function updateStudent(grade?: number, levels?: string[]) {
                const body: Record<string, unknown> = {}
                if (grade !== undefined) body.grade = grade
                if (levels !== undefined) body.allowed_levels = levels
                const res = await fetch(`/api/teacher/students/${s.id}`, {
                  method: 'PATCH', credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                })
                if (res.ok) {
                  const result = await res.json()
                  setData(prev => prev ? {
                    ...prev,
                    students: prev.students.map(st => st.id === s.id
                      ? { ...st, grade: result.grade, allowed_levels: result.allowed_levels }
                      : st),
                  } : null)
                }
              }

              function toggleLevel(level: string) {
                const current = s.allowed_levels || []
                const updated = current.includes(level)
                  ? current.filter(l => l !== level)
                  : [...current, level]
                updateStudent(undefined, updated)
              }

              return (
                <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-sm font-medium text-gray-700">{s.username}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.display_name || ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{s.conversations} chats</span>
                      {oauthApps.map(a => (
                        <span key={a} className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-500">Grade:</label>
                      <select
                        value={s.grade || ''}
                        onChange={e => updateStudent(parseInt(e.target.value) || undefined)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">—</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-500">Reading levels:</label>
                      {ALL_LEVELS.map(level => (
                        <button
                          key={level}
                          onClick={() => toggleLevel(level)}
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            (s.allowed_levels || []).includes(level)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
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
