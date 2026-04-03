import { useState, useEffect } from 'react'

interface AppData {
  app_id: string
  name: string
  is_active: boolean
  status: string
  usage_count: number
  trust_tier: string
  developer_name: string | null
}

export default function AppsSection() {
  const [apps, setApps] = useState<AppData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setApps(data.apps))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleApp(appId: string) {
    const res = await fetch(`/api/teacher/apps/${appId}`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      const result = await res.json()
      setApps(prev => prev.map(a => a.app_id === appId ? { ...a, is_active: result.is_active } : a))
    }
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading apps...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Apps</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Toggle apps and view usage</p>

      <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
        <table className="w-full text-sm">
          <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Developer</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Trust</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Usage</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chatbox-border-primary">
            {apps.map(app => (
              <tr key={app.app_id}>
                <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{app.name}</td>
                <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">{app.developer_name || 'Internal'}</td>
                <td className="px-4 py-2.5"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-2.5"><TrustBadge tier={app.trust_tier} /></td>
                <td className="px-4 py-2.5 text-right text-xs text-chatbox-tint-tertiary">{app.usage_count}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => toggleApp(app.app_id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      app.is_active
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    {app.is_active ? 'Active' : 'Suspended'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-900/20 text-green-400',
    pending_review: 'bg-yellow-900/20 text-yellow-400',
    suspended: 'bg-red-900/20 text-red-400',
  }
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[status] || 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'}`}>{status}</span>
}

function TrustBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    verified: 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand',
    district: 'bg-blue-900/20 text-blue-400',
    school: 'bg-cyan-900/20 text-cyan-400',
    classroom: 'bg-teal-900/20 text-teal-400',
    new: 'bg-chatbox-background-secondary text-chatbox-tint-tertiary',
  }
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[tier] || 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'}`}>{tier}</span>
}
