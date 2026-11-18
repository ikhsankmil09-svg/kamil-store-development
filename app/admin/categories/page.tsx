import type { Metadata } from 'next'
import { Tags, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CategoryFormDialog } from '@/components/admin/category-form-dialog'
import { deleteCategory } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export const metadata: Metadata = { title: 'Kategori' }

type CategoryRow = Category & { products: { count: number }[] }

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*, products(count)').order('name')
  const categories = (data ?? []) as CategoryRow[]

  return (
    <div>
      <PageHeader title="Kelola kategori" description={`${categories.length} kategori`}>
        <CategoryFormDialog />
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="Belum ada kategori" description="Buat kategori untuk mengelompokkan produk Anda." />
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.products?.[0]?.count ?? 0} produk</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <CategoryFormDialog category={c} />
                <ConfirmDialog
                  title="Hapus kategori?"
                  description={`Kategori "${c.name}" akan dihapus. Produk di dalamnya tidak ikut terhapus, tetapi menjadi tanpa kategori.`}
                  confirmLabel="Hapus"
                  variant="outline"
                  size="icon"
                  ariaLabel={`Hapus ${c.name}`}
                  onConfirm={deleteCategory.bind(null, c.id)}
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
