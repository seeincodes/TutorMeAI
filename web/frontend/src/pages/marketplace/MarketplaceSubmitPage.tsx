import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export default function MarketplaceSubmitPage() {
  const [form, setForm] = useState({
    app_id: '',
    name: '',
    description: '',
    iframe_url: '',
    tool_schemas_json: '',
    developer_name: '',
    developer_email: '',
    website_url: '',
    privacy_policy_url: '',
    logo_url: '',
    age_rating: 'all',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let tool_schemas: { name: string; description: string; parameters: unknown[] }[]
    try {
      tool_schemas = JSON.parse(form.tool_schemas_json)
      if (!Array.isArray(tool_schemas)) throw new Error('Must be an array')
    } catch {
      setError('Tool schemas must be valid JSON array')
      return
    }

    setSubmitting(true)
    try {
      const result = await api.submitApp({
        app_id: form.app_id,
        name: form.name,
        description: form.description,
        iframe_url: form.iframe_url,
        tool_schemas,
        developer_name: form.developer_name,
        developer_email: form.developer_email,
        website_url: form.website_url || undefined,
        privacy_policy_url: form.privacy_policy_url || undefined,
        logo_url: form.logo_url || undefined,
        age_rating: form.age_rating,
      })
      setSuccess(result.app_id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mb-4 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold text-chatbox-tint-primary">App Submitted for Review</h1>
        <p className="mb-6 text-sm text-chatbox-tint-tertiary">
          Your app <code className="rounded bg-chatbox-background-secondary px-2 py-0.5 text-chatbox-tint-brand">{success}</code> is now pending review.
        </p>
        <Link to="/marketplace" className="text-sm text-chatbox-tint-brand hover:underline">Back to Marketplace</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link to="/marketplace" className="mb-6 inline-block text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
        Back to Marketplace
      </Link>

      <h1 className="mb-1 text-xl font-bold text-chatbox-tint-primary">Submit Your App</h1>
      <p className="mb-6 text-sm text-chatbox-tint-tertiary">Apps are reviewed before appearing in the marketplace.</p>

      {error && <p className="mb-4 rounded bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="App ID *" value={form.app_id} onChange={v => updateField('app_id', v)} placeholder="my-cool-app" />
          <Field label="App Name *" value={form.name} onChange={v => updateField('name', v)} placeholder="My Cool App" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Description *</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Describe what your app does..."
            rows={3}
            required
            className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
          />
        </div>

        <Field label="Iframe URL *" value={form.iframe_url} onChange={v => updateField('iframe_url', v)} placeholder="https://myapp.com/embed" />

        <div>
          <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Tool Schemas (JSON) *</label>
          <textarea
            value={form.tool_schemas_json}
            onChange={e => updateField('tool_schemas_json', e.target.value)}
            placeholder='[{"name": "start_game", "description": "Start the game", "parameters": []}]'
            rows={4}
            required
            className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 font-mono text-xs text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
          />
        </div>

        <div className="border-t border-chatbox-border-primary pt-4">
          <h2 className="mb-3 text-sm font-semibold text-chatbox-tint-primary">Developer Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *" value={form.developer_name} onChange={v => updateField('developer_name', v)} placeholder="Jane Dev" />
            <Field label="Email *" value={form.developer_email} onChange={v => updateField('developer_email', v)} placeholder="jane@example.com" type="email" />
            <Field label="Website" value={form.website_url} onChange={v => updateField('website_url', v)} placeholder="https://jane.dev" required={false} />
            <Field label="Privacy Policy URL" value={form.privacy_policy_url} onChange={v => updateField('privacy_policy_url', v)} placeholder="https://jane.dev/privacy" required={false} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Age Rating</label>
            <select
              value={form.age_rating}
              onChange={e => updateField('age_rating', e.target.value)}
              className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary outline-none"
            >
              <option value="all">All Ages</option>
              <option value="K-2">K-2</option>
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
          <Field label="Logo URL" value={form.logo_url} onChange={v => updateField('logo_url', v)} placeholder="https://..." required={false} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-chatbox-background-brand-primary px-4 py-2.5 text-sm font-medium text-chatbox-tint-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = true }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
      />
    </div>
  )
}
