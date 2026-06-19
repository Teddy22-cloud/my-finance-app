import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSettings, getSettings, loadSeedData } from './db'
import { TabBar, type Tab } from './components/TabBar'
import { Home } from './screens/Home'
import { Add } from './screens/Add'
import { Accounts } from './screens/Accounts'
import { Loan } from './screens/Loan'
import { More } from './screens/More'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const settings = useLiveQuery(() => getSettings(), [])
  const [dismissedSeed, setDismissedSeed] = useState(false)

  // One-time init + ask the browser to keep our data (so it isn't evicted).
  useEffect(() => {
    ensureSettings()
    if (navigator.storage?.persist) navigator.storage.persist()
  }, [])

  const showSeed = settings && !settings.seeded && !dismissedSeed

  return (
    <div className="max-w-md mx-auto min-h-full safe-top">
      {showSeed && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold">Load my starting data?</h2>
            <p className="text-slate-500 text-sm mt-2">
              This pre-fills your accounts, loan, IOUs, crypto and budgets with the values from your setup. You can edit everything later.
            </p>
            <div className="mt-5 space-y-2">
              <button
                onClick={async () => { await loadSeedData(); setDismissedSeed(true) }}
                className="w-full bg-accent text-white font-semibold rounded-xl py-3 active:bg-accent-dark"
              >
                Yes, load it
              </button>
              <button
                onClick={async () => { await db.settings.update(1, { seeded: true }); setDismissedSeed(true) }}
                className="w-full text-slate-500 font-medium rounded-xl py-2.5"
              >
                Start empty
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'home' && <Home />}
      {tab === 'add' && <Add />}
      {tab === 'accounts' && <Accounts />}
      {tab === 'loan' && <Loan />}
      {tab === 'more' && <More />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
