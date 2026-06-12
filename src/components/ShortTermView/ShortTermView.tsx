import type { CompanyData, OHLCVBar } from '../../types/company'
import type { TechnicalData } from '../../types/technical'
import type { SentimentData } from '../../types/sentiment'
import PriceChart from './PriceChart'
import TechnicalIndicators from './TechnicalIndicators'
import SentimentGauge from '../Sentiment/SentimentGauge'
import SentimentTrend from '../Sentiment/SentimentTrend'
import CatalystScore from '../Sentiment/CatalystScore'
import NewsFeed from '../Sentiment/NewsFeed'
import { generateMockPriceHistory } from '../../lib/utils'

interface Props {
  company: CompanyData
  technical: TechnicalData | null
  sentiment: SentimentData | null
}

export default function ShortTermView({ company, technical, sentiment }: Props) {
  const priceHistory: OHLCVBar[] = company.priceHistory?.length
    ? company.priceHistory
    : generateMockPriceHistory(company.price.price)

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <div className="gf-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Price Chart
          <span className="badge bg-gf-accent-light text-gf-accent text-xs">Candles + Volume</span>
        </h3>
        <PriceChart
          data={priceHistory}
          sma20={technical?.indicators.sma20}
          sma50={technical?.indicators.sma50}
          sma200={technical?.indicators.sma200}
          ticker={company.company.ticker}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technical Indicators */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Technical Indicators</h3>
          {technical ? (
            <TechnicalIndicators data={technical} />
          ) : (
            <div className="gf-card p-4 text-sm text-gf-text-secondary">
              Technical data not available for this company.
            </div>
          )}
        </div>

        {/* Sentiment */}
        <div>
          <h3 className="text-sm font-semibold mb-3">News Sentiment</h3>
          {sentiment ? (
            <div className="space-y-3">
              <div className="gf-card p-4">
                <SentimentGauge
                  score={sentiment.sentimentScore}
                  label={sentiment.label}
                  confidence={sentiment.confidence}
                  articlesAnalyzed={sentiment.articlesAnalyzed}
                />
              </div>
              <div className="gf-card p-4">
                <SentimentTrend history={sentiment.scoreHistory7d} trend={sentiment.trend} />
              </div>
              <CatalystScore score={sentiment.catalystScore} events={sentiment.catalystEvents} />
              <NewsFeed articles={sentiment.topHeadlines} filterFilingsOnly={false} />
            </div>
          ) : (
            <div className="gf-card p-4 text-sm text-gf-text-secondary">
              Sentiment data unavailable.
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gf-text-secondary text-center">
        Short-Term view shows technical analysis only. No fundamental or valuation metrics are displayed here.
      </p>
    </div>
  )
}
