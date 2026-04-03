import { useState, useEffect } from 'react'

interface Student {
  id: string
  username: string
  display_name: string | null
  grade: number | null
  allowed_levels: string[]
  conversations: number
}

interface OAuthConnection {
  user_id: string
  app_id: string
}

const ALL_LEVELS = ['K-2', '3-5', '6-8', '9-12']

export default function StudentsSection() {
  const [students, setStudents] = useState<Student[]>([])
  const [oauthConnections, setOauthConnections] = useState<OAuthConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setStudents(data.students)
        setOauthConnections(data.oauth_connections)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function updateStudent(studentId: string, grade?: number, levels?: string[]) {
    const body: Record<string, unknown> = {}
    if (grade !== undefined) body.grade = grade
    if (levels !== undefined) body.allowed_levels = levels
    const res = await fetch(`/api/teacher/students/${studentId}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const result = await res.json()
      setStudents(prev => prev.map(s => s.id === studentId
        ? { ...s, grade: result.grade, allowed_levels: result.allowed_levels }
        : s))
    }
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading students...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Students</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Manage student grades and reading levels</p>

      <div className="space-y-3">
        {students.map(s => {
          const oauthApps = oauthConnections.filter(o => o.user_id === s.id).map(o => o.app_id)

          function toggleLevel(level: string) {
            const current = s.allowed_levels || []
            const updated = current.includes(level)
              ? current.filter(l => l !== level)
              : [...current, level]
            updateStudent(s.id, undefined, updated)
          }

          return (
            <div key={s.id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-medium text-chatbox-tint-primary">{s.username}</span>
                  <span className="ml-2 text-xs text-chatbox-tint-tertiary">{s.display_name || ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-chatbox-tint-tertiary">
                  <span>{s.conversations} chats</span>
                  {oauthApps.map(a => (
                    <span key={a} className="rounded bg-chatbox-background-brand-secondary px-1.5 py-0.5 text-chatbox-tint-brand">{a}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-chatbox-tint-tertiary">Grade:</label>
                  <select
                    value={s.grade || ''}
                    onChange={e => updateStudent(s.id, parseInt(e.target.value) || undefined)}
                    className="rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-1 text-xs text-chatbox-tint-primary"
                  >
                    <option value="">—</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-chatbox-tint-tertiary">Levels:</label>
                  {ALL_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                        (s.allowed_levels || []).includes(level)
                          ? 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand'
                          : 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'
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
        {students.length === 0 && (
          <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No students found</p>
        )}
      </div>
    </div>
  )
}
