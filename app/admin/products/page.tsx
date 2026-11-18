import type { Metadata } from 'next'
import { Package, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ProductFormDialog } from '@/components/admin/product-form-dialog'
import { ProductImage } from '@/components/product-image'
import { deleteProduct } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/format'
import type { Category, ProductWithCategory } from '@/lib/types'

export const metadata: Metadata = { title: 'Produk' }

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, category:categories(id, name)').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
  ])
  const items = (products ?? []) as ProductWithCategory[]
  const cats = (categories ?? []) as Category[]

  return (
    <div>
      <PageHeader title="Kelola produk" description={`${items.length} produk terdaftar`}>
        <ProductFormDialog categories={cats} />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada produk" description="Tambahkan produk pertama Anda untuk mulai berjualan." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:gap-4 sm:p-4">
              <div className="w-16 shrink-0 sm:w-20">
                <ProductImage src={p.image_url} alt={p.name} className="rounded-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category?.name ?? 'Tanpa kategori'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-bold text-primary">{formatRupiah(p.price)}</span>
                  <span className={p.stock <= 5 ? 'font-medium text-destructive' : 'text-muted-foreground'}>Stok: {p.stock}</span>
                  {!p.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Disembunyikan</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <ProductFormDialog product={p} categories={cats} />
                <ConfirmDialog
                  title="Hapus produk?"
                  description={`"${p.name}" akan dihapus permanen dari katalog. Riwayat pesanan tetap tersimpan.`}
                  confirmLabel="Hapus"
                  variant="outline"
                  size="icon"
                  ariaLabel={`Hapus ${p.name}`}
                  onConfirm={deleteProduct.bind(null, p.id)}
                >
                  <Trash2 className="text-destructive" aria-hidden="true" />
                </ConfirmDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
