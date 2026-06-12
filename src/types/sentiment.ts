export type SentimentLabel = 'Bullish' | 'Neutral' | 'Bearish'
export type SentimentTrend = 'improving' | 'stable' | 'declining'

export interface NewsArticle {
  title: string
  source: string
  date: string
  url: string
  sentimentLabel: SentimentLabel
  sentimentScore: number   // -1.0 to 1.0
  confidence: number       // 0.0 to 1.0
  isFilingRelated: boolean // 8-K, earnings, etc.
}

export interface SentimentData {
  ticker: string
  sentimentScore: number       // 0-100
  label: SentimentLabel
  confidence: number
  trend: SentimentTrend
  articlesAnalyzed: number
  lastUpdated: string
  modelMae7d: number | null    // MAE vs next-day price Δ
  topHeadlines: NewsArticle[]
  scoreHistory7d: number[]
}

export interface SectorSentiment {
  sector: 'aerospace' | 'datacenters'
  aggregateScore: number
  label: SentimentLabel
  trend: SentimentTrend
  companiesScores: { ticker: string; score: number; label: SentimentLabel }[]
  lastUpdated: string
}
