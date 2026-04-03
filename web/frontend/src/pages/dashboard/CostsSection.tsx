import { useState, useEffect } from 'react'
import { api, type CostDashboard } from '@/lib/api'

// GPT-4.1-mini pricing
const INPUT_COST_PER_TOKEN = 0.40 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 1.60 / 1_000_000

function formatCost(tokens: number, costPerToken: number): string {
  const cost = tokens * costPerToken
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`
}

export default function CostsSection() {
  const [data, setData] = useState<CostDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.fetchCostDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading costs...</p>
  if (!data) return <p className="text-chatbox-tint-tertiary">Failed to load cost data</p>

  const totalCost = data.total_input_tokens * INPUT_COST_PER_TOKEN + data.total_output_tokens * OUTPUT_COST_PER_TOKEN

  return (
    <div>
      <h2 className="text-lg font-semibold text-chatbox-tint-primary">Costs</h2>
      <p className="mb-4 text-sm text-chatbox-tint-tertiary">Token usage and estimated costs (GPT-4.1-mini pricing)</p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <SummaryCard label="Total Input Tokens" value={data.total_input_tokens.toLocaleString()} sub={formatCost(data.total_input_tokens, INPUT_COST_PER_TOKEN)} />
        <SummaryCard label="Total Output Tokens" value={data.total_output_tokens.toLocaleString()} sub={formatCost(data.total_output_tokens, OUTPUT_COST_PER_TOKEN)} />
        <SummaryCard label="Estimated Total Cost" value={`$${totalCost.toFixed(4)}`} sub="all time" />
      </div>

      {/* Per-app breakdown */}
      {data.per_app.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
          <table className="w-full text-sm">
            <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Input Tokens</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Output Tokens</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Invocations</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chatbox-border-primary">
              {data.per_app.map(entry => (
                <tr key={entry.app_id}>
                  <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{entry.app_id}</td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-secondary">{entry.input_tokens.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-secondary">{entry.output_tokens.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-tertiary">{entry.invocation_count}</td>
                  <td className="px-4 py-2.5 text-right text-chatbox-tint-secondary">
                    {formatCost(entry.input_tokens, INPUT_COST_PER_TOKEN + entry.output_tokens * OUTPUT_COST_PER_TOKEN / Math.max(entry.input_tokens, 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary p-4">
      <p className="text-xs text-chatbox-tint-tertiary">{label}</p>
      <p className="mt-1 text-xl font-semibold text-chatbox-tint-primary">{value}</p>
      <p className="mt-0.5 text-xs text-chatbox-tint-tertiary">{sub}</p>
    </div>
  )
}
