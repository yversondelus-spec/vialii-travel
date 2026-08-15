import type { NextConfig } from "next";

// Anthropic is called server-side only (lib/ai/anthropic.ts), so the API
// itself never needs to appear in connect-src — only the browser-visible
// destinations below do.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js needs inline/eval for its own runtime in dev; 'unsafe-inline'
      // stays required in prod too until styled-jsx/inline event handlers are
      // fully removed from this codebase.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Supabase (auth/db) + the live exchange-rate API used by currencyService
      // + ipapi.co (best-effort IP geolocation for the search form's origin
      // field, see lib/utils/detectOrigin.ts).
      "connect-src 'self' https://*.supabase.co https://open.er-api.com https://ipapi.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
};

export default nextConfig;
