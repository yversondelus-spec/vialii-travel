'use client'

import Image from 'next/image'

// pravatar.cc avatar IDs for the social-proof strip — same verified set used
// elsewhere on the home page (app/page.tsx), kept in sync deliberately.
const AVATAR_IDS = [12, 25, 33, 47]

/**
 * Compact inspirational hero — kept short on purpose so the real search form
 * (TravelSearchForm, right below this in app/page.tsx) is reachable with
 * barely any scrolling instead of sitting under a full-viewport hero.
 */
export function HeroInspiration() {
  return (
    <section
      id="hero-inspiration"
      className="relative min-h-[40vh] sm:min-h-[44vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-600"
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

      <div className="relative z-10 text-center text-white max-w-2xl mx-auto px-4 py-8">
        <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-cyan-200 mb-2">
          Experiencias que transforman
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight tracking-tight">
          No viajes.
          <br />
          <span className="text-cyan-200">Vive tu próximo capítulo.</span>
        </h1>
        <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
          Descubre experiencias curadas por estilo de vida. Nosotros armamos el viaje, tú solo vives.
        </p>

        <div className="flex items-center justify-center -space-x-3 mt-5 mb-2">
          {AVATAR_IDS.map((n) => (
            <Image
              key={n}
              src={`https://i.pravatar.cc/64?img=${n}`}
              alt="Viajero de la comunidad VIALII"
              width={32}
              height={32}
              className="rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <p className="text-xs text-white/80">Jóvenes viviendo su próximo capítulo con VIALII</p>
      </div>
    </section>
  )
}

export default HeroInspiration
