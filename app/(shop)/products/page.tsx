import type { Metadata } from 'next'
import Link from 'next/link'
import { PackageSearch, Search, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { ProductGrid } from '@/components/shop/product-card'
import { nativeSelectClass } from '@/components/form-bits'
import { createClient } from '@/lib/supabase/server'
import type { Category, ProductWithCategory } from '@/lib/types'

export const metadata: Metadata = { title: 'Produk' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q = '', category = '' } = await searchParams
  const term = q.replace(/[%_,()\\*]/g, ' ').trim().slice(0, 80)
  const categoryId = UUID.test(category) ? category : ''

  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  if (categoryId) query = query.eq('category_id', categoryId)

  const [{ data: products, error }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*').order('name'),
  ])

  const items = (products ?? []) as ProductWithCategory[]
  const cats = (categories ?? []) as Category[]
  const filtered = Boolean(term || categoryId)

  return (
    <div>
      <PageHeader title="Semua produk" description={`${items.length} produk ditemukan`} />

      <form method="get" role="search" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input name="q" defaultValue={term} placeholder="Cari produk..." aria-label="Cari produk" className="h-11 pl-9" />
        </div>
        <select name="category" defaultValue={categoryId} aria-label="Filter kategori" className={`${nativeSelectClass} h-11 sm:w-56`}>
          <option value="">Semua kategori</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" size="lg" className="h-11 flex-1 sm:flex-none">
            <Search aria-hidden="true" /> Cari
          </Button>
          {filtered && (
            <Link href="/products" className={`${buttonVariants({ variant: 'outline', size: 'lg' })} h-11`}>
              <X aria-hidden="true" /> Reset
            </Link>
          )}
        </div>
      </form>

      {error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Gagal memuat produk. Silakan muat ulang halaman.
        </div>
      ) : items.length > 0 ? (
        <ProductGrid products={items} />
      ) : (
        <EmptyState
          icon={PackageSearch}
          title={filtered ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          description={filtered ? 'Coba kata kunci atau kategori lain.' : 'Produk akan tampil di sini setelah Admin menambahkannya.'}
        >
          {filtered && (
            <Link href="/products" className={buttonVariants({ variant: 'outline' })}>
              Hapus filter
            </Link>
          )}
        </EmptyState>
      )}
    </div>
  )
}
