'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/actions/cart'

export function AddToCart({
  productId,
  stock,
  withQuantity = false,
  compact = false,
}: {
  productId: string
  stock: number
  withQuantity?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [pending, startTransition] = useTransition()
  const soldOut = stock < 1

  const submit = () =>
    startTransition(async () => {
      const result = await addToCart(productId, quantity)
      if (result.needsLogin) {
        toast.info('Silakan masuk untuk menambahkan ke keranjang.')
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      if (result.error) toast.error(result.error)
      else toast.success(result.success ?? 'Ditambahkan ke keranjang.')
      router.refresh()
    })

  return (
    <div className={withQuantity ? 'flex flex-col gap-3 sm:flex-row sm:items-center' : ''}>
      {withQuantity && !soldOut && (
        <div className="flex items-center self-start rounded-xl border">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Kurangi jumlah"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-10 text-center font-semibold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Tambah jumlah"
            disabled={quantity >= stock}
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      )}
      <Button
        type="button"
        onClick={submit}
        disabled={pending || soldOut}
        size={compact ? 'default' : 'lg'}
        className={compact ? 'w-full' : 'h-11 flex-1 text-base'}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
        {soldOut ? 'Stok habis' : pending ? 'Menambahkan...' : compact ? 'Tambah' : 'Tambah ke keranjang'}
      </Button>
    </div>
  )
}
