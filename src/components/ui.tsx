import type { ReactNode } from 'react'

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-28">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-6 mb-2">{children}</h2>
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-medium transition ${
        active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
