import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db'
import { toETB, fmtETB, fmt } from '../lib/money'
import { currentMonthKey, monthKey } from '../lib/date'
import { Card, Stat, SectionTitle } from '../components/ui'

export function Accounts() {
  const data = useLiveQuery(async () => {
    const settings = await getSettings()
    const [accounts, people, crypto, budget, txs] = await Promise.all([
      db.accounts.toArray(), db.people.toArray(), db.crypto.toArray(),
      db.budget.toArray(), db.transactions.toArray(),
    ])
    const owed = people.filter((p) => p.status === 'Open' && p.direction === 'Owed to me')
      .reduce((s, p) => s + toETB(p.amount, p.currency, settings, p.fxRate), 0)
    const owe = people.filter((p) => p.status === 'Open' && p.direction === 'I owe')
      .reduce((s, p) => s + toETB(p.amount, p.currency, settings, p.fxRate), 0)

    const mk = currentMonthKey()
    const actual: Record<string, number> = {}
    for (const t of txs) {
      if (monthKey(t.date) === mk && t.type === 'Expense')
        actual[t.category] = (actual[t.category] ?? 0) + toETB(t.amount, t.currency, settings, t.fxRate)
    }
    return { settings, accounts, people, crypto, budget, owed, owe, actual }
  }, [])

  if (!data) return <div className="p-6 text-slate-400">Loading…</div>
  const { settings, accounts, people, crypto, budget, owed, owe, actual } = data

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>

      <div className="space-y-2">
        {accounts.map((a) => (
          <Card key={a.id} className="flex justify-between items-center">
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-slate-400">{a.type} · {a.currency}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{a.balance == null ? '—' : fmt(a.balance, a.currency)}</div>
              {a.balance != null && a.currency !== 'ETB' && (
                <div className="text-xs text-slate-400">{fmtETB(toETB(a.balance, a.currency, settings, a.fxRate))}</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>People / IOUs</SectionTitle>
      <Card className="mb-2 flex justify-between">
        <Stat label="Owed to me" value={fmtETB(owed)} />
        <Stat label="I owe" value={fmtETB(owe)} />
        <Stat label="Net" value={fmtETB(owed - owe)} />
      </Card>
      <div className="space-y-2">
        {people.map((p) => (
          <Card key={p.id} className="flex justify-between items-center py-3">
            <div>
              <div className="font-medium">{p.person} <span className={`text-xs ${p.direction === 'I owe' ? 'text-red-500' : 'text-emerald-600'}`}>{p.direction}</span></div>
              <div className="text-xs text-slate-400">{p.status}{p.note ? ` · ${p.note}` : ''}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{fmt(p.amount, p.currency)}</div>
              {p.currency !== 'ETB' && <div className="text-xs text-slate-400">{fmtETB(toETB(p.amount, p.currency, settings, p.fxRate))}</div>}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Crypto</SectionTitle>
      <div className="space-y-2">
        {crypto.map((c) => (
          <Card key={c.id} className="flex justify-between items-center py-3">
            <div>
              <div className="font-medium">{c.coin}</div>
              <div className="text-xs text-slate-400">{c.status}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{c.quantity}</div>
              {c.manualPrice ? <div className="text-xs text-slate-400">{fmtETB(c.manualPrice * c.quantity)}</div> : <div className="text-xs text-slate-300">no price set</div>}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Budget vs actual (this month)</SectionTitle>
      <Card>
        <div className="space-y-3">
          {budget.map((b) => {
            const spent = actual[b.category] ?? 0
            const pct = b.monthlyTarget > 0 ? Math.min(100, Math.round((spent / b.monthlyTarget) * 100)) : 0
            const over = spent > b.monthlyTarget
            return (
              <div key={b.id}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className={over ? 'text-red-500 font-semibold' : 'text-slate-500'}>{fmtETB(spent)} / {fmtETB(b.monthlyTarget)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
