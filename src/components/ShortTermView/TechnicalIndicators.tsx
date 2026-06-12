import type { TechnicalData } from '../../types/technical'
import { formatNumber } from '../../lib/utils'

interface Props { data: TechnicalData }

const signalColor = (i: string) =>
  i === 'bullish' ? 'text-gf-positive' : i === 'bearish' ? 'text-gf-negative' : 'text-gf-neutral-text'

const signalBg = (i: string) =>
  i === 'bullish' ? 'bg-gf-positive-bg' : i === 'bearish' ? 'bg-gf-negative-bg' : 'bg-gf-neutral'

export default function TechnicalIndicators({ data }: Props) {
  const { indicators, signals, trendStrength, supportLevel, resistanceLevel } = data

  const rsiColor = indicators.rsi14 > 70 ? 'text-gf-negative' : indicators.rsi14 < 30 ? 'text-gf-positive' : 'text-gf-text'
  const rsiWidth = Math.min(indicators.rsi14, 100)

  return (
    <div className="space-y-4">
      {/* RSI */}
      <div className="gf-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">RSI (14)</span>
          <span className={`text-lg font-mono font-semibold ${rsiColor}`}>{formatNumber(indicators.rsi14)}</span>
        </div>
        <div className="relative h-2 bg-gf-bg rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="bg-gf-positive-bg" style={{ width: '30%' }} />
            <div className="bg-gf-neutral" style={{ width: '40%' }} />
            <div className="bg-gf-negative-bg" style={{ width: '30%' }} />
          </div>
          <div
            className="absolute top-0 h-full w-1 bg-gf-text rounded-full transition-all"
            style={{ left: `${rsiWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gf-text-secondary mt-1">
          <span>Oversold (30)</span><span>Neutral</span><span>Overbought (70)</span>
        </div>
      </div>

      {/* MACD */}
      <div className="gf-card p-4">
        <div className="text-sm font-medium mb-2">MACD (12/26/9)</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'MACD', value: indicators.macd.macd },
            { label: 'Signal', value: indicators.macd.signal },
            { label: 'Histogram', value: indicators.macd.histogram },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gf-bg rounded p-2">
              <div className="text-xs text-gf-text-secondary">{label}</div>
              <div className={`text-sm font-mono font-semibold ${value >= 0 ? 'text-gf-positive' : 'text-gf-negative'}`}>
                {value >= 0 ? '+' : ''}{formatNumber(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="gf-card p-4">
        <div className="text-sm font-medium mb-2">Bollinger Bands (20, 2σ)</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Upper', value: indicators.bollingerBands.upper, color: 'text-gf-negative' },
            { label: 'Middle', value: indicators.bollingerBands.middle, color: 'text-gf-text' },
            { label: 'Lower', value: indicators.bollingerBands.lower, color: 'text-gf-positive' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gf-bg rounded p-2">
              <div className="text-xs text-gf-text-secondary">{label}</div>
              <div className={`text-sm font-mono font-semibold ${color}`}>${formatNumber(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="gf-card p-4">
        <div className="text-sm font-medium mb-2">Support & Resistance</div>
        <div className="flex gap-3">
          <div className="flex-1 bg-gf-positive-bg rounded p-2 text-center">
            <div className="text-xs text-gf-positive">Support</div>
            <div className="text-sm font-mono font-semibold text-gf-positive">${supportLevel.toFixed(2)}</div>
          </div>
          <div className="flex-1 bg-gf-negative-bg rounded p-2 text-center">
            <div className="text-xs text-gf-negative">Resistance</div>
            <div className="text-sm font-mono font-semibold text-gf-negative">${resistanceLevel.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Signal summary */}
      <div className="gf-card p-4">
        <div className="text-sm font-medium mb-3">Signal Summary</div>
        <div className="space-y-2">
          {signals.map((signal) => (
            <div key={signal.label} className="flex items-center justify-between">
              <span className="text-sm text-gf-text-secondary">{signal.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{signal.value}</span>
                <span className={`badge text-xs ${signalBg(signal.interpretation)} ${signalColor(signal.interpretation)}`}>
                  {signal.interpretation}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gf-border flex items-center justify-between">
          <span className="text-sm text-gf-text-secondary">Trend Strength</span>
          <span className={`badge font-medium ${
            trendStrength.includes('strong') ? 'text-gf-positive bg-gf-positive-bg' :
            trendStrength === 'neutral' ? 'text-gf-neutral-text bg-gf-neutral' : 'text-gf-negative bg-gf-negative-bg'
          }`}>
            {trendStrength.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
