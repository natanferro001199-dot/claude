export type Sector = 'aerospace' | 'datacenters'
export type AnalysisMode = 'short-term' | 'long-term'
export type MarketCapCategory = 'micro' | 'small' | 'mid' | 'large'

export interface CompanyMeta {
  ticker: string
  name: string
  sector: Sector
  exchange: string
  description: string
  founded: number
  employees?: number
  website?: string
  isPlaceholder?: boolean
}

export interface PriceData {
  price: number
  priceChange: number
  priceChangePct: number
  open: number
  high52w: number
  low52w: number
  volume: number
  avgVolume30d: number
  marketCap: number
  marketCapCategory: MarketCapCategory
  lastUpdated: string
  dataConfidence: 'high' | 'medium' | 'low'
}

export interface OHLCVBar {
  time: string   // 'YYYY-MM-DD'
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface CompanyScores {
  technicalScore: number       // 0-100
  fundamentalScore: number     // 0-100
  piotroskiScore: number       // 0-9
  altmanZScore: number | null  // null if not applicable (pre-revenue)
  ohlsonScore?: number         // 0-100 probability of financial distress (Ohlson 1980)
  compositeScore: number       // weighted average
}

export interface CompanyData {
  company: CompanyMeta
  price: PriceData
  scores: CompanyScores
  priceHistory: OHLCVBar[]
}
