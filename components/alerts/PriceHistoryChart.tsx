'use client'

import { useMemo, useRef, useState } from 'react'
import type { PricePoint } from '@/lib/types/priceAlert'

interface PriceHistoryChartProps {
  data: PricePoint[]
  /** The user's alert threshold, drawn as a reference line. */
  thresholdPrice?: number
}

const WIDTH = 640
const HEIGHT = 240
const PAD_LEFT = 56
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default function PriceHistoryChart({ data, thresholdPrice }: PriceHistoryChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const { points, min, max, yTicks } = useMemo(() => {
    const prices = data.map((d) => d.price)
    const allValues = thresholdPrice != null ? [...prices, thresholdPrice] : prices
    const rawMin = Math.min(...allValues)
    const rawMax = Math.max(...allValues)
    const padding = Math.max((rawMax - rawMin) * 0.15, 1000)
    const min = Math.max(0, rawMin - padding)
    const max = rawMax + padding
    const span = max - min || 1

    const points = data.map((d, i) => ({
      ...d,
      x: data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * PLOT_W : PAD_LEFT + PLOT_W / 2,
      y: PAD_TOP + (1 - (d.price - min) / span) * PLOT_H,
    }))

    const yTicks = Array.from({ length: 4 }, (_, i) => ({
      value: min + (span * i) / 3,
      y: PAD_TOP + (1 - i / 3) * PLOT_H,
    }))

    return { points, min, max, yTicks }
  }, [data, thresholdPrice])

  if (points.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos de precio todavía.</p>
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const last = points[points.length - 1]
  const areaPath = `${linePath} L${last.x},${PAD_TOP + PLOT_H} L${points[0].x},${PAD_TOP + PLOT_H} Z`
  const thresholdY =
    thresholdPrice != null ? PAD_TOP + (1 - (thresholdPrice - min) / (max - min || 1)) * PLOT_H : null

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const localX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let closest = 0
    let closestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - localX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const xLabelIndices = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none select-none"
          aria-label="Gráfico del historial de precios de esta ruta"
        >
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={tick.y}
                y2={tick.y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-400 dark:fill-slate-500"
                fontSize={10}
              >
                {formatCLP(tick.value)}
              </text>
            </g>
          ))}

          {thresholdY != null && (
            <g>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={thresholdY}
                y2={thresholdY}
                className="stroke-amber-400 dark:stroke-amber-500"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={WIDTH - PAD_RIGHT}
                y={thresholdY - 5}
                textAnchor="end"
                className="fill-amber-500 dark:fill-amber-400"
                fontSize={10}
                fontWeight={600}
              >
                Tu límite: {formatCLP(thresholdPrice as number)}
              </text>
            </g>
          )}

          <path d={areaPath} className="fill-[var(--price-line)]" opacity={0.1} />
          <path
            d={linePath}
            fill="none"
            className="stroke-[var(--price-line)]"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle cx={last.x} cy={last.y} r={4} className="fill-[var(--price-line)] stroke-white dark:stroke-slate-900" strokeWidth={2} />
          <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-slate-700 dark:fill-slate-200" fontSize={11} fontWeight={700}>
            {formatCLP(last.price)}
          </text>

          {xLabelIndices.map((i, idx) => {
            const p = points[i]
            return (
              <text
                key={idx}
                x={p.x}
                y={HEIGHT - 8}
                textAnchor={idx === 0 ? 'start' : idx === 2 ? 'end' : 'middle'}
                className="fill-slate-400 dark:fill-slate-500"
                fontSize={10}
              >
                {formatShortDate(p.date)}
              </text>
            )
          })}

          {hovered && (
            <g>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PAD_TOP}
                y2={PAD_TOP + PLOT_H}
                className="stroke-slate-300 dark:stroke-slate-600"
                strokeWidth={1}
              />
              <circle cx={hovered.x} cy={hovered.y} r={5} className="fill-[var(--price-line)] stroke-white dark:stroke-slate-900" strokeWidth={2} />
            </g>
          )}

          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={PLOT_W}
            height={PLOT_H}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
          >
            <div className="font-semibold">{formatCLP(hovered.price)}</div>
            <div className="opacity-70">{formatShortDate(hovered.date)}</div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        {showTable ? 'Ocultar tabla' : 'Ver como tabla'}
      </button>

      {showTable && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Fecha</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Precio</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((point) => (
                <tr key={point.date} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{formatShortDate(point.date)}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800 dark:text-slate-200">{formatCLP(point.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
