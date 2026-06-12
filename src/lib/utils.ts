import type { MarketCapCategory } from '../types/company'

export function formatCurrency(value: number | null, compact = true): string {
  if (value === null || value === undefined) return 'N/A'
  if (compact) {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function formatPct(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatMultiple(value: number | null, suffix = 'x'): string {
  if (value === null || value === undefined) return 'N/A'
  if (value < 0) return 'N/M'  // Negative multiple = not meaningful
  return `${value.toFixed(1)}${suffix}`
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return 'N/A'
  return value.toFixed(decimals)
}

export function getMarketCapCategory(marketCap: number): MarketCapCategory {
  if (marketCap < 300e6) return 'micro'
  if (marketCap < 2e9) return 'small'
  if (marketCap < 10e9) return 'mid'
  return 'large'
}

export function getChangeColor(value: number | null): string {
  if (value === null) return 'text-gf-text-secondary'
  if (value > 0) return 'text-gf-positive'
  if (value < 0) return 'text-gf-negative'
  return 'text-gf-text-secondary'
}

export function getSentimentColor(label: string): string {
  if (label === 'Bullish') return 'text-gf-positive'
  if (label === 'Bearish') return 'text-gf-negative'
  return 'text-gf-neutral-text'
}

export function getSentimentBg(label: string): string {
  if (label === 'Bullish') return 'bg-gf-positive-bg text-gf-positive'
  if (label === 'Bearish') return 'bg-gf-negative-bg text-gf-negative'
  return 'bg-gf-neutral text-gf-neutral-text'
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-gf-positive'
  if (score >= 40) return 'text-yellow-600'
  return 'text-gf-negative'
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-gf-positive-bg text-gf-positive'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700'
  return 'bg-gf-negative-bg text-gf-negative'
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffH / 24)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isDataStale(lastUpdated: string, maxAgeHours = 72): boolean {
  const date = new Date(lastUpdated)
  const now = new Date()
  const diffH = (now.getTime() - date.getTime()) / 3600000
  return diffH > maxAgeHours
}

// Generate a simple random walk for mock price data
export function generateMockPriceHistory(
  basePrice: number,
  days = 90,
  volatility = 0.02
): Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> {
  const result = []
  let price = basePrice * 0.8 // start 20% lower to show growth
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    const change = (Math.random() - 0.47) * volatility * price
    const open = price
    price = Math.max(price + change, 0.01)
    const high = Math.max(open, price) * (1 + Math.random() * 0.01)
    const low = Math.min(open, price) * (1 - Math.random() * 0.01)
    result.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(Math.random() * 5000000 + 500000),
    })
  }
  return result
}
