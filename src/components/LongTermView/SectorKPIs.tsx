import type { SectorKPIs, AerospaceKPIs, DataCenterKPIs } from '../../types/fundamental'
import type { Sector } from '../../types/company'

interface Props { kpis: SectorKPIs; sector: Sector }

function fmt(v: number | null, suffix = ''): string {
  if (v === null || v === undefined) return 'N/A'
  return `${v.toFixed(1)}${suffix}`
}

export default function SectorKPIsPanel({ kpis, sector }: Props) {
  if (sector === 'aerospace') {
    const k = kpis as AerospaceKPIs
    const rows = [
      { label: 'Backlog Orders', value: k.backlogOrders != null ? `$${k.backlogOrders.toFixed(2)}B` : 'N/A', note: 'Contracted but undelivered revenue' },
      { label: 'Book-to-Bill Ratio', value: fmt(k.bookToBill), note: '>1.0 = growing backlog' },
      { label: 'Government Revenue %', value: fmt(k.govtRevenuePercent, '%'), note: 'Defense / civil vs commercial mix' },
      { label: 'R&D % of Revenue', value: fmt(k.rdPercentRevenue, '%'), note: 'Innovation investment intensity' },
      { label: 'Launches (12M)', value: k.launchCount12m != null ? `${k.launchCount12m}` : 'N/A', note: 'Electron / other missions' },
    ]
    return <KPITable rows={rows} title="New Space KPIs" />
  }

  const k = kpis as DataCenterKPIs
  const rows = [
    { label: 'Occupancy Rate', value: fmt(k.occupancyRate, '%'), note: 'Leased / total capacity' },
    { label: 'Power Usage Effectiveness', value: fmt(k.pue), note: '1.0 = perfect efficiency' },
    { label: 'Revenue per MW', value: k.revenuePerMW != null ? `$${k.revenuePerMW.toFixed(1)}M/MW` : 'N/A', note: 'Monetization of power capacity' },
    { label: 'Adj. EBITDA Margin', value: fmt(k.adjustedEbitdaMargin, '%'), note: 'Cash profitability of operations' },
    { label: 'Hyperscaler Concentration', value: fmt(k.hyperscalerConcentration, '%'), note: 'Revenue from top 3 cloud customers' },
  ]
  return <KPITable rows={rows} title="AI Data Center KPIs" />
}

function KPITable({ rows, title }: { rows: { label: string; value: string; note: string }[]; title: string }) {
  return (
    <div className="gf-card overflow-hidden">
      <div className="px-4 py-2 bg-gf-bg border-b border-gf-border">
        <span className="text-xs font-semibold text-gf-text-secondary uppercase tracking-wide">{title}</span>
      </div>
      <table className="w-full gf-table">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="font-normal text-gf-text">{r.label}</td>
              <td className="font-mono font-semibold">{r.value}</td>
              <td className="text-gf-text-secondary text-xs hidden sm:table-cell">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
