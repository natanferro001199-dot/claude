export interface MACDData {
  macd: number
  signal: number
  histogram: number
}

export interface BollingerBands {
  upper: number
  middle: number
  lower: number
}

export interface TechnicalIndicators {
  rsi14: number
  sma20: number
  sma50: number
  sma200: number
  macd: MACDData
  bollingerBands: BollingerBands
  volumeMA20: number
  atr14: number
}

export interface TechnicalSignal {
  label: string
  value: string
  interpretation: 'bullish' | 'bearish' | 'neutral'
}

export interface TechnicalData {
  indicators: TechnicalIndicators
  signals: TechnicalSignal[]
  trendStrength: 'strong-up' | 'up' | 'neutral' | 'down' | 'strong-down'
  supportLevel: number
  resistanceLevel: number
}
