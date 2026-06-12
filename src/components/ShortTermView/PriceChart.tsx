import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import type { OHLCVBar } from '../../types/company'

interface Props {
  data: OHLCVBar[]
  sma20?: number
  sma50?: number
  sma200?: number
  ticker: string
}

export default function PriceChart({ data, sma20, sma50, sma200, ticker }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !data.length) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#5F6368',
        fontFamily: 'Google Sans, Roboto, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F1F3F4' },
        horzLines: { color: '#F1F3F4' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#DADCE0',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#DADCE0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
      width: containerRef.current.clientWidth,
      height: 300,
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#137333',
      downColor: '#C5221F',
      borderUpColor: '#137333',
      borderDownColor: '#C5221F',
      wickUpColor: '#137333',
      wickDownColor: '#C5221F',
    })

    candleSeries.setData(data.map((bar) => ({
      time: bar.time as `${number}-${number}-${number}`,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    })))

    // Moving averages
    const lastPrice = data[data.length - 1]?.close ?? 0
    const maConfigs = [
      { value: sma20, color: '#1A73E8', label: 'SMA20' },
      { value: sma50, color: '#E37400', label: 'SMA50' },
      { value: sma200, color: '#9333EA', label: 'SMA200' },
    ]

    maConfigs.forEach(({ value, color }) => {
      if (!value) return
      const maLine = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false })
      // Draw a horizontal price line for each MA (static value for mock)
      maLine.setData(data.slice(-30).map((bar) => ({
        time: bar.time as `${number}-${number}-${number}`,
        value: value * (1 + (bar.close - lastPrice) / lastPrice * 0.1),
      })))
    })

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      color: '#DADCE0',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(data.map((bar) => ({
      time: bar.time as `${number}-${number}-${number}`,
      value: bar.volume,
      color: bar.close >= bar.open ? '#E6F4EA' : '#FCE8E6',
    })))

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, sma20, sma50, sma200, ticker])

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        {[{ v: sma20, c: '#1A73E8', l: 'SMA20' }, { v: sma50, c: '#E37400', l: 'SMA50' }, { v: sma200, c: '#9333EA', l: 'SMA200' }]
          .filter((m) => m.v)
          .map((m) => (
            <div key={m.l} className="flex items-center gap-1 text-xs text-gf-text-secondary">
              <div className="w-4 h-0.5 rounded" style={{ backgroundColor: m.c }} />
              {m.l}: <span className="font-mono">${m.v?.toFixed(2)}</span>
            </div>
          ))}
      </div>
      <div ref={containerRef} className="tv-chart-container rounded-md overflow-hidden border border-gf-border" />
    </div>
  )
}
