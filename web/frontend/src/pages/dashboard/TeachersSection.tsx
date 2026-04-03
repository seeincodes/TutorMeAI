import { useState, useEffect } from 'react'

interface Teacher {
  id: string
  username: string
  display_name: string | null
}

export default function TeachersSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTeachers(data.teachers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading teachers...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Teachers</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Teachers in your district</p>

      {teachers.length === 0 ? (
        <p className="py-8 text-center text-sm text-chatbox-tint-tertiary">No teachers found</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
          <table className="w-full text-sm">
            <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Username</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Display Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chatbox-border-primary">
              {teachers.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5 font-mono text-sm text-chatbox-tint-primary">{t.username}</td>
                  <td className="px-4 py-2.5 text-chatbox-tint-secondary">{t.display_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
