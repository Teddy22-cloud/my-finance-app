export interface PayoffResult {
  months: number
  payoffDate: Date | null
  totalInterest: number
  neverPaysOff: boolean
}

// Amortization projector: given balance, monthly payment (auto-debit + extra) and
// annual interest rate, compute months to clear and the payoff date.
export function projectPayoff(
  balance: number,
  monthlyPayment: number,
  annualRatePct: number,
): PayoffResult {
  const monthlyRate = annualRatePct / 100 / 12
  let remaining = balance
  let months = 0
  let totalInterest = 0
  const maxMonths = 1200 // 100 years guard

  if (balance <= 0) {
    return { months: 0, payoffDate: new Date(), totalInterest: 0, neverPaysOff: false }
  }

  // If payment doesn't cover the first month's interest, it never pays off.
  if (monthlyPayment <= balance * monthlyRate) {
    return { months: Infinity, payoffDate: null, totalInterest: Infinity, neverPaysOff: true }
  }

  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * monthlyRate
    totalInterest += interest
    remaining = remaining + interest - monthlyPayment
    months += 1
  }

  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)

  return { months, payoffDate, totalInterest, neverPaysOff: false }
}

export function fmtMonthYear(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
