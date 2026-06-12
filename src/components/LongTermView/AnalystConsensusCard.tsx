import type { AnalystConsensus } from '../../types/fundamental'
import { formatCurrency, getChangeColor } from '../../lib/utils'

interface Props {
  consensus: AnalystConsensus
  currentPrice: number | null
}

function scoreStyle(score: number): string {
  if (score > 60) return 'bg-green-50 text-gf-positive'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-gf-negative'
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export default function AnalystConsensusCard({ consensus, currentPrice }: Props) {
  const {
    analystScore, analystLabel, recommendationMean,
    targetMeanPrice, targetHighPrice, targetLowPrice,
    targetUpside, analystCount,
  } = consensus

  // Price target bar positions (clamped to [2,98] to avoid overflow)
  const showPriceBar = currentPrice != null && targetMeanPrice != null
    && targetHighPrice != null && targetLowPrice != null
    && targetHighPrice > targetLowPrice

  let currentPct = 50
  let meanPct = 50
  if (showPriceBar) {
    const span = targetHighPrice! - targetLowPrice!
    currentPct = clamp(((currentPrice! - targetLowPrice!) / span) * 100, 2, 98)
    meanPct    = clamp(((targetMeanPrice! - targetLowPrice!) / span) * 100, 2, 98)
  }

  // Rec-mean needle (1=best → 0%, 5=worst → 100%)
  const showRecBar = recommendationMean != null
  const needlePct = showRecBar
    ? clamp(((recommendationMean! - 1) / 4) * 100, 2, 98)
    : 50

  return (
    <div className="gf-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">
          Analyst Consensus · RF Score
        </span>
        <span className="text-xs text-gf-text-secondary">
          Based on {analystCount} analyst opinion{analystCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Score + Upside */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-start gap-1">
          <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${scoreStyle(analystScore)}`}>
            {analystScore}
          </span>
          <span className={`text-sm font-semibold ${analystScore > 60 ? 'text-gf-positive' : analystScore >= 40 ? 'text-yellow-600' : 'text-gf-negative'}`}>
            {analystLabel}
          </span>
        </div>
        {targetUpside != null && (
          <div className="flex flex-col items-end justify-center">
            <span className={`text-3xl font-bold font-mono ${getChangeColor(targetUpside)}`}>
              {targetUpside > 0 ? '+' : ''}{targetUpside.toFixed(1)}%
            </span>
            <span className="text-xs text-gf-text-secondary">to analyst target</span>
          </div>
        )}
      </div>

      {/* Price target bar */}
      {showPriceBar && (
        <div>
          <div className="text-xs text-gf-text-secondary mb-2">Price Target Range</div>
          <div className="relative h-2 bg-gf-bg rounded-full mx-1">
            {/* Fill to mean */}
            <div
              className="absolute h-full bg-green-200 rounded-full"
              style={{ left: 0, width: `${meanPct}%` }}
            />
            {/* Mean target marker */}
            <div
              className="absolute w-1 h-4 bg-gf-positive -top-1 -translate-x-1/2 rounded-sm"
              style={{ left: `${meanPct}%` }}
            />
            {/* Current price dot */}
            {currentPrice != null && (
              <div
                className="absolute w-3 h-3 bg-gf-accent rounded-full border-2 border-white -top-0.5 -translate-x-1/2 shadow-sm"
                style={{ left: `${currentPct}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs font-mono">
            <span className="text-gf-text-secondary">{formatCurrency(targetLowPrice!, false)}</span>
            <div className="text-center">
              <div className="font-semibold text-gf-positive">{formatCurrency(targetMeanPrice!, false)}</div>
              <div className="text-gf-text-secondary">Target</div>
            </div>
            <span className="text-gf-text-secondary">{formatCurrency(targetHighPrice!, false)}</span>
          </div>
          {currentPrice != null && (
            <div className="text-center mt-1 text-xs text-gf-text-secondary">
              Current: <span className="font-mono font-semibold text-gf-accent">{formatCurrency(currentPrice, false)}</span>
            </div>
          )}
        </div>
      )}

      {/* Recommendation mean bar */}
      {showRecBar && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gf-text-secondary">Analyst Rating Mean</span>
            <span className="text-sm font-mono font-semibold">{recommendationMean!.toFixed(1)}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden flex">
            <div className="flex-1 bg-green-100" />
            <div className="flex-1 bg-red-50" />
            <div
              className="absolute top-0.5 bottom-0.5 w-1 bg-gf-text rounded-full -translate-x-1/2"
              style={{ left: `${needlePct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gf-text-secondary">
            <span>1 · Strong Buy</span>
            <span>3 · Hold</span>
            <span>5 · Strong Sell</span>
          </div>
        </div>
      )}
    </div>
  )
}
