import { useState, useEffect } from 'react'
import { api, type District } from '@/lib/api'

export default function DistrictsSection() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.fetchDistricts()
      .then(setDistricts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading districts...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Districts</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Manage district app approvals</p>

      {districts.length === 0 ? (
        <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No districts configured</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
          <table className="w-full text-sm">
            <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">State</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chatbox-border-primary">
              {districts.map(d => (
                <tr key={d.id}>
                  <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{d.name}</td>
                  <td className="px-4 py-2.5 text-chatbox-tint-secondary">{d.state || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-chatbox-tint-tertiary">{d.id.slice(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
