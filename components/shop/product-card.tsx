import Link from 'next/link'
import { ProductImage } from '@/components/product-image'
import { AddToCart } from '@/components/shop/add-to-cart'
import { formatRupiah } from '@/lib/format'
import type { ProductWithCategory } from '@/lib/types'

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const soldOut = product.stock < 1
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md">
      <Link href={`/products/${product.id}`} className="relative block" aria-label={`Lihat detail ${product.name}`}>
        <ProductImage src={product.image_url} alt={product.name} className="transition duration-300 group-hover:scale-105" />
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
            Stok habis
          </span>
        )}
        {!soldOut && product.stock <= 5 && (
          <span className="absolute top-2 left-2 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
            Sisa {product.stock}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {product.category && <p className="text-xs font-medium text-primary">{product.category.name}</p>}
        <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="mt-auto pt-2 text-base font-bold sm:text-lg">{formatRupiah(product.price)}</p>
        <div className="pt-2">
          <AddToCart productId={product.id} stock={product.stock} compact />
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: ProductWithCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
