import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useFilterStore } from '../../store/filters'
import type { Sector, AnalysisMode, MarketCapCategory } from '../../types/company'

export default function FilterBar() {
  const {
    sector, marketCap, priceMin, priceMax, analysisMode, searchQuery, activeView,
    setSector, setMarketCap, setPriceRange, setAnalysisMode, setSearchQuery,
    setActiveView, resetFilters,
  } = useFilterStore()

  return (
    <div className="bg-white border-b border-gf-border sticky top-0 z-20">
      {/* Top bar: analysis mode toggle + view switch */}
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gf-bg rounded-lg p-0.5">
          {(['long-term', 'short-term'] as AnalysisMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAnalysisMode(mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                analysisMode === mode
                  ? 'bg-white shadow text-gf-accent'
                  : 'text-gf-text-secondary hover:text-gf-text'
              }`}
            >
              {mode === 'long-term' ? 'Long-Term' : 'Short-Term'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('grid')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              activeView === 'grid' ? 'bg-gf-accent-light text-gf-accent' : 'text-gf-text-secondary hover:bg-gf-bg'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveView('sector-dashboard')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              activeView === 'sector-dashboard' ? 'bg-gf-accent-light text-gf-accent' : 'text-gf-text-secondary hover:bg-gf-bg'
            }`}
          >
            Sector Dashboard
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="max-w-screen-xl mx-auto px-4 pb-2 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gf-text-secondary" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gf-border rounded-md bg-white w-48 focus:outline-none focus:border-gf-accent"
          />
        </div>

        {/* Sector filter */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gf-text-secondary" />
          <span className="text-xs text-gf-text-secondary">Sector:</span>
          {(['all', 'aerospace', 'datacenters'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSector(s as Sector | 'all')}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                sector === s
                  ? 'bg-gf-accent text-white border-gf-accent'
                  : 'border-gf-border text-gf-text-secondary hover:border-gf-accent hover:text-gf-accent'
              }`}
            >
              {s === 'all' ? 'All' : s === 'aerospace' ? 'New Space' : 'Data Centers'}
            </button>
          ))}
        </div>

        {/* Market cap filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gf-text-secondary">Market Cap:</span>
          {(['all', 'micro', 'small', 'mid', 'large'] as const).map((cap) => (
            <button
              key={cap}
              onClick={() => setMarketCap(cap as MarketCapCategory | 'all')}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                marketCap === cap
                  ? 'bg-gf-accent text-white border-gf-accent'
                  : 'border-gf-border text-gf-text-secondary hover:border-gf-accent hover:text-gf-accent'
              }`}
            >
              {cap === 'all' ? 'All' : cap === 'micro' ? 'Micro' : cap === 'small' ? 'Small' : cap === 'mid' ? 'Mid' : 'Large'}
            </button>
          ))}
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gf-text-secondary">Price:</span>
          <input
            type="number"
            placeholder="Min"
            value={priceMin || ''}
            onChange={(e) => setPriceRange(Number(e.target.value) || 0, priceMax)}
            className="w-16 px-2 py-1 text-xs border border-gf-border rounded-md focus:outline-none focus:border-gf-accent"
          />
          <span className="text-xs text-gf-text-secondary">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax === 10000 ? '' : priceMax}
            onChange={(e) => setPriceRange(priceMin, Number(e.target.value) || 10000)}
            className="w-16 px-2 py-1 text-xs border border-gf-border rounded-md focus:outline-none focus:border-gf-accent"
          />
        </div>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-gf-text-secondary hover:text-gf-text border border-transparent hover:border-gf-border rounded-md transition-all"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
    </div>
  )
}
