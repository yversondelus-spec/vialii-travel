# VIALII

Plataforma de viajes con IA: descubrimiento de destinos, comparación de transporte, armado de paquetes (vuelo + hotel + actividades) y seguimiento del viaje.

Desde este pass, VIALII tiene su propio **Travel Engine** provider-agnóstico (interfaces por
vertical + adapters por proveedor + orquestador + ranking) en vez de depender directamente de
proveedores externos. Ver [ARCHITECTURE.md](ARCHITECTURE.md), [PROVIDERS.md](PROVIDERS.md) y
[API.md](API.md) para el detalle — este README se queda en el resumen operativo.

## Stack real

- **Framework:** Next.js 16.3 (App Router, Turbopack), React 19, TypeScript (strict)
- **Estilos:** Tailwind CSS v4 (config CSS-first vía `@theme` en `app/globals.css`)
- **Datos:** Supabase (Postgres) — el proyecto en `.env.local` no es uno real aún; todo lo que toca Supabase cae automáticamente a un almacenamiento local (`localStorage`) cuando no hay conectividad (ver "Patrón Supabase-first" abajo)
- **IA:** Anthropic API (`claude-sonnet-5`), llamada solo server-side desde `app/api/ai/recommendations` y desde el Travel Engine (`lib/travel-engine/ai/recommend.ts`, ver `POST /api/ai/recommend`)
- **Transporte real:** vuelos vía RapidAPI (Kiwi.com, siempre activo) y opcionalmente Duffel (desactivado por defecto, requiere `DUFFEL_API_KEY` — ver [PROVIDERS.md](PROVIDERS.md)), ambos detrás del Travel Engine con fallback automático a datos mock; buses y trenes son 100% mock (no hay proveedor real integrado todavía, y el Travel Engine no los cubre aún — ver ARCHITECTURE.md)
- **Auth:** implementación propia (`lib/auth/authContext.tsx`), no NextAuth
- **Pagos:** no hay integración real (Stripe u otro) — `/checkout` es una demo explícita que no cobra nada; por eso `DuffelFlightProvider.createOrder` reserva ("hold"), no cobra

Test runner: **Vitest** (`npm test`), cubriendo el Travel Engine (normalización, dedup, ranking, fallback). No hay Stripe/NextAuth/Sentry en el código — si ves esas menciones en documentación vieja, están desactualizadas.

## Empezar en local

```bash
npm install
cp .env.example .env.local   # y completa los valores reales
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa y qué hace cada una. Resumen:

| Variable | Requerida | Qué pasa si falta |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | La app no arranca — `lib/db/client.ts` lanza en el import |
| `ANTHROPIC_API_KEY` | Para `/discover`, `/api/ai/recommendations` y `/api/ai/recommend` | Esas rutas fallan; el resto de la app funciona igual |
| `NEXT_PUBLIC_ADMIN_EMAILS` | No | Nadie puede entrar a `/admin` |
| `FLIGHTS_KIWI_ENABLED` / `RAPIDAPI_KEY` | No | Vuelos caen a datos mock del Travel Engine |
| `FLIGHTS_DUFFEL_ENABLED` / `DUFFEL_API_KEY` | No | Duffel queda deshabilitado (default) — ver [PROVIDERS.md](PROVIDERS.md) |
| `LOG_LEVEL` | No | Por defecto `warn` en producción, `debug` en dev |

## Patrón "Supabase-first, fallback local"

Casi todo lo que lee/escribe datos de usuario (auth, viajes guardados, comentarios, alertas de precio) intenta Supabase primero y cae a `localStorage` solo cuando Supabase es realmente inalcanzable a nivel de red — no ante errores de credenciales o validación. Ver `lib/utils/supabaseCircuit.ts` y el comentario en `lib/auth/authContext.tsx` para el detalle. Esto significa que **hoy, sin credenciales reales de Supabase, la app funciona igual pero cada usuario solo ve sus propios datos en su propio navegador** — nada se comparte entre dispositivos ni persiste en un backend real.

## Estructura del proyecto

```
app/            Next.js App Router — páginas y API routes (app/api/*)
components/     Componentes React, organizados por feature
lib/
  travel-engine/  VIALII Travel Engine — providers, orquestador, ranking, IA (ver ARCHITECTURE.md)
  services/     Lógica de negocio (pre-existente; searchService/tripBuilder siguen aquí)
  providers/    Integraciones de transporte/hotel/actividad (mock + reales) — envueltas por lib/travel-engine
  db/           Cliente Supabase y queries
  auth/         Contexto de autenticación
  currency/     Contexto de multimoneda
  logger.ts     Logging centralizado
types/, lib/types/   Tipos TypeScript (ver nota abajo)
constants/      Datos estáticos (destinos, intereses, etc.)
```

> **Nota:** existen **tres** modelos normalizados para conceptos de viaje: `types/domain.ts` (flujo Discover), `lib/types/domain.ts` (flujo Search antiguo, ya nada lo produce) y `lib/travel-engine/core/models.ts` (nuevo, usado solo por `/api/flights/*`, `/api/hotels/search`, `/api/activities/search`). Es deuda técnica conocida y documentada, no un archivo duplicado por error — ver [ARCHITECTURE.md](ARCHITECTURE.md#tres-normalized-data-models--deliberately-not-by-accident) para por qué conviven los tres.

## Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # ESLint
npm test         # Vitest — lib/travel-engine/**/*.test.ts
npx tsc --noEmit --strict   # chequeo de tipos
```

## Deploy

Ver [`DEPLOYMENT.md`](DEPLOYMENT.md) para el checklist completo de producción.
