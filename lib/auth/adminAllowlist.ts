// Simple hardcoded allowlist for the demo admin dashboard — no real "role"
// system exists (that would live in Supabase, which isn't a live project
// right now; see lib/auth/authContext.tsx). Configure real admins via
// NEXT_PUBLIC_ADMIN_EMAILS (comma-separated) in .env.local.
//
// NOTE: this is a client-side gate only — it hides the /admin UI, it does
// not by itself protect the underlying data. Before this ships against a
// live Supabase project, the analytics/invoice/email-log queries the admin
// page calls must also be restricted server-side (RLS policies keyed off a
// real admin role), or any signed-in user could call those functions
// directly and get the data regardless of what this function returns.

const DEFAULT_ADMIN_EMAILS = ['admin@travelai.demo']

const configuredAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const normalized = email.toLowerCase()
  // Self-test shortcut (any address containing "+admin@" is treated as an
  // admin) — convenient in development, but must never apply in production:
  // it would let anyone sign up with e.g. you+admin@gmail.com and get in.
  if (process.env.NODE_ENV !== 'production' && normalized.includes('+admin@')) return true
  return [...DEFAULT_ADMIN_EMAILS, ...configuredAdmins].includes(normalized)
}
