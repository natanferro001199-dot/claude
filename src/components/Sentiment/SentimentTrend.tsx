import type { SentimentTrend } from '../../types/sentiment'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  history: number[]
  trend: SentimentTrend
}

export default function SentimentTrendChart({ history, trend }: Props) {
  if (!history.length) return null

  const min = Math.min(...history) - 5
  const max = Math.max(...history) + 5
  const range = max - min || 1
  const w = 240
  const h = 60
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const polyline = pts.join(' ')

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendColor = trend === 'improving' ? 'text-gf-positive' : trend === 'declining' ? 'text-gf-negative' : 'text-gf-neutral-text'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gf-text-secondary">7-Day Sentiment Trend</span>
        <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {trend.charAt(0).toUpperCase() + trend.slice(1)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
        <polyline
          points={polyline}
          fill="none"
          stroke="#1A73E8"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {history.map((v, i) => {
          const x = (i / (history.length - 1)) * w
          const y = h - ((v - min) / range) * h
          return <circle key={i} cx={x} cy={y} r="3" fill="#1A73E8" />
        })}
      </svg>
      <div className="flex justify-between text-xs text-gf-text-secondary mt-1">
        <span>7d ago</span>
        <span>Today: {history[history.length - 1]}</span>
      </div>
    </div>
  )
}
