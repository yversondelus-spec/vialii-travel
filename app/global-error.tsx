'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

// Last-resort fallback: only fires when the root layout itself throws (auth
// provider, currency provider, etc.), which is why it renders its own
// <html>/<body> instead of relying on app/layout.tsx — that layout is
// exactly what may have just failed. Kept dependency-free on purpose: no
// Header/Footer/Button imports, since those pull in the same providers.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Unhandled root layout error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f1f5f9' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '28rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>VIALII no pudo cargar</h1>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Tuvimos un problema al iniciar la aplicación. Ya quedó registrado.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.625rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
            {error.digest && <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>ID: {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  )
}
