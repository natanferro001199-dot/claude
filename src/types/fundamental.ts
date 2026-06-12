export type SectorType = 'aerospace' | 'datacenters'

export interface ValuationMultiples {
  pe: number | null
  forwardPe: number | null
  evEbitda: number | null
  evRevenue: number | null
  ps: number | null
  pb: number | null
  pfcf: number | null
}

export interface FinancialHealth {
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
  roic: number | null
  roe: number | null
  debtToEquity: number | null
  currentRatio: number | null
  quickRatio: number | null
  fcfYield: number | null
  interestCoverage: number | null
}

export interface FinancialGrowth {
  revenueGrowthYoY: number | null
  revenueGrowth3Y: number | null
  ebitdaGrowthYoY: number | null
  epsGrowthYoY: number | null
  fcfGrowthYoY: number | null
}

// Income Statement (annual)
export interface IncomeStatement {
  years: string[]
  revenue: (number | null)[]
  grossProfit: (number | null)[]
  operatingIncome: (number | null)[]
  ebitda: (number | null)[]
  netIncome: (number | null)[]
  eps: (number | null)[]
}

// Balance Sheet (annual)
export interface BalanceSheet {
  years: string[]
  cash: (number | null)[]
  totalAssets: (number | null)[]
  totalDebt: (number | null)[]
  totalEquity: (number | null)[]
  sharesOutstanding: (number | null)[]
}

// Cash Flow Statement (annual)
export interface CashFlowStatement {
  years: string[]
  operatingCF: (number | null)[]
  capex: (number | null)[]
  freeCashFlow: (number | null)[]
  financingCF: (number | null)[]
}

// Income Statement (quarterly — last 8 quarters)
export interface QuarterlyIncomeStatement {
  quarters: string[]
  revenue: (number | null)[]
  grossProfit: (number | null)[]
  operatingIncome: (number | null)[]
  netIncome: (number | null)[]
  eps: (number | null)[]
}

// Cash Flow Statement (quarterly — last 8 quarters)
export interface QuarterlyCashFlow {
  quarters: string[]
  operatingCF: (number | null)[]
  capex: (number | null)[]
  freeCashFlow: (number | null)[]
}

export interface DCFScenario {
  label: 'Bull' | 'Base' | 'Bear'
  fcfGrowthRate: number
  wacc: number
  terminalGrowth: number
  intrinsicValue: number
  upsideDownside: number
}

export interface DCFData {
  scenarios: [DCFScenario, DCFScenario, DCFScenario]
  impliedGrowthRate: number   // reverse DCF: what growth rate justifies today's price
  currentPrice: number
}

// Historical valuation bands (10Y P/E range)
export interface ValuationBands {
  metric: 'pe' | 'ps' | 'evEbitda'
  current: number | null
  min5y: number | null
  max5y: number | null
  median5y: number | null
  percentileRank: number | null  // where current sits in 5Y range 0-100
}

// Aerospace-specific KPIs
export interface AerospaceKPIs {
  backlogOrders: number | null     // $B
  bookToBill: number | null
  govtRevenuePercent: number | null
  rdPercentRevenue: number | null
  launchCount12m: number | null
}

// Data Center-specific KPIs
export interface DataCenterKPIs {
  occupancyRate: number | null     // %
  pue: number | null               // Power Usage Effectiveness
  revenuePerMW: number | null      // $M per MW
  adjustedEbitdaMargin: number | null
  hyperscalerConcentration: number | null  // % from top 3 customers
}

export type SectorKPIs = AerospaceKPIs | DataCenterKPIs

export interface FundamentalData {
  valuation: ValuationMultiples
  health: FinancialHealth
  growth: FinancialGrowth
  incomeStatement: IncomeStatement
  balanceSheet: BalanceSheet
  cashFlow: CashFlowStatement
  incomeStatementQ?: QuarterlyIncomeStatement
  cashFlowQ?: QuarterlyCashFlow
  dcf: DCFData
  valuationBands: ValuationBands[]
  sectorKpis: SectorKPIs
  ohlsonScore?: number   // 0-100 probability of financial distress (Ohlson 1980)
}
