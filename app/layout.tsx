import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const font = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'KAMIL STORE - Toko Online Sederhana & Terpercaya',
    template: '%s | KAMIL STORE',
  },
  description:
    'KAMIL STORE adalah toko online modern: telusuri katalog, simpan ke keranjang, dan pesan dengan mudah dari HP maupun laptop.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="light">
      <body className={`${font.className} antialiased`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
