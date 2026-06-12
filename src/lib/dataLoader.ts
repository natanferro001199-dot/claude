import type { CompanyData } from '../types/company'
import type { TechnicalData } from '../types/technical'
import type { FundamentalData } from '../types/fundamental'
import type { SentimentData, SectorSentiment } from '../types/sentiment'
import { generateMockPriceHistory } from './utils'

const BASE = import.meta.env.BASE_URL ?? '/'

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

type RawCompanyFile = CompanyData & {
  technical?: TechnicalData
  fundamental?: FundamentalData
}

export async function loadCompany(sector: string, ticker: string): Promise<{
  data: CompanyData
  technical: TechnicalData | null
  fundamental: FundamentalData | null
}> {
  const raw = await fetchJSON<RawCompanyFile>(`data/${sector}/${ticker}.json`)
  const data: CompanyData = {
    company: raw.company,
    price: raw.price,
    scores: raw.scores,
    priceHistory: raw.priceHistory ?? generateMockPriceHistory(raw.price?.price ?? 10),
  }
  return {
    data,
    technical: raw.technical ?? null,
    fundamental: raw.fundamental ?? null,
  }
}

export async function loadSentiment(ticker: string): Promise<SentimentData> {
  return fetchJSON<SentimentData>(`data/sentiment/${ticker}.json`)
}

export async function loadSectorSentiment(sector: string): Promise<SectorSentiment> {
  return fetchJSON<SectorSentiment>(`data/sentiment/sector_${sector}.json`)
}

export async function loadAllCompanies(): Promise<{
  data: CompanyData
  technical: TechnicalData | null
  fundamental: FundamentalData | null
}[]> {
  const manifest = await fetchJSON<{
    companies: { aerospace: string[]; datacenters: string[] }
  }>('data/manifest.json')

  const all = [
    ...manifest.companies.aerospace.map((t) => ({ sector: 'aerospace', ticker: t })),
    ...manifest.companies.datacenters.map((t) => ({ sector: 'datacenters', ticker: t })),
  ]

  return Promise.all(all.map(({ sector, ticker }) => loadCompany(sector, ticker)))
}
