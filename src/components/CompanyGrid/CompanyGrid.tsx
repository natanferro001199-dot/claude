import { useQuery } from '@tanstack/react-query'
import { loadAllCompanies, loadSentiment } from '../../lib/dataLoader'
import { useFilterStore } from '../../store/filters'
import CompanyCard from '../CompanyCard/CompanyCard'
import type { CompanyData } from '../../types/company'
import type { SentimentData } from '../../types/sentiment'
import type { FundamentalData } from '../../types/fundamental'

interface LoadedCompany {
  data: CompanyData
  technical: unknown
  fundamental: FundamentalData | null
}

export default function CompanyGrid() {
  const { sector, marketCap, priceMin, priceMax, analysisMode, searchQuery, setSelectedTicker } = useFilterStore()

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: loadAllCompanies,
  })

  const sentimentQueries = useQuery({
    queryKey: ['sentiment-all'],
    queryFn: async () => {
      if (!companies) return {}
      const map: Record<string, SentimentData> = {}
      await Promise.all(
        companies.map(async ({ data }: LoadedCompany) => {
          if (data.company.isPlaceholder) return
          try {
            map[data.company.ticker] = await loadSentiment(data.company.ticker)
          } catch { /* data unavailable */ }
        })
      )
      return map
    },
    enabled: !!companies,
  })

  if (isLoading) return <CompanyGridSkeleton />
  if (error || !companies) return (
    <div className="text-center py-20 text-gf-text-secondary">
      Failed to load company data. Please refresh.
    </div>
  )

  const filtered = (companies as LoadedCompany[]).filter(({ data }: LoadedCompany) => {
    const { company: meta, price } = data
    if (sector !== 'all' && meta.sector !== sector) return false
    if (marketCap !== 'all' && price.marketCapCategory !== marketCap) return false
    if (price.price !== null && (price.price < priceMin || price.price > priceMax)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!meta.ticker.toLowerCase().includes(q) && !meta.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-gf-text-secondary">
        No companies match the current filters.
      </div>
    )
  }

  // Group by sector
  const aerospace = filtered.filter(({ data }: LoadedCompany) => data.company.sector === 'aerospace')
  const datacenters = filtered.filter(({ data }: LoadedCompany) => data.company.sector === 'datacenters')
  const sentimentMap = sentimentQueries.data ?? {}

  const renderGroup = (items: LoadedCompany[], title: string) => {
    if (items.length === 0) return null
    return (
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gf-text mb-3 flex items-center gap-2">
          {title === 'New Space' ? '🚀' : '🖥'} {title}
          <span className="text-xs font-normal text-gf-text-secondary">{items.length} companies</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(({ data, fundamental }: LoadedCompany) => (
            <CompanyCard
              key={data.company.ticker}
              company={data}
              sentiment={sentimentMap[data.company.ticker] ?? null}
              analysisMode={analysisMode}
              fundamental={fundamental}
              onClick={() => setSelectedTicker(data.company.ticker)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {renderGroup(aerospace, 'New Space')}
      {renderGroup(datacenters, 'AI Data Centers')}
    </div>
  )
}

function CompanyGridSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {[0, 1].map((g) => (
        <div key={g} className="mb-8">
          <div className="h-5 w-32 bg-gf-border rounded animate-pulse mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="gf-card p-4 h-40 animate-pulse">
                <div className="h-4 w-16 bg-gf-border rounded mb-2" />
                <div className="h-3 w-32 bg-gf-border rounded mb-4" />
                <div className="h-3 w-full bg-gf-border rounded mb-2" />
                <div className="h-3 w-3/4 bg-gf-border rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
