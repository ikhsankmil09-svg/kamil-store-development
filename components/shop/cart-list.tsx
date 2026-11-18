'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { ProductImage } from '@/components/product-image'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { removeCartItem, updateCartQuantity } from '@/lib/actions/cart'
import { formatRupiah } from '@/lib/format'
import type { CartItemWithProduct } from '@/lib/types'

function CartRow({ item }: { item: CartItemWithProduct }) {
  const [pending, startTransition] = useTransition()
  const product = item.product
  if (!product) return null

  const change = (next: number) =>
    startTransition(async () => {
      const result = await updateCartQuantity(item.id, next)
      if (result.error) toast.error(result.error)
    })

  const outOfStock = product.stock < item.quantity

  return (
    <li className="flex gap-3 rounded-2xl border bg-card p-3 sm:gap-4 sm:p-4">
      <div className="w-20 shrink-0 sm:w-28">
        <ProductImage src={product.image_url} alt={product.name} className="rounded-xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/products/${product.id}`} className="line-clamp-2 font-semibold hover:underline">
              {product.name}
            </Link>
            <p className="text-sm text-muted-foreground">{formatRupiah(product.price)}</p>
          </div>
          <ConfirmDialog
            title="Hapus dari keranjang?"
            description={`"${product.name}" akan dihapus dari keranjang Anda.`}
            confirmLabel="Hapus"
            variant="ghost"
            size="icon"
            ariaLabel={`Hapus ${product.name}`}
            onConfirm={() => removeCartItem(item.id)}
          >
            <Trash2 className="text-destructive" aria-hidden="true" />
          </ConfirmDialog>
        </div>
        {outOfStock && (
          <p role="alert" className="text-xs font-medium text-destructive">
            Stok tersisa {product.stock}. Kurangi jumlah barang.
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center rounded-xl border">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Kurangi jumlah ${product.name}`}
              disabled={pending || item.quantity <= 1}
              onClick={() => change(item.quantity - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="flex w-9 items-center justify-center text-sm font-semibold tabular-nums" aria-live="polite">
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Tambah jumlah ${product.name}`}
              disabled={pending || item.quantity >= product.stock}
              onClick={() => change(item.quantity + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          <p className="font-bold">{formatRupiah(product.price * item.quantity)}</p>
        </div>
      </div>
    </li>
  )
}

export function CartList({ items }: { items: CartItemWithProduct[] }) {
  const valid = items.filter((i) => i.product)
  const total = valid.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)
  const hasProblem = valid.some((i) => !i.product || i.product.stock < i.quantity || i.product.stock < 1)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="flex flex-col gap-3">
        {valid.map((item) => (
          <CartRow key={item.id} item={item} />
        ))}
      </ul>
      <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Jumlah barang</dt>
            <dd className="font-medium">{valid.reduce((s, i) => s + i.quantity, 0)}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-extrabold text-primary">{formatRupiah(total)}</dd>
          </div>
        </dl>
        {hasProblem ? (
          <p className="mt-4 text-sm text-destructive">Perbaiki jumlah barang yang melebihi stok sebelum checkout.</p>
        ) : (
          <Link href="/checkout" className={`${buttonVariants({ size: 'lg' })} mt-4 h-11 w-full text-base`}>
            Lanjut ke checkout
          </Link>
        )}
      </aside>
    </div>
  )
}
