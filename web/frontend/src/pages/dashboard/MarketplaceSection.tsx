import { useState, useEffect } from 'react'
import { api, type CatalogApp, type ScreeningQueueEntry } from '@/lib/api'

const TRUST_TIERS = ['new', 'classroom', 'school', 'district', 'verified'] as const

export default function MarketplaceSection() {
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [queue, setQueue] = useState<ScreeningQueueEntry[]>([])
  const [showQueue, setShowQueue] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.fetchMarketplaceCatalog(), api.fetchScreeningQueue()])
      .then(([catalog, screeningQueue]) => {
        setApps(catalog)
        setQueue(screeningQueue)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleTrustChange(appId: string, tier: string) {
    await api.updateTrustTier(appId, tier)
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, trust_tier: tier } : a))
  }

  async function handleClearFlags(appId: string) {
    const result = await api.clearAppFlags(appId)
    setQueue(prev => prev.filter(q => q.app_id !== appId))
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, is_active: result.is_active } : a))
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading marketplace...</p>

  const displayData = showQueue ? apps.filter(a => queue.some(q => q.app_id === a.app_id)) : apps

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-chatbox-tint-primary">Marketplace</h2>
          <p className="text-sm text-chatbox-tint-tertiary">Review submissions, manage trust tiers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              showQueue
                ? 'border-chatbox-tint-brand bg-chatbox-background-brand-secondary text-chatbox-tint-brand'
                : 'border-chatbox-border-primary text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'
            }`}
          >
            Screening Queue ({queue.length})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
        <table className="w-full text-sm">
          <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Developer</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Trust Tier</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chatbox-border-primary">
            {displayData.map(app => {
              const queueEntry = queue.find(q => q.app_id === app.app_id)
              return (
                <tr key={app.app_id} className={queueEntry ? 'bg-red-900/5' : ''}>
                  <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{app.name}</td>
                  <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">{app.developer_name || 'Internal'}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={app.status} active={app.is_active} />
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={app.trust_tier}
                      onChange={e => handleTrustChange(app.app_id, e.target.value)}
                      className="rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-1 text-xs text-chatbox-tint-primary"
                    >
                      {TRUST_TIERS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {queueEntry && (
                      <button
                        onClick={() => handleClearFlags(app.app_id)}
                        className="rounded bg-chatbox-background-secondary px-2 py-1 text-xs font-medium text-chatbox-tint-secondary hover:bg-chatbox-background-secondary-hover transition-colors"
                      >
                        Clear {queueEntry.flag_count} flags
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">suspended</span>
  const colors: Record<string, string> = {
    active: 'bg-green-900/20 text-green-400',
    pending_review: 'bg-yellow-900/20 text-yellow-400',
  }
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[status] || 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'}`}>{status}</span>
}
