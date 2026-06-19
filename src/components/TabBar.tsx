export type Tab = 'home' | 'add' | 'accounts' | 'loan' | 'more'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { id: 'add', label: 'Add', icon: 'M12 5v14M5 12h14' },
  { id: 'accounts', label: 'Accounts', icon: 'M3 7h18v12H3zM3 11h18' },
  { id: 'loan', label: 'Loan', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6' },
  { id: 'more', label: 'More', icon: 'M4 6h16M4 12h16M4 18h16' },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 safe-bottom z-20">
      <div className="max-w-md mx-auto flex">
        {tabs.map((t) => {
          const isAdd = t.id === 'add'
          const on = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2"
            >
              {isAdd ? (
                <span className={`-mt-5 mb-0.5 grid place-items-center w-12 h-12 rounded-full shadow-lg ${on ? 'bg-accent-dark' : 'bg-accent'} text-white`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d={t.icon} />
                  </svg>
                </span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={on ? 'text-accent' : 'text-slate-400'}>
                  <path d={t.icon} />
                </svg>
              )}
              <span className={`text-[11px] ${on ? 'text-accent font-semibold' : 'text-slate-400'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
