import { useState, useEffect } from 'react'
import { api, type CatalogApp, type ScreeningQueueEntry, type ReviewQueueApp } from '@/lib/api'

const TRUST_TIERS = ['new', 'classroom', 'school', 'district', 'verified'] as const

type Tab = 'catalog' | 'review' | 'screening'

export default function MarketplaceSection() {
  const [tab, setTab] = useState<Tab>('catalog')
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueApp[]>([])
  const [screeningQueue, setScreeningQueue] = useState<ScreeningQueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.fetchMarketplaceCatalog(),
      api.fetchReviewQueue(),
      api.fetchScreeningQueue(),
    ])
      .then(([catalog, review, screening]) => {
        setApps(catalog)
        setReviewQueue(review)
        setScreeningQueue(screening)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleTrustChange(appId: string, tier: string) {
    await api.updateTrustTier(appId, tier)
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, trust_tier: tier } : a))
  }

  async function handleReview(appId: string, action: string, note?: string) {
    const result = await api.reviewApp(appId, action, note)
    setReviewQueue(prev => prev.filter(a => a.app_id !== appId))
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, status: result.status, is_active: result.is_active } : a))
  }

  async function handleClearFlags(appId: string) {
    const result = await api.clearAppFlags(appId)
    setScreeningQueue(prev => prev.filter(q => q.app_id !== appId))
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, is_active: result.is_active } : a))
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading marketplace...</p>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-chatbox-tint-primary">Marketplace</h2>
          <p className="text-sm text-chatbox-tint-tertiary">Manage apps, review submissions, handle flags</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {([
          ['catalog', 'All Apps', apps.length],
          ['review', 'Review Queue', reviewQueue.length],
          ['screening', 'Screening Queue', screeningQueue.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? 'border-chatbox-tint-brand bg-chatbox-background-brand-secondary text-chatbox-tint-brand'
                : 'border-chatbox-border-primary text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Pipeline indicator */}
      {tab === 'review' && (
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="rounded bg-green-900/20 px-2 py-1 text-green-400">1. Submitted</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-green-900/20 px-2 py-1 text-green-400">2. Auto-screened</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-yellow-900/20 px-2 py-1 text-yellow-400 font-semibold">3. Manual Review</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-chatbox-background-secondary px-2 py-1 text-chatbox-tint-tertiary">4. Active</span>
        </div>
      )}

      {tab === 'catalog' && <CatalogTable apps={apps} onTrustChange={handleTrustChange} />}
      {tab === 'review' && <ReviewQueue queue={reviewQueue} onReview={handleReview} />}
      {tab === 'screening' && <ScreeningTable queue={screeningQueue} onClearFlags={handleClearFlags} />}
    </div>
  )
}

function CatalogTable({ apps, onTrustChange }: { apps: CatalogApp[]; onTrustChange: (id: string, tier: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
      <table className="w-full text-sm">
        <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Developer</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Trust Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chatbox-border-primary">
          {apps.map(app => (
            <tr key={app.app_id}>
              <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{app.name}</td>
              <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">{app.developer_name || 'Internal'}</td>
              <td className="px-4 py-2.5"><StatusBadge status={app.status} active={app.is_active} /></td>
              <td className="px-4 py-2.5">
                <select
                  value={app.trust_tier}
                  onChange={e => onTrustChange(app.app_id, e.target.value)}
                  className="rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-1 text-xs text-chatbox-tint-primary"
                >
                  {TRUST_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReviewQueue({ queue, onReview }: { queue: ReviewQueueApp[]; onReview: (id: string, action: string, note?: string) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  if (queue.length === 0) return <p className="text-sm text-chatbox-tint-tertiary">No apps pending review.</p>

  return (
    <div className="space-y-4">
      {queue.map(app => (
        <div key={app.app_id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-4 border-l-4 border-l-yellow-500">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="font-medium text-chatbox-tint-primary">{app.name}</h3>
              <p className="text-xs text-chatbox-tint-tertiary">by {app.developer_name || 'Unknown'} · {app.developer_email} · {app.tool_count} tools</p>
            </div>
            <span className="rounded bg-yellow-900/20 px-2 py-0.5 text-xs text-yellow-400">{app.status}</span>
          </div>
          <p className="mb-3 text-xs text-chatbox-tint-secondary">{app.description}</p>

          {app.screening_results.length > 0 && (
            <div className="mb-3 flex gap-2">
              {app.screening_results.map((sr, i) => (
                <span key={i} className={`rounded px-2 py-0.5 text-xs ${sr.flagged ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                  {sr.flagged ? '✗' : '✓'} {sr.screen_type}
                </span>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Review note (optional)"
            value={notes[app.app_id] || ''}
            onChange={e => setNotes(prev => ({ ...prev, [app.app_id]: e.target.value }))}
            className="mb-3 w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-1.5 text-xs text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none"
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => onReview(app.app_id, 'reject', notes[app.app_id])} className="rounded bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors">Reject</button>
            <button onClick={() => onReview(app.app_id, 'request_changes', notes[app.app_id])} className="rounded bg-yellow-900/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-900/30 transition-colors">Request Changes</button>
            <button onClick={() => onReview(app.app_id, 'approve')} className="rounded bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/30 transition-colors">Approve</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScreeningTable({ queue, onClearFlags }: { queue: ScreeningQueueEntry[]; onClearFlags: (id: string) => void }) {
  if (queue.length === 0) return <p className="text-sm text-chatbox-tint-tertiary">No flagged apps.</p>

  return (
    <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
      <table className="w-full text-sm">
        <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Flags</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chatbox-border-primary">
          {queue.map(q => (
            <tr key={q.app_id}>
              <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{q.name}</td>
              <td className="px-4 py-2.5 text-xs text-red-400">{q.flag_count} / {q.auto_suspend_threshold}</td>
              <td className="px-4 py-2.5">
                <span className={`rounded px-2 py-0.5 text-xs ${q.is_active ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {q.is_active ? 'active' : 'suspended'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <button onClick={() => onClearFlags(q.app_id)} className="rounded bg-chatbox-background-secondary px-2 py-1 text-xs font-medium text-chatbox-tint-secondary hover:bg-chatbox-background-secondary-hover transition-colors">
                  Clear flags
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">suspended</span>
  const colors: Record<string, string> = {
    active: 'bg-green-900/20 text-green-400',
    pending_review: 'bg-yellow-900/20 text-yellow-400',
    rejected: 'bg-red-900/20 text-red-400',
    changes_requested: 'bg-orange-900/20 text-orange-400',
  }
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[status] || 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'}`}>{status}</span>
}
