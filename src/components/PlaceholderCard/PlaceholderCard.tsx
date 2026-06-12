import { Rocket, Clock } from 'lucide-react'
import type { CompanyMeta } from '../../types/company'

export default function PlaceholderCard({ company }: { company: CompanyMeta }) {
  return (
    <div className="gf-card p-6 border-dashed border-2 opacity-80">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gf-accent-light flex items-center justify-center">
          <Rocket className="w-5 h-5 text-gf-accent" />
        </div>
        <div>
          <div className="font-semibold text-gf-text">{company.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-gf-text-secondary">
            <Clock className="w-3 h-3" />
            IPO / SPAC pending — data unavailable
          </div>
        </div>
      </div>
      <p className="text-sm text-gf-text-secondary">{company.description}</p>
      <div className="mt-4 p-3 bg-gf-bg rounded-lg border border-gf-border text-xs text-gf-text-secondary">
        This company is privately held. Market data, financial statements, and analysis will appear automatically once it lists on a public exchange.
      </div>
    </div>
  )
}
