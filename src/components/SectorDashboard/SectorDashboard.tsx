import { useQuery } from '@tanstack/react-query'
import { loadAllCompanies, loadSectorSentiment } from '../../lib/dataLoader'
import SectorSentimentBar from '../Sentiment/SectorSentimentBar'
import { formatCurrency, formatPct, formatMultiple, getChangeColor, getScoreColor } from '../../lib/utils'
import type { CompanyData } from '../../types/company'
import type { FundamentalData } from '../../types/fundamental'

interface LoadedCompany {
  data: CompanyData
  technical: unknown
  fundamental: FundamentalData | null
}

export default function SectorDashboard() {
  const { data: companies, isLoading } = useQuery({ queryKey: ['companies'], queryFn: loadAllCompanies })
  const { data: aeroSentiment } = useQuery({
    queryKey: ['sector-sentiment', 'aerospace'],
    queryFn: () => loadSectorSentiment('aerospace'),
  })
  const { data: dcSentiment } = useQuery({
    queryKey: ['sector-sentiment', 'datacenters'],
    queryFn: () => loadSectorSentiment('datacenters'),
  })

  if (isLoading || !companies) return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="h-32 bg-gf-border animate-pulse rounded-lg" />
    </div>
  )

  const nonPlaceholder = (companies as LoadedCompany[]).filter(({ data }) => !data.company.isPlaceholder)
  const aerospace = nonPlaceholder.filter(({ data }) => data.company.sector === 'aerospace')
  const datacenters = nonPlaceholder.filter(({ data }) => data.company.sector === 'datacenters')

  const renderTable = (items: LoadedCompany[], title: string) => (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="gf-card overflow-x-auto">
        <table className="w-full gf-table whitespace-nowrap">
          <thead>
            <tr>
              <th className="text-left">Ticker</th>
              <th>Price</th>
              <th>Change</th>
              <th>Mkt Cap</th>
              <th>P/S</th>
              <th>EV/Rev</th>
              <th>Rev Growth</th>
              <th>Gross Mgn</th>
              <th>Tech Score</th>
              <th>Fund Score</th>
              <th>F-Score</th>
              <th>Z-Score</th>
              <th>Analyst</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ data, fundamental }) => {
              const { company, price, scores } = data
              const f = fundamental
              return (
                <tr key={company.ticker}>
                  <td>
                    <div className="font-semibold text-gf-text">{company.ticker}</div>
                    <div className="text-xs text-gf-text-secondary">{company.name.split(' ').slice(0, 2).join(' ')}</div>
                  </td>
                  <td className="font-mono">{formatCurrency(price.price, false)}</td>
                  <td className={`font-mono ${getChangeColor(price.priceChangePct)}`}>
                    {formatPct(price.priceChangePct)}
                  </td>
                  <td className="font-mono">{formatCurrency(price.marketCap)}</td>
                  <td className="font-mono">{formatMultiple(f?.valuation.ps ?? null)}</td>
                  <td className="font-mono">{formatMultiple(f?.valuation.evRevenue ?? null)}</td>
                  <td className={`font-mono ${getChangeColor(f?.growth.revenueGrowthYoY ?? null)}`}>
                    {formatPct(f?.growth.revenueGrowthYoY ?? null)}
                  </td>
                  <td className={`font-mono ${getChangeColor(f?.health.grossMargin ?? null)}`}>
                    {formatPct(f?.health.grossMargin ?? null)}
                  </td>
                  <td>
                    <span className={`badge text-xs font-semibold ${getScoreColor(scores.technicalScore)}`}>
                      {scores.technicalScore}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs font-semibold ${getScoreColor(scores.fundamentalScore)}`}>
                      {scores.fundamentalScore}
                    </span>
                  </td>
                  <td className={`font-mono font-semibold ${
                    scores.piotroskiScore >= 7 ? 'text-gf-positive' :
                    scores.piotroskiScore >= 4 ? 'text-yellow-600' : 'text-gf-negative'
                  }`}>{scores.piotroskiScore}/9</td>
                  <td className={`font-mono font-semibold ${
                    scores.altmanZScore === null ? '' :
                    scores.altmanZScore >= 3 ? 'text-gf-positive' :
                    scores.altmanZScore >= 1.8 ? 'text-yellow-600' : 'text-gf-negative'
                  }`}>{scores.altmanZScore?.toFixed(1) ?? 'N/A'}</td>
                  <td>
                    {f?.analystConsensus != null ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`badge text-xs font-semibold ${
                          f.analystConsensus.analystScore > 60 ? 'bg-green-50 text-gf-positive' :
                          f.analystConsensus.analystScore >= 40 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-gf-negative'
                        }`}>
                          {f.analystConsensus.analystScore}
                        </span>
                        <span className="text-xs text-gf-text-secondary">{f.analystConsensus.analystLabel}</span>
                      </div>
                    ) : (
                      <span className="text-gf-text-secondary text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-6">Sector Comparison Dashboard</h1>

      {/* Sentiment bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {aeroSentiment && <SectorSentimentBar sectorSentiment={aeroSentiment} />}
        {dcSentiment && <SectorSentimentBar sectorSentiment={dcSentiment} />}
      </div>

      {renderTable(aerospace, '🚀 New Space — Comparative Metrics')}
      {renderTable(datacenters, '🖥 AI Data Centers — Comparative Metrics')}
    </div>
  )
}
