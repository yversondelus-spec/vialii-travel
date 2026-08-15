'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Calendar, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody } from '@/components/common/Card'
import { getTourById } from '@/constants/chileanTours'
import { MEMBERSHIP_PLANS } from '@/lib/types/membership'

const EXPLORER_DISCOUNT = MEMBERSHIP_PLANS.explorer.benefits.discountPercentage

export default function TourDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tour = getTourById(params.id as string)

  if (!tour) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Tour no encontrado</h1>
        <Link href="/explore">
          <Button>Volver a explorar</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-4 sticky top-16 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
            <ArrowLeft size={20} />
            Volver
          </button>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="relative h-80 sm:h-96 w-full bg-gradient-to-br from-cyan-600 to-blue-700">
        {tour.image && <Image src={tour.image} alt={tour.name} fill className="object-cover" priority sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
          <h1 className="text-3xl sm:text-5xl font-black mb-2">{tour.name}</h1>
          <div className="text-sm sm:text-base opacity-90">
            {tour.region} • {tour.city}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-8">
            {/* QUICK INFO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
                  <Clock size={18} />
                  <span className="text-xs font-bold">DURACIÓN</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {tour.duration < 24 ? `${tour.duration}h` : `${Math.round(tour.duration / 24)} días`}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                  <Users size={18} />
                  <span className="text-xs font-bold">GRUPO</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Max {tour.groupSize}</p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                  <Zap size={18} />
                  <span className="text-xs font-bold">NIVEL</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{tour.difficulty}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                  <Calendar size={18} />
                  <span className="text-xs font-bold">MEJOR ÉPOCA</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{tour.bestSeason}</p>
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Sobre esta experiencia</h2>
              <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">{tour.description}</p>
            </div>

            {/* HIGHLIGHTS */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">✨ Lo que te espera</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {tour.highlights.map((highlight) => (
                  <div key={highlight} className="flex gap-3 items-start">
                    <CheckCircle size={20} className="text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* INCLUDES / EXCLUDES */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  Incluye
                </h3>
                <ul className="space-y-2">
                  {tour.includes.map((item) => (
                    <li key={item} className="text-slate-700 dark:text-slate-300 flex gap-2">
                      <span className="text-green-500">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-500" />
                  No incluye
                </h3>
                <ul className="space-y-2">
                  {tour.excludes.map((item) => (
                    <li key={item} className="text-slate-700 dark:text-slate-300 flex gap-2">
                      <span className="text-orange-500">−</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* HORARIOS */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Horarios disponibles</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tour.startTimes.map((time) => (
                  <div
                    key={time}
                    className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white"
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: BOOKING */}
          <div className="lg:col-span-1">
            <Card className="sticky top-36 shadow-xl">
              <CardBody>
                <div className="mb-6">
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Precio por persona</div>
                  <div className="text-4xl font-black text-cyan-600 mb-1">
                    ${tour.price.toLocaleString('es-CL')}
                    <span className="text-sm text-slate-600 dark:text-slate-400"> CLP</span>
                  </div>
                </div>

                {/* MEMBERSHIP INFO — informational, not a claim the user already has it */}
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    💳 Con membresía Aventurero: <strong>{EXPLORER_DISCOUNT}% off</strong> — se aplica al confirmar tu reserva
                  </p>
                </div>

                <Link href={`/tours/${tour.id}/book`}>
                  <Button size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold mb-3">
                    Reservar ahora
                  </Button>
                </Link>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-6">
                  Demo de producto — no se procesa ningún pago real todavía
                </p>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>Región: {tour.region}</p>
                  <p>Coordenadas: {tour.coordinates.lat.toFixed(2)}, {tour.coordinates.lng.toFixed(2)}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
