'use client'

import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

// pravatar.cc avatar IDs for the social-proof strip — same verified set used
// elsewhere on the home page (app/page.tsx), kept in sync deliberately.
const AVATAR_IDS = [12, 25, 33, 47]

/**
 * Lifestyle-first hero: inspiration and a "keep scrolling" nudge into the
 * curated sections below, rather than a search box up front. The functional
 * search entry point still lives right under this section (TravelSearchForm
 * in app/page.tsx) for anyone who wants to skip straight to it.
 */
export function HeroInspiration() {
  return (
    <section
      id="hero-inspiration"
      className="relative min-h-[55vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-600"
    >
      <Image
        src="https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=1600&h=900&fit=crop"
        alt="Joven viajero cruzando un puente colgante en la naturaleza, explorando con su mochila"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-75"
      />
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

      <div className="relative z-10 text-center text-white max-w-2xl mx-auto px-4 py-12">
        <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-cyan-200 mb-3">
          Experiencias que transforman
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight tracking-tight">
          No viajes.
          <br />
          <span className="text-cyan-200">Vive tu próximo capítulo.</span>
        </h1>
        <p className="text-base sm:text-lg text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
          Descubre experiencias curadas por estilo de vida. Nosotros armamos el viaje, tú solo vives.
        </p>

        <a
          href="#trending-experiences"
          className="inline-block px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition-colors font-semibold mb-10"
        >
          Explorar experiencias
        </a>

        <div className="flex items-center justify-center -space-x-3 mb-3">
          {AVATAR_IDS.map((n) => (
            <Image
              key={n}
              src={`https://i.pravatar.cc/64?img=${n}`}
              alt="Viajero de la comunidad VIALII"
              width={40}
              height={40}
              className="rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <p className="text-sm text-white/80">Jóvenes viviendo su próximo capítulo con VIALII</p>
      </div>

      <a
        href="#trending-experiences"
        aria-label="Bajar a experiencias destacadas"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white animate-bounce"
      >
        <ChevronDown size={28} />
      </a>
    </section>
  )
}

export default HeroInspiration
