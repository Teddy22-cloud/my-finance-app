import Dexie, { type Table } from 'dexie'
import type {
  Transaction, Account, LoanPayment, Person, Crypto, Budget, Settings,
} from './types'

export class FinanceDB extends Dexie {
  transactions!: Table<Transaction, number>
  accounts!: Table<Account, number>
  loanPayments!: Table<LoanPayment, number>
  people!: Table<Person, number>
  crypto!: Table<Crypto, number>
  budget!: Table<Budget, number>
  settings!: Table<Settings, number>

  constructor() {
    super('birrFinanceDB')
    this.version(1).stores({
      transactions: '++id, date, type, category, account',
      accounts: '++id, name',
      loanPayments: '++id, date',
      people: '++id, person, status',
      crypto: '++id, coin',
      budget: '++id, category',
      settings: 'id',
    })
  }
}

export const db = new FinanceDB()

export const DEFAULT_CATEGORIES = [
  'Food', 'Fuel', 'Apartment', 'Electricity', 'Wifi', 'Gym', 'Fun',
  'Gifts', 'Health', 'Transport', 'Subscriptions', 'Salary', 'Misc',
]

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  fxUSD: 176,
  fxEUR: 205,
  loanBalance: 0,
  loanRate: 12,
  loanAutoDebit: 0,
  loanExtra: 0,
  categories: DEFAULT_CATEGORIES,
  seeded: false,
}

// Read-only: safe to call inside useLiveQuery. Returns the in-memory default
// if the row hasn't been created yet (ensureSettings handles persistence).
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get(1)) ?? DEFAULT_SETTINGS
}

// Writes the default settings row once, if missing. Call at app startup,
// never inside a liveQuery (Dexie forbids writes in that context).
export async function ensureSettings(): Promise<void> {
  const s = await db.settings.get(1)
  if (!s) await db.settings.put(DEFAULT_SETTINGS)
}

// One-time seed data from the build guide.
export async function loadSeedData() {
  await db.transaction('rw', db.tables, async () => {
    await db.settings.put({
      id: 1,
      fxUSD: 176,
      fxEUR: 205,
      loanBalance: 1913275,
      loanRate: 12,
      loanAutoDebit: 35568,
      loanExtra: 200000,
      loanNote: 'target payoff Oct–Nov 2026',
      categories: DEFAULT_CATEGORIES,
      seeded: true,
    })

    await db.accounts.bulkAdd([
      { name: 'EUR savings', type: 'Savings', currency: 'EUR', balance: 2000, fxRate: 205 },
      { name: 'USD account', type: 'Savings', currency: 'USD', balance: 500, fxRate: 176 },
      { name: 'CBE / Cash', type: 'Cash', currency: 'ETB', balance: null },
    ])

    await db.people.bulkAdd([
      { person: 'Friend', direction: 'Owed to me', amount: 700, currency: 'EUR', fxRate: 205, status: 'Open', note: '~1yr overdue' },
      { person: 'Mom', direction: 'I owe', amount: 80000, currency: 'ETB', status: 'Open' },
      { person: 'Loan to settle', direction: 'I owe', amount: 300, currency: 'USD', fxRate: 176, status: 'Open', note: 'pay from EUR savings' },
      { person: 'Small item', direction: 'I owe', amount: 6300, currency: 'ETB', status: 'Open' },
    ])

    await db.crypto.bulkAdd([
      { coin: 'BTC', quantity: 0.012, status: 'Holding' },
      { coin: 'SOL', quantity: 1.50, status: 'Holding' },
      { coin: 'ICP', quantity: 4.07, status: 'Holding' },
      { coin: 'FIL', quantity: 7.04, status: 'Holding' },
      { coin: 'FET', quantity: 21.06, status: 'Holding' },
      { coin: 'STRK', quantity: 51.27, status: 'Holding' },
      { coin: 'TNSR', quantity: 14.96, status: 'Holding' },
      { coin: 'AURORA', quantity: 5.42, status: 'Holding' },
      { coin: 'ATOM', quantity: 11.53, status: 'Staked' },
      { coin: 'ADA', quantity: 50.95, status: 'Staked' },
    ])

    await db.budget.bulkAdd([
      { category: 'Food', monthlyTarget: 40000 },
      { category: 'Fuel', monthlyTarget: 6000 },
      { category: 'Apartment', monthlyTarget: 20000 },
      { category: 'Electricity', monthlyTarget: 1000 },
      { category: 'Wifi', monthlyTarget: 1000 },
      { category: 'Fun', monthlyTarget: 15000 },
      { category: 'Misc', monthlyTarget: 10000 },
      { category: 'Loan-extra', monthlyTarget: 200000 },
    ])
  })
}

export async function exportAll() {
  const [transactions, accounts, loanPayments, people, crypto, budget, settings] =
    await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.loanPayments.toArray(),
      db.people.toArray(),
      db.crypto.toArray(),
      db.budget.toArray(),
      db.settings.toArray(),
    ])
  return { version: 1, exportedAt: new Date().toISOString(), transactions, accounts, loanPayments, people, crypto, budget, settings }
}

export async function importAll(data: Awaited<ReturnType<typeof exportAll>>) {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    if (data.transactions) await db.transactions.bulkAdd(data.transactions)
    if (data.accounts) await db.accounts.bulkAdd(data.accounts)
    if (data.loanPayments) await db.loanPayments.bulkAdd(data.loanPayments)
    if (data.people) await db.people.bulkAdd(data.people)
    if (data.crypto) await db.crypto.bulkAdd(data.crypto)
    if (data.budget) await db.budget.bulkAdd(data.budget)
    if (data.settings) await db.settings.bulkPut(data.settings)
  })
}
