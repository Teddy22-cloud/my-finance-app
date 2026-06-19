import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { db, getSettings } from '../db'
import type { Transaction } from '../types'
import { toETB, fmtETB, fmt } from '../lib/money'
import { currentMonthKey, monthKey, monthLabel } from '../lib/date'
import { projectPayoff, fmtMonthYear } from '../lib/loan'
import { Card, Stat, SectionTitle } from '../components/ui'
import { FormSheet } from '../components/FormSheet'

const numU = (v: string) => (v === '' || v == null ? undefined : Number(v))

export function Home() {
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const data = useLiveQuery(async () => {
    const settings = await getSettings()
    const [txs, accounts, people, crypto] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.people.toArray(),
      db.crypto.toArray(),
    ])

    const liquid = accounts.reduce((s, a) => s + toETB(a.balance ?? 0, a.currency, settings, a.fxRate), 0)
    const cryptoVal = crypto.reduce((s, c) => s + (c.manualPrice ?? 0) * c.quantity, 0)
    const owedToMe = people.filter((p) => p.status === 'Open' && p.direction === 'Owed to me')
      .reduce((s, p) => s + toETB(p.amount, p.currency, settings, p.fxRate), 0)
    const iOwe = people.filter((p) => p.status === 'Open' && p.direction === 'I owe')
      .reduce((s, p) => s + toETB(p.amount, p.currency, settings, p.fxRate), 0)
    const netWorth = liquid + cryptoVal + owedToMe - iOwe - settings.loanBalance

    const mk = currentMonthKey()
    const monthTxs = txs.filter((t) => monthKey(t.date) === mk && t.type === 'Expense')
    const monthSpend = monthTxs.reduce((s, t) => s + toETB(t.amount, t.currency, settings, t.fxRate), 0)

    const byCat: Record<string, number> = {}
    for (const t of monthTxs) byCat[t.category] = (byCat[t.category] ?? 0) + toETB(t.amount, t.currency, settings, t.fxRate)
    const chart = Object.entries(byCat).map(([category, value]) => ({ category, value: Math.round(value) })).sort((a, b) => b.value - a.value)

    const recent = [...txs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id ?? 0) - (a.id ?? 0))).slice(0, 12)

    const payoff = projectPayoff(settings.loanBalance, settings.loanAutoDebit + settings.loanExtra, settings.loanRate)
    return { settings, liquid, netWorth, monthSpend, chart, recent, payoff, accounts }
  }, [])

  if (!data) return <div className="p-6 text-slate-400">Loading…</div>
  const { settings, liquid, netWorth, monthSpend, chart, recent, payoff, accounts } = data
  const origin = Math.max(1913275, settings.loanBalance)
  const paidPct = origin > 0 ? Math.round((1 - settings.loanBalance / origin) * 100) : 0
  const palette = ['#0f766e', '#14b8a6', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-1">Home</h1>
      <p className="text-sm text-slate-400 mb-4">{monthLabel()}</p>

      <div className="bg-accent text-white rounded-2xl shadow-sm p-4">
        <div className="text-sm text-white/80">Estimated net worth</div>
        <div className="text-3xl font-bold tracking-tight mt-0.5">{fmtETB(netWorth)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Card><Stat label="Liquid savings" value={fmtETB(liquid)} /></Card>
        <Card><Stat label="Spent this month" value={fmtETB(monthSpend)} /></Card>
      </div>

      <SectionTitle>This month by category</SectionTitle>
      <Card>
        {chart.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">No expenses logged yet this month.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chart.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <SectionTitle>Recent transactions</SectionTitle>
      <div className="space-y-2">
        {recent.length === 0 && <p className="text-slate-400 text-sm px-1">Nothing yet — tap Add to log your first.</p>}
        {recent.map((t) => (
          <Card key={t.id} className="py-3 active:bg-slate-50">
            <button className="w-full flex justify-between items-center text-left" onClick={() => setEditTx(t)}>
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-400">{t.date} · {t.category} · {t.type}</div>
              </div>
              <div className={`font-semibold ${t.type === 'Income' ? 'text-emerald-600' : ''}`}>
                {t.type === 'Income' ? '+' : '-'}{fmt(t.amount, t.currency)}
              </div>
            </button>
          </Card>
        ))}
      </div>

      <SectionTitle>Car loan</SectionTitle>
      <Card>
        <div className="flex justify-between items-baseline">
          <Stat label="Remaining" value={fmtETB(settings.loanBalance)} />
          <div className="text-right">
            <div className="text-sm text-slate-500">Projected payoff</div>
            <div className="text-lg font-semibold">{payoff.neverPaysOff ? 'Never' : fmtMonthYear(payoff.payoffDate)}</div>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${paidPct}%` }} />
        </div>
        <div className="text-xs text-slate-400 mt-1">{paidPct}% paid off{payoff.neverPaysOff ? '' : ` · ~${payoff.months} months left`}</div>
      </Card>

      {editTx && (
        <FormSheet
          title="Edit transaction"
          fields={[
            { key: 'name', label: 'Description', type: 'text' },
            { key: 'amount', label: 'Amount', type: 'number', step: 'any' },
            { key: 'currency', label: 'Currency', type: 'select', options: ['ETB', 'USD', 'EUR'] },
            { key: 'type', label: 'Type', type: 'select', options: ['Expense', 'Income', 'Transfer', 'Loan payment'] },
            { key: 'category', label: 'Category', type: 'select', options: settings.categories },
            { key: 'account', label: 'Account', type: 'select', options: accounts.map((a) => a.name) },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'note', label: 'Note', type: 'text', optional: true },
          ]}
          initial={{
            name: editTx.name, amount: String(editTx.amount), currency: editTx.currency, type: editTx.type,
            category: editTx.category, account: editTx.account, date: editTx.date, note: editTx.note ?? '',
          }}
          onClose={() => setEditTx(null)}
          onSave={(v) => db.transactions.update(editTx.id!, {
            name: v.name || v.category, amount: Number(v.amount), currency: v.currency as Transaction['currency'],
            type: v.type as Transaction['type'], category: v.category, account: v.account, date: v.date,
            fxRate: numU(v.fxRate), note: v.note || undefined,
          })}
          onDelete={() => db.transactions.delete(editTx.id!)}
        />
      )}
    </div>
  )
}
