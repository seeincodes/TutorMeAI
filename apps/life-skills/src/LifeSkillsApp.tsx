import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

interface ToolResult { tool: string; data: Record<string, unknown> }

export default function LifeSkillsApp() {
  const [lastResult, setLastResult] = useState<ToolResult | null>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  useEffect(() => {
    if (lastResult) {
      sendToPlatform('state_update', '', { type: 'life_skills_result', lastResult })
    }
  }, [lastResult])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg

      switch (tool) {
        case 'restore_state': {
          const saved = params as Record<string, unknown>
          if (saved.lastResult) setLastResult(saved.lastResult as ToolResult)
          sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
          break
        }

        case 'plan_budget': {
          const income = Number(params?.income) || 0
          const expenses = (params?.expenses as Record<string, number>) || {}
          const totalExpenses = Object.values(expenses).reduce((a, b) => a + Number(b), 0)
          const remaining = income - totalExpenses
          const result = {
            tool: 'plan_budget', income, expenses, totalExpenses,
            remaining, savingsRate: income > 0 ? ((remaining / income) * 100).toFixed(1) + '%' : '0%',
            advice: remaining < 0 ? 'You are spending more than you earn!' :
              remaining < income * 0.1 ? 'Try to save at least 10% of your income.' :
              'Great job! You have a healthy budget.',
          }
          setLastResult({ tool, data: result })
          sendToPlatform('tool_result', correlationId, result)
          sendToPlatform('completion', correlationId, { summary: `Budget: $${remaining.toFixed(2)} remaining` })
          break
        }

        case 'calculate_interest': {
          const principal = Number(params?.principal) || 0
          const rate = Number(params?.rate) || 0
          const years = Number(params?.years) || 0
          const compoundsPerYear = Number(params?.compounds_per_year) || 12
          const amount = principal * Math.pow(1 + rate / 100 / compoundsPerYear, compoundsPerYear * years)
          const interest = amount - principal
          const result = {
            tool: 'calculate_interest', principal, rate, years, compoundsPerYear,
            finalAmount: amount.toFixed(2), interestEarned: interest.toFixed(2),
          }
          setLastResult({ tool, data: result })
          sendToPlatform('tool_result', correlationId, result)
          sendToPlatform('completion', correlationId, { summary: `$${principal} → $${amount.toFixed(2)} after ${years} years` })
          break
        }

        case 'decision_matrix': {
          const options = (params?.options as string[]) || []
          const criteria = (params?.criteria as string[]) || []
          const weights = (params?.weights as number[]) || criteria.map(() => 1)
          const scores = (params?.scores as number[][]) || options.map(() => criteria.map(() => 5))
          const weighted = options.map((opt, i) => ({
            option: opt,
            score: scores[i]?.reduce((sum, s, j) => sum + s * (weights[j] || 1), 0) || 0,
          }))
          weighted.sort((a, b) => b.score - a.score)
          const result = { tool: 'decision_matrix', rankings: weighted, bestOption: weighted[0]?.option }
          setLastResult({ tool, data: result })
          sendToPlatform('tool_result', correlationId, result)
          sendToPlatform('completion', correlationId, { summary: `Best option: ${weighted[0]?.option}` })
          break
        }

        case 'plan_meals': {
          const days = Number(params?.days) || 7
          const dietary = (params?.dietary as string) || 'none'
          const meals = Array.from({ length: days }, (_, i) => ({
            day: `Day ${i + 1}`,
            breakfast: 'Oatmeal with fruit',
            lunch: 'Grilled chicken salad',
            dinner: 'Pasta with vegetables',
            snack: 'Apple slices with peanut butter',
          }))
          const result = { tool: 'plan_meals', days, dietary, meals }
          setLastResult({ tool, data: result })
          sendToPlatform('tool_result', correlationId, result)
          sendToPlatform('completion', correlationId, { summary: `${days}-day meal plan created` })
          break
        }

        case 'optimize_schedule': {
          const tasks = (params?.tasks as { name: string; duration: number; priority: number }[]) || []
          const sorted = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0))
          let currentTime = 8 * 60 // 8:00 AM in minutes
          const schedule = sorted.map(t => {
            const start = `${Math.floor(currentTime / 60)}:${String(currentTime % 60).padStart(2, '0')}`
            currentTime += (t.duration || 30)
            const end = `${Math.floor(currentTime / 60)}:${String(currentTime % 60).padStart(2, '0')}`
            currentTime += 10 // 10 min break
            return { task: t.name, start, end, duration: t.duration, priority: t.priority }
          })
          const result = { tool: 'optimize_schedule', schedule, totalHours: ((currentTime - 8 * 60) / 60).toFixed(1) }
          setLastResult({ tool, data: result })
          sendToPlatform('tool_result', correlationId, result)
          sendToPlatform('completion', correlationId, { summary: `Schedule optimized: ${schedule.length} tasks` })
          break
        }

        default:
          sendToPlatform('error', correlationId, { message: `Unknown tool: ${tool}` })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ maxWidth: '500px', width: '100%' }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>Life Skills Toolkit</div>
      {lastResult ? (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            {lastResult.tool.replace('_', ' ')}
          </div>
          <pre style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(lastResult.data, null, 2)}
          </pre>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Budget planner, compound interest, decision matrix, meal planner, schedule optimizer
        </div>
      )}
    </div>
  )
}
