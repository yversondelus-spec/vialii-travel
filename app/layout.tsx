import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/auth/authContext'
import { CurrencyProvider } from '@/lib/currency/currencyContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'VIALII - Vive a tu manera',
  description: 'Red social inspiradora para viajeros jóvenes. Descubre, planifica y viaja a tu manera.',
  keywords: 'viajes, jóvenes, travel, planificación, destinos, viajeros',
}

// Runs before paint so the stored theme applies without a light->dark flash.
const themeInitScript = `
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CurrencyProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
