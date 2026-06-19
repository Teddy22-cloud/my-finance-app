import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db'
import type { Currency, TxType } from '../types'
import { todayISO } from '../lib/date'
import { Card, Chip, Field, inputClass } from '../components/ui'

const TYPES: TxType[] = ['Expense', 'Income', 'Transfer', 'Loan payment']
const CURRENCIES: Currency[] = ['ETB', 'USD', 'EUR']

export function Add() {
  const settings = useLiveQuery(() => getSettings(), [])
  const accounts = useLiveQuery(() => db.accounts.toArray(), [])
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TxType>('Expense')
  const [currency, setCurrency] = useState<Currency>('ETB')
  const [category, setCategory] = useState('Food')
  const [account, setAccount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const categories = settings?.categories ?? []

  async function save() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    await db.transactions.add({
      name: name.trim() || category,
      amount: amt,
      currency,
      type,
      category,
      account: account || accounts?.[0]?.name || '',
      date,
      note: note.trim() || undefined,
    })
    setAmount(''); setName(''); setNote('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">Add</h1>

      <Card className="text-center">
        <div className="text-sm text-slate-500 mb-1">{currency}</div>
        <input
          autoFocus
          inputMode="decimal"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full text-center text-5xl font-bold tracking-tight bg-transparent outline-none placeholder:text-slate-300"
        />
        <div className="flex justify-center gap-2 mt-3">
          {CURRENCIES.map((c) => (
            <Chip key={c} active={currency === c} onClick={() => setCurrency(c)}>{c}</Chip>
          ))}
        </div>
      </Card>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>

      <p className="text-sm font-medium text-slate-600 mt-4 mb-2">Category</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Account">
          <select className={inputClass} value={account} onChange={(e) => setAccount(e.target.value)}>
            <option value="">{accounts?.[0]?.name ?? 'No accounts'}</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Description (optional)">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={category} />
        </Field>
        <Field label="Note (optional)">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      <button
        onClick={save}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full mt-5 bg-accent text-white font-semibold text-lg rounded-2xl py-3.5 shadow-sm active:bg-accent-dark disabled:opacity-40 transition"
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}
