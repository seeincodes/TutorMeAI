import { useState, useEffect } from 'react'
import { api, type ClassroomInfo, type ClassroomMember, type BrowseApp } from '@/lib/api'

interface ClassroomWithDetails extends ClassroomInfo {
  members: ClassroomMember[]
  apps: { app_id: string; added_by: string; added_at: string }[]
}

export default function ClassroomsSection() {
  const [classrooms, setClassrooms] = useState<ClassroomWithDetails[]>([])
  const [availableApps, setAvailableApps] = useState<BrowseApp[]>([])
  const [allStudents, setAllStudents] = useState<{ id: string; username: string; display_name: string | null }[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [rooms, apps, teacherData] = await Promise.all([
        api.listClassrooms(),
        api.browseMarketplace(),
        fetch('/api/teacher/dashboard', { credentials: 'include' }).then(r => r.json()),
      ])

      const detailed = await Promise.all(
        rooms.map(async (c) => {
          const [members, whitelistedApps] = await Promise.all([
            api.listClassroomMembers(c.id),
            fetch(`/api/classrooms/${c.id}/apps`, { credentials: 'include' }).then(r => r.json()),
          ])
          return { ...c, members, apps: whitelistedApps }
        })
      )

      setClassrooms(detailed)
      setAvailableApps(apps)
      setAllStudents(teacherData.students || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const created = await api.createClassroom(newName.trim())
    setClassrooms(prev => [...prev, { ...created, members: [], apps: [] }])
    setNewName('')
    setExpandedId(created.id)
  }

  async function handleAddMember(classroomId: string, studentId: string) {
    await api.addClassroomMember(classroomId, studentId)
    setClassrooms(prev => prev.map(c => {
      if (c.id !== classroomId) return c
      const student = allStudents.find(s => s.id === studentId)
      if (!student) return c
      return { ...c, members: [...c.members, { student_id: studentId, username: student.username, display_name: student.display_name }] }
    }))
  }

  async function handleRemoveMember(classroomId: string, studentId: string) {
    await api.removeClassroomMember(classroomId, studentId)
    setClassrooms(prev => prev.map(c => {
      if (c.id !== classroomId) return c
      return { ...c, members: c.members.filter(m => m.student_id !== studentId) }
    }))
  }

  async function handleAddApp(classroomId: string, appId: string) {
    await api.addAppToClassroom(classroomId, appId)
    setClassrooms(prev => prev.map(c => {
      if (c.id !== classroomId) return c
      return { ...c, apps: [...c.apps, { app_id: appId, added_by: '', added_at: new Date().toISOString() }] }
    }))
  }

  async function handleRemoveApp(classroomId: string, appId: string) {
    await api.removeAppFromClassroom(classroomId, appId)
    setClassrooms(prev => prev.map(c => {
      if (c.id !== classroomId) return c
      return { ...c, apps: c.apps.filter(a => a.app_id !== appId) }
    }))
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading classrooms...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Classrooms</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Create classrooms, manage students and app access</p>

      {/* Create classroom */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="New classroom name..."
          className="flex-1 rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="rounded-lg bg-chatbox-background-brand-primary px-4 py-2 text-sm font-medium text-chatbox-tint-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          Create
        </button>
      </div>

      {/* Classrooms list */}
      <div className="space-y-3">
        {classrooms.map(c => {
          const isExpanded = expandedId === c.id
          const memberIds = new Set(c.members.map(m => m.student_id))
          const availableStudents = allStudents.filter(s => !memberIds.has(s.id))
          const whitelistedAppIds = new Set(c.apps.map(a => a.app_id))
          const availableToWhitelist = availableApps.filter(a => !whitelistedAppIds.has(a.app_id))

          return (
            <div key={c.id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-chatbox-tint-primary">{c.name}</h3>
                  <span className="rounded bg-chatbox-background-secondary px-2 py-0.5 text-xs text-chatbox-tint-tertiary">
                    {c.members.length} students
                  </span>
                  <span className="rounded bg-chatbox-background-secondary px-2 py-0.5 text-xs text-chatbox-tint-tertiary">
                    {c.apps.length} apps
                  </span>
                </div>
                <span className="text-xs text-chatbox-tint-tertiary">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-chatbox-border-primary px-4 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Students column */}
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Students</h4>

                      {c.members.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {c.members.map(m => (
                            <div key={m.student_id} className="flex items-center justify-between rounded bg-chatbox-background-secondary px-3 py-1.5">
                              <div>
                                <span className="text-sm text-chatbox-tint-primary">{m.username}</span>
                                {m.display_name && <span className="ml-2 text-xs text-chatbox-tint-tertiary">{m.display_name}</span>}
                              </div>
                              <button
                                onClick={() => handleRemoveMember(c.id, m.student_id)}
                                className="text-xs text-chatbox-tint-error hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {availableStudents.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={e => { if (e.target.value) { handleAddMember(c.id, e.target.value); e.target.value = '' } }}
                          className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-2 py-1.5 text-xs text-chatbox-tint-secondary"
                        >
                          <option value="" disabled>+ Add student...</option>
                          {availableStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.username}{s.display_name ? ` (${s.display_name})` : ''}</option>
                          ))}
                        </select>
                      )}

                      {availableStudents.length === 0 && c.members.length > 0 && (
                        <p className="text-xs text-chatbox-tint-tertiary">All students added</p>
                      )}
                    </div>

                    {/* Apps column */}
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Whitelisted Apps</h4>

                      {c.apps.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {c.apps.map(a => {
                            const appInfo = availableApps.find(ap => ap.app_id === a.app_id)
                            return (
                              <div key={a.app_id} className="flex items-center justify-between rounded bg-chatbox-background-secondary px-3 py-1.5">
                                <span className="text-sm text-chatbox-tint-primary">{appInfo?.name || a.app_id}</span>
                                <button
                                  onClick={() => handleRemoveApp(c.id, a.app_id)}
                                  className="text-xs text-chatbox-tint-error hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {availableToWhitelist.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={e => { if (e.target.value) { handleAddApp(c.id, e.target.value); e.target.value = '' } }}
                          className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-2 py-1.5 text-xs text-chatbox-tint-secondary"
                        >
                          <option value="" disabled>+ Add app...</option>
                          {availableToWhitelist.map(a => (
                            <option key={a.app_id} value={a.app_id}>{a.name}</option>
                          ))}
                        </select>
                      )}

                      {availableToWhitelist.length === 0 && c.apps.length > 0 && (
                        <p className="text-xs text-chatbox-tint-tertiary">All apps added</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {classrooms.length === 0 && (
          <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No classrooms yet. Create one above to get started.</p>
        )}
      </div>
    </div>
  )
}
