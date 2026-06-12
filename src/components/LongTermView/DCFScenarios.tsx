import type { DCFData } from '../../types/fundamental'
import { formatCurrency, formatPct } from '../../lib/utils'

interface Props { dcf: DCFData }

export default function DCFScenarios({ dcf }: Props) {
  const { scenarios, impliedGrowthRate, currentPrice } = dcf

  const colors = {
    Bull: { bar: 'bg-gf-positive', text: 'text-gf-positive', bg: 'bg-gf-positive-bg' },
    Base: { bar: 'bg-gf-accent', text: 'text-gf-accent', bg: 'bg-gf-accent-light' },
    Bear: { bar: 'bg-gf-negative', text: 'text-gf-negative', bg: 'bg-gf-negative-bg' },
  }

  const maxValue = Math.max(...scenarios.map((s) => s.intrinsicValue), currentPrice) * 1.1

  return (
    <div className="space-y-4">
      {/* 3-Scenario DCF */}
      <div className="gf-card p-4">
        <div className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide mb-4">
          Discounted Cash Flow — 3 Scenarios
        </div>

        {/* Bar visualization */}
        <div className="mb-4">
          <div className="flex items-end gap-3 h-24 border-b border-gf-border pb-2">
            {/* Current price bar */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gf-border rounded-t"
                style={{ height: `${(currentPrice / maxValue) * 80}px` }}
              />
              <span className="text-xs text-gf-text-secondary">Current</span>
              <span className="text-xs font-mono font-semibold">{formatCurrency(currentPrice, false)}</span>
            </div>
            {scenarios.map((s) => {
              const c = colors[s.label]
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full ${c.bar} rounded-t transition-all`}
                    style={{ height: `${(s.intrinsicValue / maxValue) * 80}px` }}
                  />
                  <span className="text-xs text-gf-text-secondary">{s.label}</span>
                  <span className={`text-xs font-mono font-semibold ${c.text}`}>
                    {formatCurrency(s.intrinsicValue, false)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scenario details */}
        <div className="grid grid-cols-3 gap-2">
          {scenarios.map((s) => {
            const c = colors[s.label]
            return (
              <div key={s.label} className={`rounded p-3 ${c.bg}`}>
                <div className={`text-xs font-semibold ${c.text} mb-2`}>{s.label} Case</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gf-text-secondary">FCF Growth</span>
                    <span className="font-mono">{s.fcfGrowthRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gf-text-secondary">WACC</span>
                    <span className="font-mono">{s.wacc}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gf-text-secondary">Terminal</span>
                    <span className="font-mono">{s.terminalGrowth}%</span>
                  </div>
                  <div className={`flex justify-between border-t border-current border-opacity-20 pt-1 mt-1 font-semibold ${c.text}`}>
                    <span>Upside</span>
                    <span className="font-mono">{formatPct(s.upsideDownside)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reverse DCF */}
      <div className="gf-card p-4">
        <div className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide mb-2">
          Reverse DCF — Implied Growth Rate
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gf-bg rounded p-3">
            <div className="text-2xl font-bold text-gf-accent font-mono">{impliedGrowthRate.toFixed(1)}%</div>
            <div className="text-xs text-gf-text-secondary mt-0.5">Annual FCF growth implied by today's price</div>
          </div>
          <div className="flex-1 text-sm text-gf-text-secondary leading-relaxed">
            To justify <span className="font-mono text-gf-text">{formatCurrency(currentPrice, false)}</span>, the market expects FCF to grow at ~<span className="font-semibold text-gf-accent">{impliedGrowthRate.toFixed(1)}%/yr</span> for the next 10 years. Is that realistic?
          </div>
        </div>
      </div>
    </div>
  )
}
