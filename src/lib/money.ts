import type { Currency, Settings } from '../types'

export function fxFor(currency: Currency, settings: Settings, override?: number): number {
  if (override && override > 0) return override
  if (currency === 'USD') return settings.fxUSD
  if (currency === 'EUR') return settings.fxEUR
  return 1
}

// Convert any amount to ETB using its own fxRate, falling back to settings defaults.
export function toETB(
  amount: number,
  currency: Currency,
  settings: Settings,
  fxRate?: number,
): number {
  return amount * fxFor(currency, settings, fxRate)
}

const NF = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const NF2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function fmtETB(amount: number): string {
  return `ETB ${NF.format(Math.round(amount))}`
}

export function fmt(amount: number, currency: Currency): string {
  const n = currency === 'ETB' ? NF.format(Math.round(amount)) : NF2.format(amount)
  return `${currency} ${n}`
}
