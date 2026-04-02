import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface AssignmentPreview {
  title: string
  description: string
  due_date: string | null
  max_points: number | null
}

type View =
  | { type: 'idle' }
  | { type: 'create_preview'; preview: AssignmentPreview; correlationId: string }

export default function GoogleClassroomApp() {
  const [view, setView] = useState<View>({ type: 'idle' })
  const [message, setMessage] = useState('')

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'restore_state': {
          sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
          break
        }

        case 'list_courses': {
          sendToPlatform('tool_result', correlationId, {
            tool: 'list_courses',
            request: { endpoint: '/api/classroom/courses', method: 'GET' },
            message: 'Loading courses...',
          })
          setMessage('Loading courses...')
          break
        }

        case 'list_assignments': {
          const courseId = params?.course_id as string
          sendToPlatform('tool_result', correlationId, {
            tool: 'list_assignments',
            request: { endpoint: `/api/classroom/courses/${courseId}/assignments`, method: 'GET' },
            message: 'Loading assignments...',
          })
          setMessage('Loading assignments...')
          break
        }

        case 'get_assignment': {
          const cId = params?.course_id as string
          const aId = params?.assignment_id as string
          sendToPlatform('tool_result', correlationId, {
            tool: 'get_assignment',
            request: { endpoint: `/api/classroom/courses/${cId}/assignments/${aId}`, method: 'GET' },
            message: 'Loading assignment details...',
          })
          setMessage('Loading assignment details...')
          break
        }

        case 'list_submissions': {
          const csId = params?.course_id as string
          const asId = params?.assignment_id as string
          sendToPlatform('tool_result', correlationId, {
            tool: 'list_submissions',
            request: { endpoint: `/api/classroom/courses/${csId}/assignments/${asId}/submissions`, method: 'GET' },
            message: 'Loading submissions...',
          })
          setMessage('Loading submissions...')
          break
        }

        case 'create_assignment': {
          const preview: AssignmentPreview = {
            title: (params?.title as string) || '',
            description: (params?.description as string) || '',
            due_date: (params?.due_date as string) || null,
            max_points: (params?.max_points as number) || null,
          }
          setView({ type: 'create_preview', preview, correlationId })
          setMessage('Review the assignment below')
          break
        }

        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function handleConfirmCreate() {
    if (view.type !== 'create_preview') return
    sendToPlatform('tool_result', view.correlationId, {
      tool: 'create_assignment',
      confirmed: true,
      ...view.preview,
      request: {
        endpoint: `/api/classroom/courses/PENDING/assignments`,
        method: 'POST',
        body: { ...view.preview, confirmed: true },
      },
    })
    setMessage('Creating assignment...')
    setView({ type: 'idle' })
  }

  function handleCancelCreate() {
    if (view.type !== 'create_preview') return
    sendToPlatform('tool_result', view.correlationId, {
      tool: 'create_assignment',
      confirmed: false,
      message: 'Assignment creation cancelled by teacher',
    })
    setMessage('Assignment creation cancelled')
    setView({ type: 'idle' })
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        Google Classroom
      </div>

      {message && (
        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {view.type === 'create_preview' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Assignment Preview
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            {view.preview.title}
          </div>
          <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
            {view.preview.description}
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            {view.preview.due_date && <span>Due: {view.preview.due_date}</span>}
            {view.preview.max_points && <span>Points: {view.preview.max_points}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleConfirmCreate}
              style={{ padding: '8px 16px', background: '#4285f4', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Create in Google Classroom
            </button>
            <button onClick={handleCancelCreate}
              style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {view.type === 'idle' && !message && (
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '40px 0' }}>
          Ask your tutor about courses, assignments, or submissions
        </div>
      )}
    </div>
  )
}
