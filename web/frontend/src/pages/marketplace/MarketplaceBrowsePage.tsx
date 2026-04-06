import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { api, type BrowseApp, type ClassroomInfo } from '@/lib/api'

const TRUST_COLORS: Record<string, string> = {
  verified: 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand',
  district: 'bg-blue-900/20 text-blue-400',
  school: 'bg-cyan-900/20 text-cyan-400',
  classroom: 'bg-teal-900/20 text-teal-400',
  new: 'bg-chatbox-background-secondary text-chatbox-tint-tertiary',
}

export default function MarketplaceBrowsePage() {
  const { user } = useAuth()
  const [apps, setApps] = useState<BrowseApp[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'district_admin'

  useEffect(() => {
    const promises: Promise<unknown>[] = [api.browseMarketplace().then(setApps)]
    if (isTeacher) {
      promises.push(api.listClassrooms().then(setClassrooms))
    }
    Promise.all(promises)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isTeacher])

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddToClassroom(appId: string, classroomId: string) {
    await api.addAppToClassroom(classroomId, appId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-chatbox-tint-tertiary">Loading marketplace...</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-chatbox-tint-primary">Marketplace</h1>
          <p className="text-sm text-chatbox-tint-tertiary">Discover educational apps</p>
        </div>
        <Link to="/" className="text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
          Back to Chat
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search apps..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6 w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-4 py-2.5 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(app => (
          <div key={app.app_id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-4 transition-colors hover:border-chatbox-tint-brand/30">
            <Link to={`/marketplace/${app.app_id}`} className="block">
              <div className="mb-2 flex items-center gap-3">
                {app.logo_url ? (
                  <img src={app.logo_url} alt="" className="h-10 w-10 rounded-lg" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chatbox-background-secondary text-lg">
                    {app.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-chatbox-tint-primary">{app.name}</h3>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${TRUST_COLORS[app.trust_tier] || TRUST_COLORS.new}`}>
                    {app.trust_tier}
                  </span>
                </div>
              </div>
              <p className="text-xs text-chatbox-tint-tertiary line-clamp-2">{app.description}</p>
            </Link>

            {isTeacher && classrooms.length > 0 && (
              <div className="mt-3 border-t border-chatbox-border-primary pt-3">
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleAddToClassroom(app.app_id, e.target.value); e.target.value = '' }}
                  className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-2 py-1.5 text-xs text-chatbox-tint-secondary"
                >
                  <option value="" disabled>+ Add to Classroom...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-chatbox-tint-tertiary">
          {apps.length === 0 ? 'No apps available yet.' : 'No apps match your search.'}
        </p>
      )}
    </div>
  )
}
