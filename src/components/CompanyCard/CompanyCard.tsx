import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lock } from 'lucide-react'
import type { CompanyData } from '../../types/company'
import type { SentimentData } from '../../types/sentiment'
import { formatCurrency, formatPct, getChangeColor, getScoreBg } from '../../lib/utils'
import SentimentBadge from '../Sentiment/SentimentBadge'

interface Props {
  company: CompanyData
  sentiment: SentimentData | null
  analysisMode: 'short-term' | 'long-term'
  onClick: () => void
}

export default function CompanyCard({ company, sentiment, analysisMode, onClick }: Props) {
  const { company: meta, price, scores } = company

  if (meta.isPlaceholder) {
    return (
      <div className="gf-card p-4 opacity-75 border-dashed">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gf-text">{meta.ticker}</span>
              <Lock className="w-3 h-3 text-gf-text-secondary" />
            </div>
            <p className="text-xs text-gf-text-secondary mt-0.5">{meta.name}</p>
          </div>
          <span className="badge bg-gf-neutral text-gf-neutral-text text-xs">Private</span>
        </div>
        <p className="text-xs text-gf-text-secondary line-clamp-2 mb-3">{meta.description}</p>
        <div className="text-xs text-gf-text-secondary italic">Market data unavailable — IPO pending</div>
      </div>
    )
  }

  const changeColor = getChangeColor(price.priceChange)
  const TrendIcon = price.priceChange > 0 ? TrendingUp : price.priceChange < 0 ? TrendingDown : Minus
  const displayScore = analysisMode === 'short-term' ? scores.technicalScore : scores.fundamentalScore
  const scoreLabel = analysisMode === 'short-term' ? 'Tech Score' : 'Fund. Score'

  return (
    <button
      onClick={onClick}
      className="gf-card p-4 text-left w-full hover:cursor-pointer fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gf-text">{meta.ticker}</span>
            {price.dataConfidence === 'low' && (
              <span title="Limited data coverage"><AlertTriangle className="w-3 h-3 text-yellow-500" /></span>
            )}
          </div>
          <p className="text-xs text-gf-text-secondary">{meta.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-semibold">{formatCurrency(price.price, false)}</div>
          <div className={`text-xs font-mono flex items-center justify-end gap-0.5 ${changeColor}`}>
            <TrendIcon className="w-3 h-3" />
            {formatPct(price.priceChangePct)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gf-text-secondary line-clamp-2 mb-3">{meta.description}</p>

      {/* Metrics row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {sentiment && (
            <SentimentBadge label={sentiment.label} score={sentiment.sentimentScore} />
          )}
          <span className="badge bg-gf-neutral text-gf-text-secondary text-xs">
            {meta.sector === 'aerospace' ? '🚀 Space' : '🖥 DC'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-xs text-gf-text-secondary">{scoreLabel}</div>
            <span className={`badge text-xs font-semibold ${getScoreBg(displayScore)}`}>
              {displayScore}
            </span>
          </div>
          <div className="text-center">
            <div className="text-xs text-gf-text-secondary">Mkt Cap</div>
            <div className="text-xs font-mono">{formatCurrency(price.marketCap)}</div>
          </div>
        </div>
      </div>

      {/* Piotroski + Altman mini badges */}
      <div className="mt-2 flex gap-1.5">
        <span className="text-xs text-gf-text-secondary">F-Score:</span>
        <span className={`text-xs font-semibold ${
          scores.piotroskiScore >= 7 ? 'text-gf-positive' :
          scores.piotroskiScore >= 4 ? 'text-yellow-600' : 'text-gf-negative'
        }`}>{scores.piotroskiScore}/9</span>
        {scores.altmanZScore !== null && (
          <>
            <span className="text-xs text-gf-text-secondary ml-2">Z-Score:</span>
            <span className={`text-xs font-semibold ${
              scores.altmanZScore >= 3 ? 'text-gf-positive' :
              scores.altmanZScore >= 1.8 ? 'text-yellow-600' : 'text-gf-negative'
            }`}>{scores.altmanZScore.toFixed(1)}</span>
          </>
        )}
      </div>
    </button>
  )
}
