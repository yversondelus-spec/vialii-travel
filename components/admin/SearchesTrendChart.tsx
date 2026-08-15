'use client'

import { useMemo, useRef, useState } from 'react'
import type { DailySearchCount } from '@/lib/services/analyticsService'

interface SearchesTrendChartProps {
  data: DailySearchCount[]
}

const WIDTH = 640
const HEIGHT = 200
const PAD_LEFT = 32
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 24
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM

function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default function SearchesTrendChart({ data }: SearchesTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 4)
    const points = data.map((d, i) => ({
      ...d,
      x: data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * PLOT_W : PAD_LEFT + PLOT_W / 2,
      y: PAD_TOP + (1 - d.count / max) * PLOT_H,
    }))
    return { points, max }
  }, [data])

  if (points.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos todavía.</p>
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const last = points[points.length - 1]
  const areaPath = `${linePath} L${last.x},${PAD_TOP + PLOT_H} L${points[0].x},${PAD_TOP + PLOT_H} Z`

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
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto touch-none select-none"
        aria-label="Búsquedas por día, últimos 14 días"
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + f * PLOT_H}
            y2={PAD_TOP + f * PLOT_H}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={1}
          />
        ))}

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
          {last.count}
        </text>

        {xLabelIndices.map((i, idx) => {
          const p = points[i]
          return (
            <text
              key={idx}
              x={p.x}
              y={HEIGHT - 6}
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
          <div className="font-semibold">{hovered.count} búsquedas</div>
          <div className="opacity-70">{formatShortDate(hovered.date)}</div>
        </div>
      )}
    </div>
  )
}
