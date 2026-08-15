'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { MapPin, Calendar, Users, DollarSign, Sparkles, Wand2, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { INTERESTS, type Interest } from '@/constants/interests'
import { detectOrigin, FALLBACK_ORIGIN } from '@/lib/utils/detectOrigin'
import { resolveSmartSearch, type SmartSearchResolution } from '@/lib/services/smartSearchService'
import { DURATION_OPTIONS } from '@/lib/services/aiSearchHelper'
import { DEFAULT_PASSENGERS, totalPassengers, type PassengerCounts, type SearchCriteria } from '@/lib/types/searchCriteria'
import { cn } from '@/lib/utils/cn'

interface TravelSearchFormProps {
  /** Receives the fully-resolved search (gaps already filled) — the caller decides what to do with it: route (Home) or call /api/search (SearchPage). */
  onSearch: (resolution: SmartSearchResolution) => void
  isLoading?: boolean
  initial?: Partial<SearchCriteria>
  className?: string
}

type Scope = 'national' | 'international' | 'surprise'

const SCOPE_OPTIONS: { id: Scope; label: string; icon: string }[] = [
  { id: 'national', label: 'Dentro de Chile', icon: '🇨🇱' },
  { id: 'international', label: 'Internacional', icon: '🌎' },
  { id: 'surprise', label: 'Sorpréndeme', icon: '✨' },
]

function StepperRow({
  icon,
  label,
  value,
  min,
  onChange,
}: {
  icon: string
  label: string
  value: number
  min: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {icon} {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Menos ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-blue-400 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center font-semibold text-slate-900 dark:text-slate-100">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Más ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

export default function TravelSearchForm({ onSearch, isLoading, initial, className }: TravelSearchFormProps) {
  const [origin, setOrigin] = useState(initial?.origin ?? FALLBACK_ORIGIN)
  const [originDetected, setOriginDetected] = useState(false)

  const [destination, setDestination] = useState(initial?.destination ?? '')
  // Opt-in only — must default to false even when there's no initial
  // destination (a fresh Home visit), otherwise the destination field starts
  // disabled on every first load, which is backwards: typing a destination
  // is the default path, "no sé, recomiéndame" is the escape hatch.
  const [recommendMe, setRecommendMe] = useState(false)

  const [scope, setScope] = useState<Scope>(
    initial?.scope === 'surprise' || initial?.scope === 'international' || initial?.scope === 'national' ? initial.scope : 'national'
  )

  const [dateMode, setDateMode] = useState<'exact' | 'duration'>(initial?.dates?.mode === 'duration' ? 'duration' : 'exact')
  const [startDate, setStartDate] = useState(initial?.dates?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.dates?.endDate ?? '')
  const [flexible, setFlexible] = useState(initial?.dates?.mode === 'flexible')
  const [approxDuration, setApproxDuration] = useState(initial?.dates?.approxDuration ?? DURATION_OPTIONS[1].label)

  const [passengers, setPassengers] = useState<PassengerCounts>(initial?.passengers ?? DEFAULT_PASSENGERS)

  const [budgetAmount, setBudgetAmount] = useState(initial?.budget?.amount ?? 300_000)
  const [budgetUnit, setBudgetUnit] = useState<'per_person' | 'total'>(initial?.budget?.unit ?? 'total')

  const [interests, setInterests] = useState<Interest[]>(initial?.interests ?? [])

  useEffect(() => {
    if (initial?.origin) return // already have a value (e.g. refining an existing search) — don't overwrite it
    let cancelled = false
    detectOrigin().then((result) => {
      if (cancelled) return
      setOrigin(result.origin)
      setOriginDetected(result.detected)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleInterest = (id: Interest) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const buildCriteria = (): SearchCriteria => ({
    origin: origin.trim() || FALLBACK_ORIGIN,
    destination: recommendMe ? undefined : destination.trim() || undefined,
    scope,
    dates:
      dateMode === 'exact'
        ? { mode: flexible ? 'flexible' : 'exact', startDate: startDate || undefined, endDate: endDate || undefined }
        : { mode: 'duration', approxDuration },
    passengers,
    budget: budgetAmount > 0 ? { amount: budgetAmount, unit: budgetUnit } : undefined,
    interests,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(resolveSmartSearch(buildCriteria()))
  }

  const todayISO = new Date().toISOString().split('T')[0]
  const paxSummary = `${passengers.adults} adulto${passengers.adults === 1 ? '' : 's'}${
    passengers.children ? ` · ${passengers.children} niño${passengers.children === 1 ? '' : 's'}` : ''
  }${passengers.infants ? ` · ${passengers.infants} infante${passengers.infants === 1 ? '' : 's'}` : ''}`

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-5', className)}
    >
      {/* Origen */}
      <div>
        <label htmlFor="tsf-origin" className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          <MapPin size={15} /> Origen
        </label>
        <input
          id="tsf-origin"
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Santiago, Chile"
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {originDetected && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">📍 Detectamos que estás en {origin}. Puedes cambiarlo.</p>
        )}
      </div>

      {/* Destino */}
      <div>
        <label htmlFor="tsf-destination" className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          <MapPin size={15} /> ¿Dónde quieres viajar?
        </label>
        <input
          id="tsf-destination"
          type="text"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value)
            if (e.target.value.trim()) setRecommendMe(false)
          }}
          disabled={recommendMe}
          placeholder="Ej: París, Buenos Aires, Puerto Varas..."
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
        />
        <button
          type="button"
          onClick={() => setRecommendMe((v) => !v)}
          className={cn(
            'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors',
            recommendMe
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
          )}
        >
          ✨ No lo sé, recomiéndame
        </button>
      </div>

      {/* Nacional / Internacional / Sorpréndeme */}
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">¿Qué tipo de viaje buscas?</p>
        <div className="grid grid-cols-3 gap-2">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScope(opt.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors',
                scope === opt.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
              )}
            >
              <span className="text-lg">{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fechas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Calendar size={15} /> Fechas
          </label>
          <button
            type="button"
            onClick={() => setDateMode((m) => (m === 'exact' ? 'duration' : 'exact'))}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {dateMode === 'exact' ? 'No tengo fechas exactas' : 'Elegir fechas exactas'}
          </button>
        </div>

        {dateMode === 'exact' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Ida</span>
                <input
                  type="date"
                  value={startDate}
                  min={todayISO}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Vuelta</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayISO}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-2.5 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} className="accent-blue-600" />
              Fechas flexibles (buscamos alternativas cercanas con mejor precio)
            </label>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setApproxDuration(opt.label)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors',
                  approxDuration === opt.label
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pasajeros */}
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
          <Users size={15} /> Pasajeros
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{paxSummary}</p>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 divide-y divide-slate-100 dark:divide-slate-800">
          <StepperRow icon="🧑" label="Adultos" value={passengers.adults} min={1} onChange={(v) => setPassengers((p) => ({ ...p, adults: v }))} />
          <StepperRow icon="🧒" label="Niños" value={passengers.children} min={0} onChange={(v) => setPassengers((p) => ({ ...p, children: v }))} />
          <StepperRow icon="👶" label="Infantes" value={passengers.infants} min={0} onChange={(v) => setPassengers((p) => ({ ...p, infants: v }))} />
        </div>
      </div>

      {/* Presupuesto */}
      <div>
        <label htmlFor="tsf-budget" className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          <DollarSign size={15} /> Presupuesto
        </label>
        <div className="flex gap-2">
          <input
            id="tsf-budget"
            type="number"
            min={0}
            step={10000}
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(Math.max(0, Number(e.target.value)))}
            className="flex-1 min-w-0 px-4 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={budgetUnit}
            onChange={(e) => setBudgetUnit(e.target.value as 'per_person' | 'total')}
            className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shrink-0"
          >
            <option value="total">Total del viaje</option>
            <option value="per_person">Por persona</option>
          </select>
        </div>
        {budgetUnit === 'per_person' && totalPassengers(passengers) > 1 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            ≈ ${(budgetAmount * totalPassengers(passengers)).toLocaleString('es-CL')} total para {totalPassengers(passengers)} pasajeros
          </p>
        )}
      </div>

      {/* Preferencias */}
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          <Sparkles size={15} /> ¿Qué tipo de experiencia buscas?
        </p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = interests.includes(interest.id)
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors',
                  active
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                )}
              >
                <span>{interest.icon}</span> {interest.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-1">
        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          ✨ Encontrar mi viaje
        </Button>
        {scope === 'surprise' && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
            <Wand2 size={12} className="inline mr-1" /> Elegiste sorprenderte — completamos lo que falte por ti.
          </p>
        )}
      </div>
    </form>
  )
}
