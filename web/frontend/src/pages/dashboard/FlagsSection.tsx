import { useState, useEffect } from 'react'

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

export default function FlagsSection() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/flags', { credentials: 'include' })
      .then(r => r.json())
      .then(setFlags)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function reviewFlag(flagId: string) {
    const res = await fetch(`/api/teacher/flags/${flagId}/review`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, reviewed: true } : f))
    }
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading flags...</p>

  const unreviewedCount = flags.filter(f => !f.reviewed).length

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-chatbox-tint-primary">Content Flags</h2>
        {unreviewedCount > 0 && (
          <span className="rounded-full bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-400">
            {unreviewedCount} new
          </span>
        )}
      </div>

      {flags.length === 0 ? (
        <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No content flags — all clear</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
          <table className="w-full text-sm">
            <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Student</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Content</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">When</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chatbox-border-primary">
              {flags.map(f => (
                <tr key={f.id} className={f.reviewed ? 'opacity-50' : ''}>
                  <td className="px-4 py-2.5 font-mono text-chatbox-tint-primary">{f.display_name || f.username}</td>
                  <td className="px-4 py-2.5 text-chatbox-tint-secondary">{f.app_id}</td>
                  <td className="px-4 py-2.5 font-medium text-red-400">{f.flagged_content}</td>
                  <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">{f.reason}</td>
                  <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">
                    {f.created_at ? new Date(f.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {f.reviewed ? (
                      <span className="text-xs text-chatbox-tint-tertiary">Reviewed</span>
                    ) : (
                      <button
                        onClick={() => reviewFlag(f.id)}
                        className="rounded bg-chatbox-background-secondary px-2 py-1 text-xs font-medium text-chatbox-tint-secondary hover:bg-chatbox-background-secondary-hover transition-colors"
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
    </div>
  )
}
