import { useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { loadCompany, loadSentiment } from '../../lib/dataLoader'
import { useFilterStore } from '../../store/filters'
import ShortTermView from '../ShortTermView/ShortTermView'
import LongTermView from '../LongTermView/LongTermView'
import PlaceholderCard from '../PlaceholderCard/PlaceholderCard'
import { formatCurrency, formatPct, getChangeColor, isDataStale } from '../../lib/utils'
import type { Sector } from '../../types/company'

const SECTOR_OF: Record<string, Sector> = {
  RKLB: 'aerospace', RDW: 'aerospace', PL: 'aerospace', MNTS: 'aerospace',
  LUNR: 'aerospace', VOYAGER: 'aerospace',
  EQIX: 'datacenters', APLD: 'datacenters', NEBIUS: 'datacenters',
  IREN: 'datacenters', TSSI: 'datacenters',
}

export default function CompanyModal() {
  const { selectedTicker, analysisMode, setSelectedTicker, setAnalysisMode } = useFilterStore()

  const sector = selectedTicker ? SECTOR_OF[selectedTicker] : null

  const { data: companyResult, isLoading } = useQuery({
    queryKey: ['company', sector, selectedTicker],
    queryFn: () => loadCompany(sector!, selectedTicker!),
    enabled: !!selectedTicker && !!sector,
  })

  const { data: sentiment } = useQuery({
    queryKey: ['sentiment', selectedTicker],
    queryFn: () => loadSentiment(selectedTicker!),
    enabled: !!selectedTicker && !companyResult?.data.company.isPlaceholder,
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTicker(null)
      if (e.key === 's') setAnalysisMode('short-term')
      if (e.key === 'l') setAnalysisMode('long-term')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setSelectedTicker, setAnalysisMode])

  if (!selectedTicker) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setSelectedTicker(null)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl h-full bg-white shadow-2xl overflow-y-auto fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gf-border rounded animate-pulse" />
            ))}
          </div>
        )}

        {companyResult && (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gf-border">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{companyResult.data.company.name}</h2>
                      <span className="badge bg-gf-neutral text-gf-text-secondary text-xs">
                        {companyResult.data.company.exchange}:{companyResult.data.company.ticker}
                      </span>
                    </div>
                    {!companyResult.data.company.isPlaceholder && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-mono font-bold">
                          {formatCurrency(companyResult.data.price.price, false)}
                        </span>
                        <span className={`flex items-center gap-1 font-mono text-sm ${getChangeColor(companyResult.data.price.priceChange)}`}>
                          {companyResult.data.price.priceChange > 0 ? <TrendingUp className="w-4 h-4" /> :
                            companyResult.data.price.priceChange < 0 ? <TrendingDown className="w-4 h-4" /> :
                            <Minus className="w-4 h-4" />}
                          {formatCurrency(companyResult.data.price.priceChange, false)} ({formatPct(companyResult.data.price.priceChangePct)})
                        </span>
                        {isDataStale(companyResult.data.price.lastUpdated) && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertTriangle className="w-3 h-3" /> Stale data
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedTicker(null)} className="p-1 hover:bg-gf-bg rounded-md">
                    <X className="w-5 h-5 text-gf-text-secondary" />
                  </button>
                </div>

                {/* Analysis mode tabs */}
                {!companyResult.data.company.isPlaceholder && (
                  <div className="flex gap-0 mt-3 border-b border-gf-border -mb-px">
                    {(['long-term', 'short-term'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAnalysisMode(mode)}
                        className={`gf-tab ${analysisMode === mode ? 'gf-tab-active' : ''}`}
                      >
                        {mode === 'long-term' ? 'Long-Term (Fundamentals)' : 'Short-Term (Technical)'}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center text-xs text-gf-text-secondary pb-2">
                      <kbd className="px-1 py-0.5 bg-gf-bg rounded border border-gf-border">L</kbd>
                      <span className="mx-1">/</span>
                      <kbd className="px-1 py-0.5 bg-gf-bg rounded border border-gf-border">S</kbd>
                      <span className="ml-1">to switch</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {companyResult.data.company.isPlaceholder ? (
                <PlaceholderCard company={companyResult.data.company} />
              ) : analysisMode === 'short-term' ? (
                <ShortTermView
                  company={companyResult.data}
                  technical={companyResult.technical as Parameters<typeof ShortTermView>[0]['technical']}
                  sentiment={sentiment ?? null}
                />
              ) : (
                <LongTermView
                  company={companyResult.data}
                  fundamental={companyResult.fundamental as Parameters<typeof LongTermView>[0]['fundamental']}
                  sentiment={sentiment ?? null}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
