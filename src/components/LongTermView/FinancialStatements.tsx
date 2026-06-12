import { useState } from 'react'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { FundamentalData, IncomeStatement, BalanceSheet, CashFlowStatement } from '../../types/fundamental'
import { formatCurrency } from '../../lib/utils'

interface Props { data: FundamentalData }

type Tab = 'income' | 'balance' | 'cashflow'

const GF_POSITIVE = '#137333'
const GF_NEGATIVE = '#C5221F'
const GF_ACCENT = '#1A73E8'
const GF_TEXT = '#5F6368'
const GF_GRID = '#F1F3F4'

function fmt(v: number | number[] | null): string {
  if (v === null || v === undefined) return 'N/A'
  const num = Array.isArray(v) ? v[0] : v
  if (num === null || num === undefined) return 'N/A'
  return formatCurrency(num * 1e6)  // values stored in $M
}

// $M value → display string (values are stored in millions)
function fmtM(v: number | null): string {
  if (v === null || v === undefined) return 'N/A'
  return formatCurrency(v * 1e6)
}

// Shared base config for a compact, Google Finance-style chart
function baseOptions(categories: string[]): ApexOptions {
  return {
    chart: {
      type: 'bar',
      height: 220,
      background: 'transparent',
      foreColor: GF_TEXT,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Google Sans, Roboto, sans-serif',
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: GF_GRID,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { color: GF_GRID },
      axisTicks: { color: GF_GRID },
      labels: { style: { colors: GF_TEXT, fontSize: '11px' } },
    },
    tooltip: { theme: 'light' },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      labels: { colors: GF_TEXT },
      markers: { size: 5 },
      itemMargin: { horizontal: 6 },
    },
  }
}

function IncomeChart({ is }: { is: IncomeStatement }) {
  const grossMargin = is.revenue.map((rev, i) => {
    const gp = is.grossProfit[i]
    if (rev === null || rev === 0 || gp === null) return null
    return +((gp / rev) * 100).toFixed(1)
  })

  const series = [
    { name: 'Revenue', type: 'column', data: is.revenue },
    { name: 'Gross Profit', type: 'column', data: is.grossProfit },
    { name: 'Net Income', type: 'column', data: is.netIncome },
    { name: 'Gross Margin %', type: 'line', data: grossMargin },
  ]

  const options: ApexOptions = {
    ...baseOptions(is.years),
    chart: { ...baseOptions(is.years).chart, type: 'line' },
    colors: [GF_POSITIVE, GF_POSITIVE, GF_POSITIVE, GF_ACCENT],
    stroke: { width: [0, 0, 0, 2], curve: 'smooth' },
    markers: { size: [0, 0, 0, 4], colors: [GF_ACCENT], strokeColors: GF_ACCENT },
    plotOptions: {
      bar: {
        columnWidth: '70%',
        borderRadius: 2,
        // Color negative values red, positive green
        colors: { ranges: [{ from: -1e12, to: 0, color: GF_NEGATIVE }] },
      },
    },
    yaxis: [
      { seriesName: 'Revenue', labels: { formatter: (v) => fmtM(v), style: { colors: GF_TEXT } } },
      { seriesName: 'Revenue', show: false },
      { seriesName: 'Revenue', show: false },
      {
        seriesName: 'Gross Margin %',
        opposite: true,
        labels: { formatter: (v) => `${v.toFixed(0)}%`, style: { colors: GF_TEXT } },
      },
    ],
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val, opts) =>
          opts?.seriesIndex === 3 ? `${val?.toFixed(1)}%` : fmtM(val),
      },
    },
  }

  return <Chart options={options} series={series} type="line" height={220} />
}

function BalanceChart({ bs }: { bs: BalanceSheet }) {
  const series = [
    { name: 'Cash', data: bs.cash },
    { name: 'Total Debt', data: bs.totalDebt },
    { name: 'Total Equity', data: bs.totalEquity },
  ]

  const options: ApexOptions = {
    ...baseOptions(bs.years),
    colors: [GF_ACCENT, GF_NEGATIVE, GF_POSITIVE],
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 2 } },
    chart: { ...baseOptions(bs.years).chart, type: 'bar', stacked: true },
    yaxis: { labels: { formatter: (v) => fmtM(v), style: { colors: GF_TEXT } } },
    tooltip: { theme: 'light', y: { formatter: (val) => fmtM(val) } },
  }

  return <Chart options={options} series={series} type="bar" height={220} />
}

function CashFlowChart({ cf }: { cf: CashFlowStatement }) {
  const series = [
    { name: 'Operating CF', data: cf.operatingCF },
    { name: 'CapEx', data: cf.capex },
    { name: 'Free Cash Flow', data: cf.freeCashFlow },
  ]

  const options: ApexOptions = {
    ...baseOptions(cf.years),
    colors: [GF_POSITIVE, GF_POSITIVE, GF_POSITIVE],
    plotOptions: {
      bar: {
        columnWidth: '70%',
        borderRadius: 2,
        colors: { ranges: [{ from: -1e12, to: 0, color: GF_NEGATIVE }] },
      },
    },
    yaxis: { labels: { formatter: (v) => fmtM(v), style: { colors: GF_TEXT } } },
    tooltip: { theme: 'light', y: { formatter: (val) => fmtM(val) } },
  }

  return <Chart options={options} series={series} type="bar" height={220} />
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
        <>
          <div className="p-3 border-b border-gf-border">
            <IncomeChart is={is} />
          </div>
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
        </>
      )}

      {/* Balance Sheet */}
      {tab === 'balance' && (
        <>
          <div className="p-3 border-b border-gf-border">
            <BalanceChart bs={bs} />
          </div>
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
        </>
      )}

      {/* Cash Flow */}
      {tab === 'cashflow' && (
        <>
          <div className="p-3 border-b border-gf-border">
            <CashFlowChart cf={cf} />
          </div>
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
        </>
      )}
    </div>
  )
}
