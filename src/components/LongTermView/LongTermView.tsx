import type { CompanyData } from '../../types/company'
import type { FundamentalData } from '../../types/fundamental'
import type { SentimentData } from '../../types/sentiment'
import ValuationTable from './ValuationTable'
import DCFScenarios from './DCFScenarios'
import FinancialStatements from './FinancialStatements'
import SectorKPIsPanel from './SectorKPIs'
import NewsFeed from '../Sentiment/NewsFeed'
import CatalystScore from '../Sentiment/CatalystScore'
import AnalystConsensusCard from './AnalystConsensusCard'

interface Props {
  company: CompanyData
  fundamental: FundamentalData | null
  sentiment: SentimentData | null
}

export default function LongTermView({ company, fundamental, sentiment }: Props) {
  if (!fundamental) {
    return (
      <div className="gf-card p-8 text-center text-gf-text-secondary">
        Fundamental data not available for this company.
      </div>
    )
  }

  const earningsNews = sentiment?.topHeadlines.filter((a) => a.isFilingRelated) ?? []

  return (
    <div className="space-y-6">
      {fundamental.analystConsensus != null && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Analyst Consensus</h3>
          <AnalystConsensusCard
            consensus={fundamental.analystConsensus}
            currentPrice={company.price.price}
          />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Valuation */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Valuation & Financial Health</h3>
          <ValuationTable data={fundamental} company={company} />
        </div>

        {/* Right: DCF */}
        <div>
          <h3 className="text-sm font-semibold mb-3">DCF Analysis</h3>
          <DCFScenarios dcf={fundamental.dcf} />

          {/* Sector KPIs */}
          <h3 className="text-sm font-semibold mb-3 mt-4">Sector-Specific KPIs</h3>
          <SectorKPIsPanel kpis={fundamental.sectorKpis} sector={company.company.sector} />
        </div>
      </div>

      {/* Financial Statements — Google Finance style */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Financial Statements</h3>
        <FinancialStatements data={fundamental} />
      </div>

      {/* Catalyst Momentum */}
      {sentiment?.catalystScore !== undefined && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Catalyst Momentum</h3>
          <CatalystScore score={sentiment.catalystScore} events={sentiment.catalystEvents} />
        </div>
      )}

      {/* Earnings & Filings News Feed */}
      {earningsNews.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Earnings & SEC Filings</h3>
          <NewsFeed articles={earningsNews} filterFilingsOnly={true} />
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gf-text-secondary text-center">
        Long-Term view shows valuation and fundamental analysis only. No technical indicators are displayed here.
      </p>
    </div>
  )
}
