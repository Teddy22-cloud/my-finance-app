import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, exportAll, importAll } from '../db'
import { toETB, fmtETB } from '../lib/money'
import { currentMonthKey, monthKey, monthLabel } from '../lib/date'
import { projectPayoff, fmtMonthYear } from '../lib/loan'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'

export function More() {
  const settings = useLiveQuery(() => getSettings(), [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function backup() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `birr-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Backup downloaded')
  }

  async function restore(file: File) {
    try {
      const data = JSON.parse(await file.text())
      await importAll(data)
      flash('Data restored')
    } catch {
      flash('Could not read that file')
    }
  }

  async function exportForClaude() {
    const s = await getSettings()
    const [accounts, people, crypto, txs] = await Promise.all([
      db.accounts.toArray(), db.people.toArray(), db.crypto.toArray(), db.transactions.toArray(),
    ])
    const liquid = accounts.reduce((a, x) => a + toETB(x.balance ?? 0, x.currency, s, x.fxRate), 0)
    const mk = currentMonthKey()
    const byCat: Record<string, number> = {}
    for (const t of txs) if (monthKey(t.date) === mk && t.type === 'Expense')
      byCat[t.category] = (byCat[t.category] ?? 0) + toETB(t.amount, t.currency, s, t.fxRate)
    const owed = people.filter((p) => p.status === 'Open' && p.direction === 'Owed to me').reduce((a, p) => a + toETB(p.amount, p.currency, s, p.fxRate), 0)
    const owe = people.filter((p) => p.status === 'Open' && p.direction === 'I owe').reduce((a, p) => a + toETB(p.amount, p.currency, s, p.fxRate), 0)
    const payoff = projectPayoff(s.loanBalance, s.loanAutoDebit + s.loanExtra, s.loanRate)

    const lines = [
      `My finances — ${monthLabel()}`,
      ``,
      `Liquid savings: ${fmtETB(liquid)}`,
      `Accounts:`,
      ...accounts.map((a) => `  - ${a.name} (${a.type}, ${a.currency}): ${a.balance == null ? 'n/a' : a.balance}`),
      ``,
      `Spending this month by category:`,
      ...Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `  - ${c}: ${fmtETB(v)}`),
      `  Total: ${fmtETB(Object.values(byCat).reduce((a, b) => a + b, 0))}`,
      ``,
      `Car loan: balance ${fmtETB(s.loanBalance)} @ ${s.loanRate}% annual`,
      `  Auto-debit ${fmtETB(s.loanAutoDebit)} + extra ${fmtETB(s.loanExtra)} = ${fmtETB(s.loanAutoDebit + s.loanExtra)}/mo`,
      `  Projected payoff: ${payoff.neverPaysOff ? 'never at this rate' : `${fmtMonthYear(payoff.payoffDate)} (~${payoff.months} months)`}`,
      ``,
      `IOUs: owed to me ${fmtETB(owed)}, I owe ${fmtETB(owe)}, net ${fmtETB(owed - owe)}`,
      `Crypto holdings: ${crypto.map((c) => `${c.coin} ${c.quantity}`).join(', ')}`,
    ]
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      flash('Summary copied — paste into Claude')
    } catch {
      flash('Copy failed; long-press to copy below')
      window.prompt('Copy this:', text)
    }
  }

  function upd(patch: Partial<NonNullable<typeof settings>>) {
    db.settings.update(1, patch)
  }

  if (!settings) return <div className="p-6 text-slate-400">Loading…</div>

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">More</h1>

      <SectionTitle>FX rates (to ETB)</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="USD"><input type="number" className={inputClass} defaultValue={settings.fxUSD} onBlur={(e) => upd({ fxUSD: Number(e.target.value) })} /></Field>
          <Field label="EUR"><input type="number" className={inputClass} defaultValue={settings.fxEUR} onBlur={(e) => upd({ fxEUR: Number(e.target.value) })} /></Field>
        </div>
      </Card>

      <SectionTitle>Loan parameters</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Balance (ETB)"><input type="number" className={inputClass} defaultValue={settings.loanBalance} onBlur={(e) => upd({ loanBalance: Number(e.target.value) })} /></Field>
          <Field label="Rate (% annual)"><input type="number" className={inputClass} defaultValue={settings.loanRate} onBlur={(e) => upd({ loanRate: Number(e.target.value) })} /></Field>
          <Field label="Auto-debit (ETB)"><input type="number" className={inputClass} defaultValue={settings.loanAutoDebit} onBlur={(e) => upd({ loanAutoDebit: Number(e.target.value) })} /></Field>
          <Field label="Planned extra (ETB)"><input type="number" className={inputClass} defaultValue={settings.loanExtra} onBlur={(e) => upd({ loanExtra: Number(e.target.value) })} /></Field>
        </div>
      </Card>

      <SectionTitle>Categories</SectionTitle>
      <Card>
        <Field label="Comma-separated">
          <input className={inputClass} defaultValue={settings.categories.join(', ')}
            onBlur={(e) => upd({ categories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
        </Field>
      </Card>

      <SectionTitle>Data</SectionTitle>
      <div className="space-y-2">
        <button onClick={backup} className="w-full bg-white border border-slate-200 rounded-2xl py-3 font-medium active:bg-slate-50">⬇︎ Backup (download .json)</button>
        <button onClick={() => fileRef.current?.click()} className="w-full bg-white border border-slate-200 rounded-2xl py-3 font-medium active:bg-slate-50">⬆︎ Restore (from .json)</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f) }} />
        <button onClick={exportForClaude} className="w-full bg-accent text-white rounded-2xl py-3 font-semibold active:bg-accent-dark">✦ Export for Claude (copy summary)</button>
      </div>

      {msg && <div className="fixed bottom-24 left-0 right-0 flex justify-center z-30"><div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">{msg}</div></div>}
    </div>
  )
}
