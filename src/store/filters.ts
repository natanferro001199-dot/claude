import { create } from 'zustand'
import type { Sector, AnalysisMode, MarketCapCategory } from '../types/company'

export interface FilterState {
  sector: Sector | 'all'
  marketCap: MarketCapCategory | 'all'
  priceMin: number
  priceMax: number
  analysisMode: AnalysisMode
  searchQuery: string
  selectedTicker: string | null
  activeView: 'grid' | 'sector-dashboard'
}

interface FilterActions {
  setSector: (sector: Sector | 'all') => void
  setMarketCap: (cap: MarketCapCategory | 'all') => void
  setPriceRange: (min: number, max: number) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  setSearchQuery: (q: string) => void
  setSelectedTicker: (ticker: string | null) => void
  setActiveView: (view: 'grid' | 'sector-dashboard') => void
  resetFilters: () => void
}

const DEFAULT_STATE: FilterState = {
  sector: 'all',
  marketCap: 'all',
  priceMin: 0,
  priceMax: 10000,
  analysisMode: 'long-term',
  searchQuery: '',
  selectedTicker: null,
  activeView: 'grid',
}

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...DEFAULT_STATE,
  setSector: (sector) => set({ sector }),
  setMarketCap: (marketCap) => set({ marketCap }),
  setPriceRange: (priceMin, priceMax) => set({ priceMin, priceMax }),
  setAnalysisMode: (analysisMode) => set({ analysisMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTicker: (selectedTicker) => set({ selectedTicker }),
  setActiveView: (activeView) => set({ activeView }),
  resetFilters: () => set(DEFAULT_STATE),
}))
