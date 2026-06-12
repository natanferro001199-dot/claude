import type { SectorSentiment } from '../../types/sentiment'
import { getSentimentColor, getSentimentBg } from '../../lib/utils'

interface Props { sectorSentiment: SectorSentiment }

export default function SectorSentimentBar({ sectorSentiment }: Props) {
  const { companiesScores, aggregateScore, label } = sectorSentiment
  const sorted = [...companiesScores].sort((a, b) => b.score - a.score)

  return (
    <div className="gf-card p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold">
          {sectorSentiment.sector === 'aerospace' ? '🚀 New Space' : '🖥 AI Data Centers'} Sentiment
        </span>
        <span className={`badge font-semibold ${getSentimentBg(label)}`}>
          Sector: {aggregateScore} — {label}
        </span>
      </div>
      <div className="space-y-2">
        {sorted.map(({ ticker, score, label: l }) => (
          <div key={ticker} className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold w-14 shrink-0">{ticker}</span>
            <div className="flex-1 bg-gf-bg rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  l === 'Bullish' ? 'bg-gf-positive' : l === 'Bearish' ? 'bg-gf-negative' : 'bg-gf-border'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-mono font-semibold w-8 text-right ${getSentimentColor(l)}`}>{score}</span>
            <span className={`badge text-xs w-16 justify-center ${getSentimentBg(l)}`}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
