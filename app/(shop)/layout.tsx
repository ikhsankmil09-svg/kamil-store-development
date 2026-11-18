import { Footer } from '@/components/shop/footer'
import { Navbar } from '@/components/shop/navbar'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <Footer />
    </div>
  )
}
