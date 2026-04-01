import { useState, useEffect } from 'react'

function sendToPlatform(type: string, correlationId: string, data: Record<string, unknown>) {
  window.parent.postMessage({ type, correlationId, data }, '*')
}

type Tool = 'budget' | 'interest' | 'schedule' | null

export default function LifeSkillsApp() {
  const [activeTool, setActiveTool] = useState<Tool>(null)
  // Budget
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState([{ name: 'Rent', amount: '' }, { name: 'Food', amount: '' }, { name: 'Transport', amount: '' }])
  const [budgetResult, setBudgetResult] = useState<{ remaining: number; rate: string; advice: string } | null>(null)
  // Interest
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [years, setYears] = useState('')
  const [interestResult, setInterestResult] = useState<{ final: string; earned: string } | null>(null)
  // Schedule
  const [tasks, setTasks] = useState([{ name: '', duration: '30', priority: '5' }])
  const [scheduleResult, setScheduleResult] = useState<{ task: string; start: string; end: string }[] | null>(null)

  useEffect(() => { sendToPlatform('ui_ready', '', {}) }, [])

  // Handle tool invocations from platform
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'tool_invoke') return
      const { correlationId, tool, params } = msg
      if (tool === 'restore_state') {
        const saved = params as Record<string, unknown>
        if (saved.activeTool) setActiveTool(saved.activeTool as Tool)
        sendToPlatform('tool_result', correlationId, { tool: 'restore_state', message: 'Restored' })
      } else {
        sendToPlatform('tool_result', correlationId, { tool, message: 'Use the interactive UI' })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function saveState(tool: Tool) {
    sendToPlatform('state_update', '', { type: 'life_skills', activeTool: tool })
  }

  function calcBudget(e: React.FormEvent) {
    e.preventDefault()
    const inc = parseFloat(income) || 0
    const totalExp = expenses.reduce((s, ex) => s + (parseFloat(ex.amount) || 0), 0)
    const remaining = inc - totalExp
    const rateVal = inc > 0 ? ((remaining / inc) * 100).toFixed(1) : '0'
    const advice = remaining < 0 ? 'You are spending more than you earn!' : remaining < inc * 0.1 ? 'Try to save at least 10% of your income.' : 'Great job! Healthy budget.'
    setBudgetResult({ remaining, rate: rateVal + '%', advice })
    saveState('budget')
  }

  function calcInterest(e: React.FormEvent) {
    e.preventDefault()
    const p = parseFloat(principal) || 0
    const r = parseFloat(rate) || 0
    const y = parseFloat(years) || 0
    const amount = p * Math.pow(1 + r / 100 / 12, 12 * y)
    setInterestResult({ final: amount.toFixed(2), earned: (amount - p).toFixed(2) })
    saveState('interest')
  }

  function calcSchedule(e: React.FormEvent) {
    e.preventDefault()
    const sorted = [...tasks].filter(t => t.name.trim()).sort((a, b) => (parseInt(b.priority) || 0) - (parseInt(a.priority) || 0))
    let time = 8 * 60
    const sched = sorted.map(t => {
      const dur = parseInt(t.duration) || 30
      const start = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
      time += dur
      const end = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
      time += 10
      return { task: t.name, start, end }
    })
    setScheduleResult(sched)
    saveState('schedule')
  }

  const btn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '14px 8px', borderRadius: '10px', border: `2px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
    background: active ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: 600,
    color: active ? '#1d4ed8' : '#374151',
  })
  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }
  const label: React.CSSProperties = { fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }
  const submitBtn: React.CSSProperties = { width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600, marginTop: '12px' }

  return (
    <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>Life Skills Toolkit</div>
      <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>Learn practical skills for everyday life</div>

      {/* Tool selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button style={btn(activeTool === 'budget')} onClick={() => { setActiveTool('budget'); setBudgetResult(null) }}>💰<br/>Budget</button>
        <button style={btn(activeTool === 'interest')} onClick={() => { setActiveTool('interest'); setInterestResult(null) }}>📈<br/>Interest</button>
        <button style={btn(activeTool === 'schedule')} onClick={() => { setActiveTool('schedule'); setScheduleResult(null) }}>📅<br/>Schedule</button>
      </div>

      {/* Budget Planner */}
      {activeTool === 'budget' && (
        <form onSubmit={calcBudget}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Budget Planner</div>
          <div style={{ marginBottom: '10px' }}>
            <label style={label}>Monthly Income ($)</label>
            <input type="number" style={input} value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 2000" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Expenses</div>
          {expenses.map((ex, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <input style={{ ...input, flex: 2 }} value={ex.name} onChange={e => { const u = [...expenses]; u[i].name = e.target.value; setExpenses(u) }} placeholder="Category" />
              <input type="number" style={{ ...input, flex: 1 }} value={ex.amount} onChange={e => { const u = [...expenses]; u[i].amount = e.target.value; setExpenses(u) }} placeholder="$" />
              {expenses.length > 1 && (
                <button type="button" onClick={() => setExpenses(expenses.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setExpenses([...expenses, { name: '', amount: '' }])} style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>+ Add expense</button>
          <button type="submit" style={submitBtn}>Calculate Budget</button>
          {budgetResult && (
            <div style={{ marginTop: '12px', padding: '14px', borderRadius: '8px', background: budgetResult.remaining >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${budgetResult.remaining >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: budgetResult.remaining >= 0 ? '#166534' : '#991b1b' }}>${budgetResult.remaining.toFixed(2)} remaining</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Savings rate: {budgetResult.rate}</div>
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px', fontWeight: 500 }}>{budgetResult.advice}</div>
            </div>
          )}
        </form>
      )}

      {/* Compound Interest Calculator */}
      {activeTool === 'interest' && (
        <form onSubmit={calcInterest}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Compound Interest Calculator</div>
          <div style={{ marginBottom: '10px' }}>
            <label style={label}>Starting Amount ($)</label>
            <input type="number" style={input} value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="e.g. 1000" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={label}>Annual Interest Rate (%)</label>
            <input type="number" step="0.1" style={input} value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 5" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={label}>Number of Years</label>
            <input type="number" style={input} value={years} onChange={e => setYears(e.target.value)} placeholder="e.g. 10" />
          </div>
          <button type="submit" style={submitBtn}>Calculate</button>
          {interestResult && (
            <div style={{ marginTop: '12px', padding: '14px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>${interestResult.final}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Interest earned: ${interestResult.earned}</div>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '6px' }}>
                ${principal || '0'} → ${interestResult.final} over {years || '0'} years at {rate || '0'}% compounded monthly
              </div>
            </div>
          )}
        </form>
      )}

      {/* Schedule Optimizer */}
      {activeTool === 'schedule' && (
        <form onSubmit={calcSchedule}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Daily Schedule Optimizer</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>Add tasks with duration and priority (1-10). Higher priority tasks are scheduled first.</div>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
              <input style={{ ...input, flex: 3 }} value={t.name} onChange={e => { const u = [...tasks]; u[i].name = e.target.value; setTasks(u) }} placeholder="Task name" />
              <input type="number" style={{ ...input, flex: 1 }} value={t.duration} onChange={e => { const u = [...tasks]; u[i].duration = e.target.value; setTasks(u) }} placeholder="Min" />
              <input type="number" style={{ ...input, flex: 1 }} value={t.priority} onChange={e => { const u = [...tasks]; u[i].priority = e.target.value; setTasks(u) }} placeholder="1-10" min="1" max="10" />
              {tasks.length > 1 && <button type="button" onClick={() => setTasks(tasks.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>×</button>}
            </div>
          ))}
          <button type="button" onClick={() => setTasks([...tasks, { name: '', duration: '30', priority: '5' }])} style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>+ Add task</button>
          <button type="submit" style={submitBtn}>Optimize Schedule</button>
          {scheduleResult && (
            <div style={{ marginTop: '12px' }}>
              {scheduleResult.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '4px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.start}–{s.end}</div>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{s.task}</div>
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      {/* Landing state */}
      {!activeTool && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
          Choose a tool above to get started
        </div>
      )}
    </div>
  )
}
