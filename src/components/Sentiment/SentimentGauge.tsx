import type { SentimentLabel } from '../../types/sentiment'

interface Props {
  score: number
  label: SentimentLabel
  confidence: number
  articlesAnalyzed: number
}

export default function SentimentGauge({ score, label, confidence, articlesAnalyzed }: Props) {
  // Semicircle gauge: 0-100 maps to -180deg to 0deg
  const rotation = -180 + (score / 100) * 180
  const color = label === 'Bullish' ? '#137333' : label === 'Bearish' ? '#C5221F' : '#80868B'

  return (
    <div className="text-center">
      <div className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide mb-3">
        News Sentiment (FinBERT + RF)
      </div>

      {/* Gauge SVG */}
      <div className="flex justify-center mb-2">
        <svg width="160" height="90" viewBox="0 0 160 90">
          {/* Background arc */}
          <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#F1F3F4" strokeWidth="14" strokeLinecap="round" />
          {/* Bear zone */}
          <path d="M 15 80 A 65 65 0 0 1 58 27" fill="none" stroke="#FCE8E6" strokeWidth="14" strokeLinecap="round" />
          {/* Neutral zone */}
          <path d="M 58 27 A 65 65 0 0 1 102 27" fill="none" stroke="#F1F3F4" strokeWidth="14" />
          {/* Bull zone */}
          <path d="M 102 27 A 65 65 0 0 1 145 80" fill="none" stroke="#E6F4EA" strokeWidth="14" strokeLinecap="round" />

          {/* Score indicator needle */}
          <g transform={`rotate(${rotation}, 80, 80)`}>
            <line x1="80" y1="80" x2="80" y2="22" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="80" r="5" fill={color} />
          </g>

          {/* Labels */}
          <text x="12" y="92" fontSize="9" fill="#C5221F" textAnchor="middle">Bear</text>
          <text x="80" y="16" fontSize="9" fill="#80868B" textAnchor="middle">Neutral</text>
          <text x="148" y="92" fontSize="9" fill="#137333" textAnchor="middle">Bull</text>
        </svg>
      </div>

      {/* Score number */}
      <div className="text-3xl font-bold font-mono" style={{ color }}>{score}</div>
      <div className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</div>

      {/* Meta */}
      <div className="mt-3 flex justify-center gap-4 text-xs text-gf-text-secondary">
        <span>Confidence: <strong>{(confidence * 100).toFixed(0)}%</strong></span>
        <span>Articles: <strong>{articlesAnalyzed}</strong></span>
      </div>
    </div>
  )
}
