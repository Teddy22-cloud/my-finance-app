import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db'
import type { LoanPayment, PaymentType } from '../types'
import { fmtETB } from '../lib/money'
import { projectPayoff, fmtMonthYear } from '../lib/loan'
import { todayISO } from '../lib/date'
import { Card, Stat, SectionTitle, Field, inputClass, Chip } from '../components/ui'
import { FormSheet } from '../components/FormSheet'

const PT: PaymentType[] = ['Auto-debit', 'Extra', 'Statement']

export function Loan() {
  const settings = useLiveQuery(() => getSettings(), [])
  const payments = useLiveQuery(() => db.loanPayments.orderBy('date').reverse().toArray(), [])
  const [extra, setExtra] = useState<number | null>(null)
  const [editPay, setEditPay] = useState<LoanPayment | null>(null)
  const [form, setForm] = useState({ amount: '', paymentType: 'Auto-debit' as PaymentType, date: todayISO(), note: '' })

  if (!settings) return <div className="p-6 text-slate-400">Loading…</div>

  const liveExtra = extra ?? settings.loanExtra
  const payment = settings.loanAutoDebit + liveExtra
  const payoff = projectPayoff(settings.loanBalance, payment, settings.loanRate)
  const maxExtra = Math.max(500000, Math.round(settings.loanAutoDebit * 10))

  async function logPayment() {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    await db.loanPayments.add({
      date: form.date, paymentType: form.paymentType, amount: amt, note: form.note.trim() || undefined,
    })
    // reduce balance
    await db.settings.update(1, { loanBalance: Math.max(0, settings!.loanBalance - amt) })
    setForm({ ...form, amount: '', note: '' })
  }

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">Loan</h1>

      <Card>
        <Stat label="Current balance" value={fmtETB(settings.loanBalance)} sub={settings.loanNote} />
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><div className="text-xs text-slate-400">Rate</div><div className="font-semibold">{settings.loanRate}%</div></div>
          <div><div className="text-xs text-slate-400">Auto-debit</div><div className="font-semibold">{fmtETB(settings.loanAutoDebit)}</div></div>
          <div><div className="text-xs text-slate-400">Extra</div><div className="font-semibold">{fmtETB(liveExtra)}</div></div>
        </div>
      </Card>

      <SectionTitle>Payoff projector</SectionTitle>
      <Card>
        <div className="flex justify-between items-baseline">
          <Stat label="Months to clear" value={payoff.neverPaysOff ? '∞' : String(payoff.months)} />
          <div className="text-right">
            <div className="text-sm text-slate-500">Payoff date</div>
            <div className="text-xl font-bold text-accent">{payoff.neverPaysOff ? 'Never' : fmtMonthYear(payoff.payoffDate)}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Extra payment / month</span>
            <span className="font-semibold">{fmtETB(liveExtra)}</span>
          </div>
          <input
            type="range" min={0} max={maxExtra} step={5000}
            value={liveExtra}
            onChange={(e) => setExtra(Number(e.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-xs text-slate-400"><span>ETB 0</span><span>{fmtETB(maxExtra)}</span></div>
        </div>
        <div className="text-xs text-slate-500 mt-3">
          Monthly payment {fmtETB(payment)}{!payoff.neverPaysOff && <> · total interest ~{fmtETB(payoff.totalInterest)}</>}
        </div>
        {extra !== null && extra !== settings.loanExtra && (
          <button onClick={() => db.settings.update(1, { loanExtra: liveExtra })}
            className="mt-3 w-full text-sm font-medium text-accent border border-accent rounded-xl py-2">
            Save {fmtETB(liveExtra)} as my planned extra
          </button>
        )}
      </Card>

      <SectionTitle>Log a payment</SectionTitle>
      <Card>
        <div className="flex gap-2 mb-3">
          {PT.map((p) => <Chip key={p} active={form.paymentType === p} onClick={() => setForm({ ...form, paymentType: p })}>{p}</Chip>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (ETB)"><input type="number" inputMode="decimal" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Date"><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        </div>
        <button onClick={logPayment} className="mt-3 w-full bg-accent text-white font-semibold rounded-xl py-2.5 active:bg-accent-dark disabled:opacity-40" disabled={!form.amount}>
          Log payment & reduce balance
        </button>
      </Card>

      <SectionTitle>Payment history</SectionTitle>
      <div className="space-y-2">
        {(payments ?? []).length === 0 && <p className="text-slate-400 text-sm px-1">No payments logged yet.</p>}
        {payments?.map((p) => (
          <Card key={p.id} className="py-3 active:bg-slate-50">
            <button className="w-full flex justify-between items-center text-left" onClick={() => setEditPay(p)}>
              <div>
                <div className="font-medium">{p.paymentType}</div>
                <div className="text-xs text-slate-400">{p.date}{p.note ? ` · ${p.note}` : ''}</div>
              </div>
              <div className="font-semibold">{fmtETB(p.amount)}</div>
            </button>
          </Card>
        ))}
      </div>

      {editPay && (
        <FormSheet
          title="Edit payment"
          fields={[
            { key: 'paymentType', label: 'Type', type: 'select', options: PT },
            { key: 'amount', label: 'Amount (ETB)', type: 'number' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'note', label: 'Note', type: 'text', optional: true },
          ]}
          initial={{ paymentType: editPay.paymentType, amount: String(editPay.amount), date: editPay.date, note: editPay.note ?? '' }}
          onClose={() => setEditPay(null)}
          onSave={async (v) => {
            const newAmt = Number(v.amount)
            const delta = newAmt - editPay.amount // extra paid -> balance drops further
            await db.loanPayments.update(editPay.id!, {
              paymentType: v.paymentType as PaymentType, amount: newAmt, date: v.date, note: v.note || undefined,
            })
            await db.settings.update(1, { loanBalance: Math.max(0, settings!.loanBalance - delta) })
          }}
          onDelete={async () => {
            // Removing a payment puts that amount back onto the balance.
            await db.loanPayments.delete(editPay.id!)
            await db.settings.update(1, { loanBalance: settings!.loanBalance + editPay.amount })
          }}
        />
      )}
    </div>
  )
}
