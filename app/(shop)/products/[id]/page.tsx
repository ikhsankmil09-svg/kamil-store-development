import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ProductImage } from '@/components/product-image'
import { AddToCart } from '@/components/shop/add-to-cart'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/format'
import type { ProductWithCategory } from '@/lib/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getProduct(id: string) {
  if (!UUID.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()
  return data as ProductWithCategory | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  return { title: product?.name ?? 'Produk tidak ditemukan', description: product?.description?.slice(0, 150) }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  return (
    <div>
      <Link href="/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke produk
      </Link>
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductImage src={product.image_url} alt={product.name} className="rounded-3xl border" />
        <div className="flex flex-col gap-4">
          {product.category && (
            <Link href={`/products?category=${product.category.id}`} className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{product.name}</h1>
          <p className="text-3xl font-extrabold text-primary">{formatRupiah(product.price)}</p>
          <p className="text-sm">
            {product.stock > 0 ? (
              <span className="font-medium text-primary">Stok tersedia: {product.stock}</span>
            ) : (
              <span className="font-medium text-destructive">Stok habis</span>
            )}
          </p>
          <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description || 'Belum ada deskripsi untuk produk ini.'}
          </div>
          <div className="mt-2">
            <AddToCart productId={product.id} stock={product.stock} withQuantity />
          </div>
        </div>
      </div>
    </div>
  )
}
