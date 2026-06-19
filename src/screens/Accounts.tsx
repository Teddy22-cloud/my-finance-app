import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db'
import type { Account, Person, Crypto, Budget } from '../types'
import { toETB, fmtETB, fmt } from '../lib/money'
import { currentMonthKey, monthKey } from '../lib/date'
import { Card, Stat, SectionTitle } from '../components/ui'
import { FormSheet, type FormValues } from '../components/FormSheet'

const numU = (v: string) => (v === '' || v == null ? undefined : Number(v))
const numN = (v: string) => (v === '' || v == null ? null : Number(v))

type Editing =
  | { kind: 'account'; item: Account | null }
  | { kind: 'person'; item: Person | null }
  | { kind: 'crypto'; item: Crypto | null }
  | { kind: 'budget'; item: Budget | null }
  | null

function AddBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-sm font-semibold text-accent">+ Add</button>
}

export function Accounts() {
  const [editing, setEditing] = useState<Editing>(null)
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
    for (const t of txs) if (monthKey(t.date) === mk && t.type === 'Expense')
      actual[t.category] = (actual[t.category] ?? 0) + toETB(t.amount, t.currency, settings, t.fxRate)
    return { settings, accounts, people, crypto, budget, owed, owe, actual }
  }, [])

  if (!data) return <div className="p-6 text-slate-400">Loading…</div>
  const { settings, accounts, people, crypto, budget, owed, owe, actual } = data

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>

      <div className="flex items-center justify-between mb-2">
        <SectionTitle>Balances</SectionTitle>
        <AddBtn onClick={() => setEditing({ kind: 'account', item: null })} />
      </div>
      <div className="space-y-2">
        {accounts.length === 0 && <p className="text-slate-400 text-sm px-1">No accounts yet.</p>}
        {accounts.map((a) => (
          <Card key={a.id} className="flex justify-between items-center active:bg-slate-50" >
            <button className="flex-1 flex justify-between items-center text-left" onClick={() => setEditing({ kind: 'account', item: a })}>
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
            </button>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <SectionTitle>People / IOUs</SectionTitle>
        <AddBtn onClick={() => setEditing({ kind: 'person', item: null })} />
      </div>
      <Card className="mb-2 flex justify-between">
        <Stat label="Owed to me" value={fmtETB(owed)} />
        <Stat label="I owe" value={fmtETB(owe)} />
        <Stat label="Net" value={fmtETB(owed - owe)} />
      </Card>
      <div className="space-y-2">
        {people.map((p) => (
          <Card key={p.id} className="py-3 active:bg-slate-50">
            <button className="w-full flex justify-between items-center text-left" onClick={() => setEditing({ kind: 'person', item: p })}>
              <div>
                <div className="font-medium">{p.person} <span className={`text-xs ${p.direction === 'I owe' ? 'text-red-500' : 'text-emerald-600'}`}>{p.direction}</span></div>
                <div className="text-xs text-slate-400">{p.status}{p.note ? ` · ${p.note}` : ''}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{fmt(p.amount, p.currency)}</div>
                {p.currency !== 'ETB' && <div className="text-xs text-slate-400">{fmtETB(toETB(p.amount, p.currency, settings, p.fxRate))}</div>}
              </div>
            </button>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <SectionTitle>Crypto</SectionTitle>
        <AddBtn onClick={() => setEditing({ kind: 'crypto', item: null })} />
      </div>
      <div className="space-y-2">
        {crypto.map((c) => (
          <Card key={c.id} className="py-3 active:bg-slate-50">
            <button className="w-full flex justify-between items-center text-left" onClick={() => setEditing({ kind: 'crypto', item: c })}>
              <div>
                <div className="font-medium">{c.coin}</div>
                <div className="text-xs text-slate-400">{c.status}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{c.quantity}</div>
                {c.manualPrice ? <div className="text-xs text-slate-400">{fmtETB(c.manualPrice * c.quantity)}</div> : <div className="text-xs text-slate-300">no price set</div>}
              </div>
            </button>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <SectionTitle>Budget vs actual (this month)</SectionTitle>
        <AddBtn onClick={() => setEditing({ kind: 'budget', item: null })} />
      </div>
      <Card>
        <div className="space-y-3">
          {budget.map((b) => {
            const spent = actual[b.category] ?? 0
            const pct = b.monthlyTarget > 0 ? Math.min(100, Math.round((spent / b.monthlyTarget) * 100)) : 0
            const over = spent > b.monthlyTarget
            return (
              <button key={b.id} className="w-full text-left" onClick={() => setEditing({ kind: 'budget', item: b })}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className={over ? 'text-red-500 font-semibold' : 'text-slate-500'}>{fmtETB(spent)} / {fmtETB(b.monthlyTarget)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {editing?.kind === 'account' && (
        <FormSheet
          title={editing.item ? 'Edit account' : 'New account'}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['Savings', 'Cash'] },
            { key: 'currency', label: 'Currency', type: 'select', options: ['ETB', 'USD', 'EUR'] },
            { key: 'balance', label: 'Balance', type: 'number', optional: true, placeholder: 'leave blank if unknown' },
            { key: 'fxRate', label: 'FX rate to ETB', type: 'number', optional: true, placeholder: 'uses default if blank' },
            { key: 'note', label: 'Note', type: 'text', optional: true },
          ]}
          initial={initFrom(editing.item, { type: 'Savings', currency: 'ETB' })}
          onClose={() => setEditing(null)}
          onSave={(v) => upsert<Account>('accounts', editing.item?.id, {
            name: v.name, type: v.type as Account['type'], currency: v.currency as Account['currency'],
            balance: numN(v.balance), fxRate: numU(v.fxRate), note: v.note || undefined,
          })}
          onDelete={editing.item ? () => db.accounts.delete(editing.item!.id!) : undefined}
        />
      )}

      {editing?.kind === 'person' && (
        <FormSheet
          title={editing.item ? 'Edit IOU' : 'New IOU'}
          fields={[
            { key: 'person', label: 'Person', type: 'text' },
            { key: 'direction', label: 'Direction', type: 'select', options: ['I owe', 'Owed to me'] },
            { key: 'amount', label: 'Amount', type: 'number' },
            { key: 'currency', label: 'Currency', type: 'select', options: ['ETB', 'USD', 'EUR'] },
            { key: 'fxRate', label: 'FX rate to ETB', type: 'number', optional: true },
            { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Settled'] },
            { key: 'note', label: 'Note', type: 'text', optional: true },
          ]}
          initial={initFrom(editing.item, { direction: 'I owe', currency: 'ETB', status: 'Open' })}
          onClose={() => setEditing(null)}
          onSave={(v) => upsert<Person>('people', editing.item?.id, {
            person: v.person, direction: v.direction as Person['direction'], amount: Number(v.amount),
            currency: v.currency as Person['currency'], fxRate: numU(v.fxRate),
            status: v.status as Person['status'], note: v.note || undefined,
          })}
          onDelete={editing.item ? () => db.people.delete(editing.item!.id!) : undefined}
        />
      )}

      {editing?.kind === 'crypto' && (
        <FormSheet
          title={editing.item ? 'Edit holding' : 'New holding'}
          fields={[
            { key: 'coin', label: 'Coin', type: 'text', placeholder: 'BTC' },
            { key: 'quantity', label: 'Quantity', type: 'number', step: 'any' },
            { key: 'status', label: 'Status', type: 'select', options: ['Holding', 'Staked'] },
            { key: 'manualPrice', label: 'Price per unit (ETB)', type: 'number', optional: true },
            { key: 'note', label: 'Note', type: 'text', optional: true },
          ]}
          initial={initFrom(editing.item, { status: 'Holding' })}
          onClose={() => setEditing(null)}
          onSave={(v) => upsert<Crypto>('crypto', editing.item?.id, {
            coin: v.coin, quantity: Number(v.quantity), status: v.status as Crypto['status'],
            manualPrice: numU(v.manualPrice), note: v.note || undefined,
          })}
          onDelete={editing.item ? () => db.crypto.delete(editing.item!.id!) : undefined}
        />
      )}

      {editing?.kind === 'budget' && (
        <FormSheet
          title={editing.item ? 'Edit budget line' : 'New budget line'}
          fields={[
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'monthlyTarget', label: 'Monthly target (ETB)', type: 'number' },
          ]}
          initial={initFrom(editing.item, {})}
          onClose={() => setEditing(null)}
          onSave={(v) => upsert<Budget>('budget', editing.item?.id, {
            category: v.category, monthlyTarget: Number(v.monthlyTarget),
          })}
          onDelete={editing.item ? () => db.budget.delete(editing.item!.id!) : undefined}
        />
      )}
    </div>
  )
}

// Build initial string values from an existing record, merged with defaults for new items.
function initFrom(item: object | null, defaults: FormValues): FormValues {
  const out: FormValues = { ...defaults }
  if (item) for (const [k, val] of Object.entries(item as Record<string, unknown>)) {
    if (k === 'id') continue
    out[k] = val == null ? '' : String(val)
  }
  return out
}

async function upsert<T>(table: 'accounts' | 'people' | 'crypto' | 'budget', id: number | undefined, data: T) {
  if (id) await (db[table] as any).update(id, data as any)
  else await (db[table] as any).add(data as any)
}
