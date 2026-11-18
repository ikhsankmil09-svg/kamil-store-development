import Link from 'next/link'
import { ArrowRight, PackageSearch, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ProductGrid } from '@/components/shop/product-card'
import { createClient } from '@/lib/supabase/server'
import type { Category, ProductWithCategory } from '@/lib/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>
}) {
  const { denied } = await searchParams
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').order('name'),
  ])

  const items = (products ?? []) as ProductWithCategory[]
  const cats = (categories ?? []) as Category[]

  return (
    <div className="flex flex-col gap-10">
      {denied === 'admin' && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Akses ditolak. Halaman Admin hanya dapat dibuka oleh akun dengan role Admin.
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-12 sm:py-16">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-gold/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-xl">
          <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
            Toko online terpercaya
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Belanja mudah di KAMIL STORE
          </h1>
          <p className="mt-3 text-base text-primary-foreground/90 text-pretty sm:text-lg">
            Temukan produk pilihan, simpan ke keranjang, dan pesan dalam hitungan menit dari HP maupun laptop.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className={`${buttonVariants({ size: 'lg' })} h-11 bg-background px-5 text-base text-primary hover:bg-background/90`}>
              Lihat semua produk <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Keunggulan" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Aman', text: 'Akun & pesanan Anda terlindungi.' },
          { icon: Truck, title: 'Pesanan terlacak', text: 'Pantau status pesanan kapan saja.' },
          { icon: Smartphone, title: 'Nyaman di HP', text: 'Tampilan responsif di semua layar.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {cats.length > 0 && (
        <section aria-labelledby="kategori">
          <h2 id="kategori" className="mb-3 text-xl font-bold">
            Kategori
          </h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:bg-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="terbaru">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="terbaru" className="text-xl font-bold">
            Produk terbaru
          </h2>
          <Link href="/products" className="text-sm font-semibold text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        {items.length > 0 ? (
          <ProductGrid products={items} />
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="Belum ada produk"
            description="Produk akan tampil di sini setelah Admin menambahkannya."
          />
        )}
      </section>
    </div>
  )
}
