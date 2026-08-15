# Deployment checklist — VIALII

This reflects the actual state of the codebase as of this pass, not an aspirational stack. Read the "Known gaps" section before announcing a real launch — several items there are product decisions, not code fixes, and nothing below silently papers over them.

## Before you deploy

- [ ] `npx tsc --noEmit --strict` — 0 errors
- [ ] `npx eslint .` — 0 errors, 0 warnings
- [ ] `npm run build` — succeeds
- [ ] Real Supabase project created, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` point to it (see "Known gaps" — today's `.env.local` does not)
- [ ] Supabase tables + RLS policies exist for every table `lib/db/queries.ts` and `lib/services/*.ts` read/write: `users`, `saved_trips`, `trip_comments`, `price_alerts`, `payment_plans`, `invoices`, `user_profiles`, `search_cache`, `search_analytics`. None of this is defined in the repo — it has to be created in the Supabase dashboard/migrations before real accounts will work.
- [ ] `ANTHROPIC_API_KEY` set (server env, never `NEXT_PUBLIC_*`)
- [ ] `NEXT_PUBLIC_ADMIN_EMAILS` set to real admin addresses
- [ ] Confirm the RapidAPI (Kiwi flights) subscription is active if you want real flight data — as of this pass it was returning 402 Payment Required, so flights are silently serving mock data (graceful, but worth knowing before launch)
- [ ] Custom domain DNS pointed at the hosting provider

## Deploy (Vercel)

```bash
vercel login
vercel link                      # first time only

vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_ADMIN_EMAILS production
vercel env add RAPIDAPI_KEY production        # optional
vercel env add LOG_LEVEL production           # optional, defaults to "warn"

vercel deploy --prod
```

## After you deploy (first 24h)

- [ ] Open the production URL, run a search end-to-end, confirm no console errors
- [ ] Sign up a real account, confirm it persists (reload, log back in)
- [ ] Trigger `/error`'s condition once on purpose (or wait for a real one) and confirm `app/error.tsx` renders instead of a blank screen
- [ ] Visit a nonsense URL and confirm `app/not-found.tsx` renders
- [ ] Check currency auto-detection picks a sane default for a non-Chile IP/timezone
- [ ] Watch `LOG_LEVEL=warn` console output (or wherever your hosting provider surfaces server logs) for repeated errors

## Known gaps — read before calling this "production ready"

These are real, and none of them are something a lint pass fixes. They're listed so nothing here is a surprise post-launch, not because they need to be solved today.

1. **No live Supabase project.** `.env.local`'s Supabase credentials aren't a real project (the anon key isn't even a valid JWT — see the comment in `lib/auth/authContext.tsx`). Every "Supabase-first" call in this app is silently falling back to per-browser `localStorage`. That's fine for a demo; it means **zero real user data today**, and going live requires: creating the project, the tables above, RLS policies, and re-testing every flow against it.
2. **No server-side authorization.** The `/admin` gate (`lib/auth/adminAllowlist.ts`) is a client-side check only. Once real Supabase is wired up, the analytics/invoice/email-log queries it calls need RLS policies (or a server-only admin client) — right now nothing stops a signed-in user from calling those functions directly and getting the data regardless of the UI gate.
3. **Buses and trains are always mock data**, permanently — there's no real provider integration for them (`lib/providers/transport/busProvider.ts`, `trainProvider.ts`). Flights have a real integration (Kiwi via RapidAPI) with automatic mock fallback on failure.
4. **No real payments.** `/checkout` explicitly says "demo" on the page and charges nothing. Going live with paid plans means integrating a real processor (Stripe or similar) — that's new scope, not a hardening fix.
5. **No error-tracking service wired up.** `lib/logger.ts` centralizes logging and exposes `setErrorSink()` for exactly this, but nothing calls it yet — errors reach the console and a local ring buffer, not an external dashboard. Wire up Sentry (or similar) by calling `setErrorSink` once at startup with a real client if/when you want off-browser visibility.
6. **No rate limiting** on `/api/search` or `/api/ai/recommendations`. Both now validate their input shape, but neither throttles by IP/user. Adding real rate limiting needs a shared store (Upstash Redis is the common Vercel-friendly choice) — a business decision (which provider, what limits) as much as a code one.
7. **Two incompatible `domain.ts` type modules** (`types/domain.ts` vs `lib/types/domain.ts`) serving the Discover and Search flows respectively — see the README note. Not a bug today (nothing imports the wrong one), but a real foot-gun for future changes; worth a deliberate rename pass when there's room for it.
