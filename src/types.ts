export type Currency = 'ETB' | 'USD' | 'EUR'
export type TxType = 'Expense' | 'Income' | 'Transfer' | 'Loan payment'

export interface Transaction {
  id?: number
  name: string
  amount: number
  currency: Currency
  fxRate?: number
  type: TxType
  category: string
  account: string
  date: string // ISO yyyy-mm-dd
  note?: string
}

export type AccountType = 'Savings' | 'Cash'
export interface Account {
  id?: number
  name: string
  type: AccountType
  currency: Currency
  balance: number | null
  fxRate?: number
  note?: string
}

export type PaymentType = 'Auto-debit' | 'Extra' | 'Statement'
export interface LoanPayment {
  id?: number
  date: string
  paymentType: PaymentType
  amount: number
  balanceAfter?: number
  note?: string
}

export type Direction = 'I owe' | 'Owed to me'
export type PersonStatus = 'Open' | 'Settled'
export interface Person {
  id?: number
  person: string
  direction: Direction
  amount: number
  currency: Currency
  fxRate?: number
  status: PersonStatus
  note?: string
}

export type CryptoStatus = 'Holding' | 'Staked'
export interface Crypto {
  id?: number
  coin: string
  quantity: number
  status: CryptoStatus
  manualPrice?: number // price in ETB per unit (optional)
  note?: string
}

export interface Budget {
  id?: number
  category: string
  monthlyTarget: number
}

export interface Settings {
  id?: number // always 1
  fxUSD: number
  fxEUR: number
  loanBalance: number
  loanRate: number // annual %, e.g. 12
  loanAutoDebit: number
  loanExtra: number
  loanNote?: string
  categories: string[]
  seeded?: boolean
}
