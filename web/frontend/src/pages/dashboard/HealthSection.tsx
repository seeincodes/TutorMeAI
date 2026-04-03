import { useState, useEffect, useRef } from 'react'
import { api, type AppHealthEntry } from '@/lib/api'

export default function HealthSection() {
  const [entries, setEntries] = useState<AppHealthEntry[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  function fetchData() {
    api.fetchAppHealth()
      .then(data => {
        setEntries(data.sort((a, b) => b.invocation_count - a.invocation_count))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading health metrics...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">App Health</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Per-app metrics — auto-refreshes every 30s</p>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No invocation data yet</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
          <table className="w-full text-sm">
            <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Invocations</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Success</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Errors</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Timeouts</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chatbox-border-primary">
              {entries.map(e => (
                <tr key={e.app_id}>
                  <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{e.app_id}</td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-secondary">{e.invocation_count}</td>
                  <td className="px-4 py-2.5 text-right text-green-400">{e.success_count}</td>
                  <td className={`px-4 py-2.5 text-right ${e.error_count > 0 ? 'text-red-400 font-medium' : 'text-chatbox-tint-tertiary'}`}>
                    {e.error_count}
                  </td>
                  <td className={`px-4 py-2.5 text-right ${e.timeout_count > 0 ? 'text-red-400 font-medium' : 'text-chatbox-tint-tertiary'}`}>
                    {e.timeout_count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-tertiary">
                    {e.avg_duration_ms != null ? `${Math.round(e.avg_duration_ms)}ms` : '—'}
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
