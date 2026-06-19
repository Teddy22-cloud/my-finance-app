export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // yyyy-mm
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7)
}

export function monthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
