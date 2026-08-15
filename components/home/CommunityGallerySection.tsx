import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/common/Button'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'

// A photo grid of real curated destinations (see constants/destinations.ts),
// captioned only with the place itself — deliberately NOT styled as
// individual posts with fake usernames/avatars/captions. There's no real
// user-generated content system in this app yet (see the comment atop
// lib/services/feedService.ts), so presenting these as if a specific person
// posted them would be fabricated attribution, not a gallery.
const GALLERY_DESTINATION_IDS = ['santorini', 'tokyo', 'cartagena', 'bali', 'roma', 'cusco', 'sydney', 'amsterdam', 'phuket']

export function CommunityGallerySection() {
  const photos = GALLERY_DESTINATION_IDS.map((id) => FEATURED_DESTINATIONS.find((d) => d.id === id)).filter(
    (d): d is (typeof FEATURED_DESTINATIONS)[number] => d !== undefined
  )

  return (
    <section id="community-gallery" className="py-20 bg-slate-50 dark:bg-slate-900/50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Inspiración de la comunidad</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Los destinos que más se están guardando y compartiendo</p>
        </div>

        <div className="columns-2 sm:columns-3 gap-4 space-y-4">
          {photos.map((destination) => (
            <Link
              key={destination.id}
              href="/explore"
              className="group relative block break-inside-avoid rounded-xl overflow-hidden"
            >
              <div className="relative w-full aspect-[3/4]">
                <Image
                  src={destination.images.hero}
                  alt={destination.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 flex items-end p-3">
                <p className="text-white text-sm font-semibold">
                  {destination.name}, {destination.country}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 dark:text-slate-400 mb-4">¿Ya viviste tu próximo capítulo?</p>
          <Link href="/feed">
            <Button variant="outline">Comparte tu viaje en el feed</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CommunityGallerySection
