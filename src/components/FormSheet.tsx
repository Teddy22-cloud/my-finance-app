import { useState } from 'react'
import { inputClass } from './ui'

export interface Field {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[]
  optional?: boolean
  placeholder?: string
  step?: string
}

export type FormValues = Record<string, string>

interface Props {
  title: string
  fields: Field[]
  initial: FormValues
  onClose: () => void
  onSave: (values: FormValues) => unknown | Promise<unknown>
  onDelete?: () => unknown | Promise<unknown>
  saveLabel?: string
}

// Bottom-sheet form used to add OR edit any entity. Number fields are stored as
// strings while editing and coerced by the caller's onSave.
export function FormSheet({ title, fields, initial, onClose, onSave, onDelete, saveLabel = 'Save' }: Props) {
  const [vals, setVals] = useState<FormValues>(initial)
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  function set(key: string, v: string) {
    setVals((p) => ({ ...p, [key]: v }))
  }

  async function save() {
    setBusy(true)
    try { await onSave(vals); onClose() } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-slate-200 mb-4" />
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-slate-600">{f.label}{f.optional && <span className="text-slate-300"> (optional)</span>}</span>
              <div className="mt-1">
                {f.type === 'select' ? (
                  <select className={inputClass} value={vals[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className={inputClass}
                    type={f.type === 'number' ? 'number' : f.type}
                    inputMode={f.type === 'number' ? 'decimal' : undefined}
                    step={f.step}
                    placeholder={f.placeholder}
                    value={vals[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="w-full mt-5 bg-accent text-white font-semibold text-lg rounded-2xl py-3.5 active:bg-accent-dark disabled:opacity-40"
        >
          {saveLabel}
        </button>

        {onDelete && (
          <button
            onClick={async () => {
              if (!confirmDel) { setConfirmDel(true); return }
              setBusy(true)
              try { await onDelete(); onClose() } finally { setBusy(false) }
            }}
            className={`w-full mt-2 font-medium rounded-2xl py-3 ${confirmDel ? 'bg-red-500 text-white' : 'text-red-500'}`}
          >
            {confirmDel ? 'Tap again to confirm delete' : 'Delete'}
          </button>
        )}

        <button onClick={onClose} className="w-full mt-1 text-slate-400 py-2">Cancel</button>
      </div>
    </div>
  )
}
