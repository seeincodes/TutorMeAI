import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { api, type AppDetail, type ClassroomInfo } from '@/lib/api'

const TRUST_COLORS: Record<string, string> = {
  verified: 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand',
  district: 'bg-blue-900/20 text-blue-400',
  school: 'bg-cyan-900/20 text-cyan-400',
  classroom: 'bg-teal-900/20 text-teal-400',
  new: 'bg-chatbox-background-secondary text-chatbox-tint-tertiary',
}

export default function MarketplaceDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const { user } = useAuth()
  const [app, setApp] = useState<AppDetail | null>(null)
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'district_admin'

  useEffect(() => {
    if (!appId) return
    const promises: Promise<unknown>[] = [
      api.fetchAppDetail(appId).then(setApp).catch(() => setError('App not found')),
    ]
    if (isTeacher) {
      promises.push(api.listClassrooms().then(setClassrooms).catch(() => {}))
    }
    Promise.all(promises).finally(() => setLoading(false))
  }, [appId, isTeacher])

  async function handleAddToClassroom(classroomId: string) {
    if (!appId) return
    await api.addAppToClassroom(classroomId, appId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-chatbox-tint-tertiary">Loading...</div>
  if (error || !app) return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to="/marketplace" className="text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary">Back to Marketplace</Link>
      <p className="mt-4 text-chatbox-tint-error">{error || 'App not found'}</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/marketplace" className="mb-6 inline-block text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
        Back to Marketplace
      </Link>

      <div className="flex gap-8">
        {/* Left column: app info */}
        <div className="flex-[2]">
          <div className="mb-4 flex items-center gap-4">
            {app.logo_url ? (
              <img src={app.logo_url} alt="" className="h-16 w-16 rounded-xl" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-chatbox-background-secondary text-2xl font-bold text-chatbox-tint-tertiary">
                {app.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-chatbox-tint-primary">{app.name}</h1>
              <span className={`rounded px-2 py-0.5 text-xs ${TRUST_COLORS[app.trust_tier] || TRUST_COLORS.new}`}>
                {app.trust_tier}
              </span>
            </div>
          </div>

          <p className="mb-6 text-sm text-chatbox-tint-secondary leading-relaxed">{app.description}</p>

          <h2 className="mb-3 text-sm font-semibold text-chatbox-tint-primary">Available Tools</h2>
          <div className="space-y-2">
            {app.tool_schemas.map(tool => (
              <div key={tool.name} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-4 py-3">
                <code className="text-xs font-medium text-chatbox-tint-brand">{tool.name}</code>
                <p className="mt-1 text-xs text-chatbox-tint-tertiary">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: metadata sidebar */}
        <div className="flex-1">
          <div className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Details</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-chatbox-tint-tertiary">Age Rating</span>
                <p className="font-medium text-chatbox-tint-primary">{app.age_rating}</p>
              </div>
              <div>
                <span className="text-chatbox-tint-tertiary">Auth Type</span>
                <p className="font-medium text-chatbox-tint-primary">{app.auth_type}</p>
              </div>
              {app.developer_name && (
                <div>
                  <span className="text-chatbox-tint-tertiary">Developer</span>
                  <p className="font-medium text-chatbox-tint-primary">{app.developer_name}</p>
                </div>
              )}
              {app.privacy_policy_url && (
                <a href={app.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="block text-chatbox-tint-brand hover:underline">
                  Privacy Policy
                </a>
              )}
              {app.website_url && (
                <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="block text-chatbox-tint-brand hover:underline">
                  Website
                </a>
              )}
            </div>

            {isTeacher && classrooms.length > 0 && (
              <div className="mt-4 border-t border-chatbox-border-primary pt-4">
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleAddToClassroom(e.target.value); e.target.value = '' }}
                  className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-2 text-xs text-chatbox-tint-secondary"
                >
                  <option value="" disabled>+ Add to Classroom...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
