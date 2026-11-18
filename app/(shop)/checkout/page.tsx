import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/empty-state'
import { CheckoutForm } from '@/components/shop/checkout-form'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/format'
import type { CartItemWithProduct } from '@/lib/types'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const profile = await requireUser('/checkout')
  const supabase = await createClient()
  const { data } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(id, name, price, stock, image_url, is_active)')
    .order('created_at', { ascending: true })

  const items = ((data ?? []) as unknown as CartItemWithProduct[]).filter((i) => i.product)
  if (items.length === 0) redirect('/cart')

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)
  const invalid = items.some((i) => !i.product?.is_active || (i.product?.stock ?? 0) < i.quantity)

  return (
    <div>
      <PageHeader title="Checkout" description="Isi data pengiriman untuk menyelesaikan pesanan." />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-label="Data pengiriman">
          <CheckoutForm defaultName={profile.full_name} disabled={invalid} />
        </section>
        <aside className="h-fit rounded-2xl border bg-card p-5" aria-label="Ringkasan pesanan">
          <h2 className="text-lg font-semibold">Ringkasan pesanan</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {i.product?.name} <span className="text-muted-foreground">x{i.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">{formatRupiah((i.product?.price ?? 0) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-extrabold text-primary">{formatRupiah(total)}</span>
          </div>
          <Link href="/cart" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Ubah keranjang
          </Link>
        </aside>
      </div>
    </div>
  )
}
