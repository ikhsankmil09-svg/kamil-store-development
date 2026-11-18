import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ReceiptText, XCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { CancelOrderButton } from '@/components/shop/cancel-order-button'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRupiah, shortId } from '@/lib/format'
import type { OrderWithItems } from '@/lib/types'

export const metadata: Metadata = { title: 'Pesanan saya' }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const profile = await requireUser('/orders')
  const { success } = await searchParams
  const supabase = await createClient()

  // Filter eksplisit user_id sebagai lapisan tambahan; RLS tetap menjadi pembatas utama.
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as OrderWithItems[]

  return (
    <div>
      <PageHeader title="Pesanan saya" description="Riwayat dan status pesanan Anda." />

      {success && (
        <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Pesanan berhasil dibuat. Terima kasih sudah berbelanja di KAMIL STORE!
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Belum ada pesanan" description="Pesanan yang Anda buat akan muncul di sini.">
          <Link href="/products" className={buttonVariants()}>
            Mulai belanja
          </Link>
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-semibold">Pesanan #{shortId(order.id)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at, true)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <ul className="divide-y px-4">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.product_name}</span>
                      <span className="text-muted-foreground">
                        {item.quantity} x {formatRupiah(item.price)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{formatRupiah(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Dikirim ke {order.shipping_name}</p>
                  <p className="font-bold">
                    Total: <span className="text-primary">{formatRupiah(order.total_amount)}</span>
                  </p>
                </div>
                {order.status === 'pending' && <CancelOrderButton orderId={order.id} />}
                {order.status === 'cancelled' && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <XCircle className="size-4" aria-hidden="true" /> Stok telah dikembalikan
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
