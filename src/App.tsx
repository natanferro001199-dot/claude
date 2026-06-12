import { useFilterStore } from './store/filters'
import FilterBar from './components/FilterBar/FilterBar'
import CompanyGrid from './components/CompanyGrid/CompanyGrid'
import CompanyModal from './components/CompanyModal/CompanyModal'
import SectorDashboard from './components/SectorDashboard/SectorDashboard'

export default function App() {
  const { activeView } = useFilterStore()

  return (
    <div className="min-h-screen bg-gf-bg">
      {/* App Header */}
      <header className="bg-white border-b border-gf-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛰</span>
            <div>
              <h1 className="text-base font-semibold text-gf-text leading-none">OrbitView</h1>
              <p className="text-xs text-gf-text-secondary">Investment Intelligence — New Space & AI Data Centers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gf-text-secondary">
            <span className="w-2 h-2 rounded-full bg-gf-positive inline-block" />
            Data refreshed daily via GitHub Actions
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar />

      {/* Main content */}
      <main>
        {activeView === 'grid' ? <CompanyGrid /> : <SectorDashboard />}
      </main>

      {/* Company Detail Modal */}
      <CompanyModal />

      {/* Footer */}
      <footer className="border-t border-gf-border mt-8 py-4">
        <div className="max-w-screen-xl mx-auto px-4 text-xs text-gf-text-secondary text-center">
          OrbitView — for informational purposes only. Not financial advice.
          Data sourced from yfinance, FMP API, and NewsAPI via GitHub Actions.
          Sentiment analysis powered by FinBERT + Random Forest.
        </div>
      </footer>
    </div>
  )
}
