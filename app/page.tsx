'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, TrendingUp, Compass } from 'lucide-react'
import { Button } from '@/components/common/Button'
import TravelSearchForm from '@/components/search/TravelSearchForm'
import DestinationsByRegion from '@/components/home/DestinationsByRegion'
import NewsletterSignup from '@/components/home/NewsletterSignup'
import HeroInspiration from '@/components/home/HeroInspiration'
import StickySearchBar from '@/components/home/StickySearchBar'
import InspirationSection from '@/components/home/InspirationSection'
import CommunityGallerySection from '@/components/home/CommunityGallerySection'
import TravelCard from '@/components/trip/TravelCard'
import { getTrendingItems } from '@/lib/services/feedService'
import { getSearchAnalytics } from '@/lib/services/analyticsService'
import { buildSearchUrl } from '@/lib/utils/searchNavigation'

// pravatar.cc avatar IDs for the social-proof strip — verified reachable.
const AVATAR_IDS = [12, 25, 33, 47]

export default function Home() {
  const router = useRouter()
  const trending = getTrendingItems(4)
  const [totalSearches, setTotalSearches] = useState<number | null>(null)

  useEffect(() => {
    getSearchAnalytics().then((a) => setTotalSearches(a.totalSearches))
  }, [])

  const totalSaves = trending.reduce((sum, item) => sum + item.savesCount, 0)

  return (
    <div>
      <StickySearchBar />

      <HeroInspiration />

      {/* SEARCH MODES — moved right after the hero (was buried below the lifestyle
          sections, which meant real scrolling before reaching the actual form —
          see conversation history for why). StickySearchBar (above) still scrolls
          here for anyone who scrolls past it into the sections below. */}
      <section id="search-form" className="relative z-20 px-4 -mt-10 sm:-mt-12 mb-16 scroll-mt-24">
        <div className="max-w-xl mx-auto">
          <TravelSearchForm onSearch={(resolution) => router.push(buildSearchUrl(resolution))} />
        </div>
      </section>

      {/* ══════════════ LIFESTYLE INSPIRATION (curated, see each component's own comment on why there are no fake stats/testimonials) ══════════════ */}
      <InspirationSection />
      <CommunityGallerySection />

      <div className="text-center py-10">
        <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-widest">
          O explora destinos por región
        </p>
      </div>

      {/* INSPIRATIONAL FEED PREVIEW */}
      <section className="py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" /> Lo más guardado ahora
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Los viajes que más se están guardando ahora</p>
            </div>
            <Link href="/feed" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              Ver feed <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trending.map((item) => (
              <TravelCard key={item.id} item={item} variant="grid" />
            ))}
          </div>

          <Link href="/feed" className="flex sm:hidden items-center justify-center gap-1 mt-6 text-sm font-semibold text-blue-600 dark:text-blue-400">
            Ver feed completo <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* DESTINATIONS BY REGION */}
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass size={24} className="text-blue-600 dark:text-blue-400" /> Explora por región
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Ideas de viaje organizadas por continente</p>
            </div>
            <Link href="/explore" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              Explorar todo <ArrowRight size={14} />
            </Link>
          </div>

          <DestinationsByRegion />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center -space-x-3 mb-4">
            {AVATAR_IDS.map((n) => (
              <Image
                key={n}
                src={`https://i.pravatar.cc/64?img=${n}`}
                alt="Viajero de la comunidad VIALII"
                width={40}
                height={40}
                className="rounded-full border-2 border-white dark:border-slate-950 object-cover"
              />
            ))}
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-medium mb-8">
            Más de 15k jóvenes ya viajan con VIALII · $2.5B+ ahorrados en viajes
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {totalSearches !== null ? totalSearches.toLocaleString('es-CL') : '···'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">búsquedas hechas</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{totalSaves.toLocaleString('es-CL')}+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">viajes guardados</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">100%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">gratis para empezar</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Link href="/search">
            <Button size="lg">
              Empezar a buscar <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* NEWSLETTER — last section before the footer */}
      <section className="pb-16">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  )
}
