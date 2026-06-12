import type { FundamentalData } from '../../types/fundamental'
import type { CompanyData } from '../../types/company'
import { formatMultiple, formatPct, formatNumber, getChangeColor } from '../../lib/utils'

interface Props { data: FundamentalData; company: CompanyData }

export default function ValuationTable({ data, company }: Props) {
  const { valuation, health, growth } = data
  const price = company.price.price

  const rows = [
    { label: 'P/E (TTM)', value: formatMultiple(valuation.pe), note: 'Price / Earnings' },
    { label: 'Forward P/E', value: formatMultiple(valuation.forwardPe), note: 'Based on consensus estimates' },
    { label: 'EV/EBITDA', value: formatMultiple(valuation.evEbitda), note: 'Enterprise Value / EBITDA' },
    { label: 'EV/Revenue', value: formatMultiple(valuation.evRevenue), note: 'Enterprise Value / Revenue' },
    { label: 'P/S', value: formatMultiple(valuation.ps), note: 'Price / Sales' },
    { label: 'P/B', value: formatMultiple(valuation.pb), note: 'Price / Book Value' },
    { label: 'P/FCF', value: formatMultiple(valuation.pfcf), note: 'Price / Free Cash Flow' },
  ]

  const healthRows = [
    { label: 'Gross Margin', value: formatPct(health.grossMargin), raw: health.grossMargin },
    { label: 'Operating Margin', value: formatPct(health.operatingMargin), raw: health.operatingMargin },
    { label: 'Net Margin', value: formatPct(health.netMargin), raw: health.netMargin },
    { label: 'ROIC', value: formatPct(health.roic), raw: health.roic },
    { label: 'ROE', value: formatPct(health.roe), raw: health.roe },
    { label: 'Debt/Equity', value: formatNumber(health.debtToEquity), raw: null },
    { label: 'Current Ratio', value: formatNumber(health.currentRatio), raw: null },
    { label: 'FCF Yield', value: formatPct(health.fcfYield), raw: health.fcfYield },
  ]

  const growthRows = [
    { label: 'Revenue Growth YoY', value: formatPct(growth.revenueGrowthYoY), raw: growth.revenueGrowthYoY },
    { label: 'Revenue Growth 3Y CAGR', value: formatPct(growth.revenueGrowth3Y), raw: growth.revenueGrowth3Y },
    { label: 'EBITDA Growth YoY', value: formatPct(growth.ebitdaGrowthYoY), raw: growth.ebitdaGrowthYoY },
    { label: 'EPS Growth YoY', value: formatPct(growth.epsGrowthYoY), raw: growth.epsGrowthYoY },
    { label: 'FCF Growth YoY', value: formatPct(growth.fcfGrowthYoY), raw: growth.fcfGrowthYoY },
  ]

  return (
    <div className="space-y-4">
      {/* Valuation Multiples */}
      <div className="gf-card overflow-hidden">
        <div className="px-4 py-2 bg-gf-bg border-b border-gf-border">
          <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">Valuation Multiples</span>
        </div>
        <table className="w-full gf-table">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="font-normal text-gf-text">{row.label}</td>
                <td className="font-mono font-medium">{row.value}</td>
                <td className="text-gf-text-secondary text-xs hidden sm:table-cell">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Health */}
      <div className="gf-card overflow-hidden">
        <div className="px-4 py-2 bg-gf-bg border-b border-gf-border">
          <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">Financial Health</span>
        </div>
        <table className="w-full gf-table">
          <tbody>
            {healthRows.map((row) => (
              <tr key={row.label}>
                <td className="font-normal text-gf-text">{row.label}</td>
                <td className={`font-mono font-medium ${row.raw !== null ? getChangeColor(row.raw) : ''}`}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Growth */}
      <div className="gf-card overflow-hidden">
        <div className="px-4 py-2 bg-gf-bg border-b border-gf-border">
          <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">Growth Rates</span>
        </div>
        <table className="w-full gf-table">
          <tbody>
            {growthRows.map((row) => (
              <tr key={row.label}>
                <td className="font-normal text-gf-text">{row.label}</td>
                <td className={`font-mono font-medium ${row.raw !== null ? getChangeColor(row.raw) : ''}`}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Composite Scores */}
      <div className="gf-card p-4">
        <div className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide mb-3">Quality Scores</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gf-bg rounded p-3 text-center">
            <div className="text-xs text-gf-text-secondary mb-1">Piotroski F-Score</div>
            <div className={`text-2xl font-bold ${
              company.scores.piotroskiScore >= 7 ? 'text-gf-positive' :
              company.scores.piotroskiScore >= 4 ? 'text-yellow-600' : 'text-gf-negative'
            }`}>{company.scores.piotroskiScore}<span className="text-sm font-normal text-gf-text-secondary">/9</span></div>
            <div className="text-xs text-gf-text-secondary mt-1">
              {company.scores.piotroskiScore >= 7 ? 'Strong' : company.scores.piotroskiScore >= 4 ? 'Average' : 'Weak'}
            </div>
          </div>
          <div className="bg-gf-bg rounded p-3 text-center">
            <div className="text-xs text-gf-text-secondary mb-1">Altman Z-Score</div>
            {company.scores.altmanZScore !== null ? (
              <>
                <div className={`text-2xl font-bold ${
                  company.scores.altmanZScore >= 3 ? 'text-gf-positive' :
                  company.scores.altmanZScore >= 1.8 ? 'text-yellow-600' : 'text-gf-negative'
                }`}>{company.scores.altmanZScore.toFixed(1)}</div>
                <div className="text-xs text-gf-text-secondary mt-1">
                  {company.scores.altmanZScore >= 3 ? 'Safe' : company.scores.altmanZScore >= 1.8 ? 'Grey Zone' : 'Distress'}
                </div>
              </>
            ) : <div className="text-sm text-gf-text-secondary">N/A</div>}
          </div>
        </div>
      </div>

      {/* Valuation Bands */}
      {data.valuationBands?.length > 0 && (
        <div className="gf-card p-4">
          <div className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide mb-3">
            Historical Valuation Bands (5Y)
          </div>
          {data.valuationBands.map((band) => (
            <div key={band.metric} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium uppercase">{band.metric}</span>
                <span className="text-gf-text-secondary">
                  Current: <span className="font-mono font-semibold text-gf-text">{formatMultiple(band.current)}</span>
                  {' '}(5Y median: {formatMultiple(band.median5y)})
                </span>
              </div>
              <div className="relative h-2 bg-gf-bg rounded-full border border-gf-border">
                {band.percentileRank !== null && (
                  <div
                    className="absolute top-0 h-full w-2 -translate-x-1 bg-gf-accent rounded-full"
                    style={{ left: `${band.percentileRank}%` }}
                    title={`${band.percentileRank}th percentile vs 5Y range`}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gf-text-secondary mt-0.5">
                <span>Low: {formatMultiple(band.min5y)}</span>
                <span className="text-xs text-gf-text-secondary">
                  {band.percentileRank !== null ? `${band.percentileRank}th %ile` : ''}
                </span>
                <span>High: {formatMultiple(band.max5y)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
