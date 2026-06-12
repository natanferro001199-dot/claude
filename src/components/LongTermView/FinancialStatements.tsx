import { useState } from 'react'
import type { FundamentalData } from '../../types/fundamental'
import { formatCurrency } from '../../lib/utils'

interface Props { data: FundamentalData }

type Tab = 'income' | 'balance' | 'cashflow'

function fmt(v: number | number[] | null): string {
  if (v === null || v === undefined) return 'N/A'
  const num = Array.isArray(v) ? v[0] : v
  if (num === null || num === undefined) return 'N/A'
  return formatCurrency(num * 1e6)  // values stored in $M
}

export default function FinancialStatements({ data }: Props) {
  const [tab, setTab] = useState<Tab>('income')
  const { incomeStatement: is, balanceSheet: bs, cashFlow: cf } = data

  const tabs: { id: Tab; label: string }[] = [
    { id: 'income', label: 'Income Statement' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
  ]

  return (
    <div className="gf-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gf-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`gf-tab ${tab === t.id ? 'gf-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Income Statement */}
      {tab === 'income' && (
        <table className="w-full gf-table">
          <thead>
            <tr>
              <th className="text-left">Metric ($M)</th>
              {is.years.map((y) => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Revenue', values: is.revenue },
              { label: 'Gross Profit', values: is.grossProfit },
              { label: 'Operating Income', values: is.operatingIncome },
              { label: 'EBITDA', values: is.ebitda },
              { label: 'Net Income', values: is.netIncome },
              { label: 'EPS', values: is.eps },
            ].map(({ label, values }) => (
              <tr key={label}>
                <td className="font-normal">{label}</td>
                {(values as (number | null)[]).map((v, i) => (
                  <td key={i} className={
                    v !== null && v < 0 ? 'text-gf-negative font-mono' : 'text-gf-text font-mono'
                  }>
                    {label === 'EPS' ? (v !== null ? `$${v.toFixed(2)}` : 'N/A') : fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Balance Sheet */}
      {tab === 'balance' && (
        <table className="w-full gf-table">
          <thead>
            <tr>
              <th className="text-left">Metric ($M)</th>
              {bs.years.map((y) => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Cash & Equivalents', values: bs.cash },
              { label: 'Total Assets', values: bs.totalAssets },
              { label: 'Total Debt', values: bs.totalDebt },
              { label: 'Total Equity', values: bs.totalEquity },
              { label: 'Shares Outstanding (M)', values: bs.sharesOutstanding },
            ].map(({ label, values }) => (
              <tr key={label}>
                <td className="font-normal">{label}</td>
                {(values as (number | null)[]).map((v, i) => (
                  <td key={i} className="font-mono">
                    {label.includes('Shares') ? (v !== null ? `${v.toFixed(0)}M` : 'N/A') : fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Cash Flow */}
      {tab === 'cashflow' && (
        <table className="w-full gf-table">
          <thead>
            <tr>
              <th className="text-left">Metric ($M)</th>
              {cf.years.map((y) => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Operating Cash Flow', values: cf.operatingCF },
              { label: 'CapEx', values: cf.capex },
              { label: 'Free Cash Flow', values: cf.freeCashFlow },
              { label: 'Financing Cash Flow', values: cf.financingCF },
            ].map(({ label, values }) => (
              <tr key={label}>
                <td className="font-normal">{label}</td>
                {(values as (number | null | (number | null)[])[]).map((v, i) => {
                  const num = Array.isArray(v) ? v[0] : v
                  return (
                    <td key={i} className={`font-mono ${num !== null && num < 0 ? 'text-gf-negative' : ''}`}>
                      {num !== null && num !== undefined ? formatCurrency(num * 1e6) : 'N/A'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
