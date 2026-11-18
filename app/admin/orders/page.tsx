import type { Metadata } from 'next'
import Link from 'next/link'
import { ReceiptText } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { OrderStatusSelect } from '@/components/admin/order-status-select'
import { createClient } from '@/lib/supabase/server'
import { ORDER_STATUSES, STATUS_LABEL, formatDate, formatRupiah, shortId } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithItems } from '@/lib/types'

export const metadata: Metadata = { title: 'Pesanan' }

type AdminOrder = OrderWithItems & { profile: { full_name: string; email: string } | null }

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const filter = (ORDER_STATUSES as string[]).includes(status ?? '') ? (status as OrderStatus) : null

  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('*, order_items(*), profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
  if (filter) query = query.eq('status', filter)

  const { data } = await query
  const orders = (data ?? []) as unknown as AdminOrder[]

  const tabs: { href: string; label: string; active: boolean }[] = [
    { href: '/admin/orders', label: 'Semua', active: !filter },
    ...ORDER_STATUSES.map((s) => ({ href: `/admin/orders?status=${s}`, label: STATUS_LABEL[s], active: filter === s })),
  ]

  return (
    <div>
      <PageHeader title="Kelola pesanan" description={`${orders.length} pesanan`} />

      <nav aria-label="Filter status" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
              t.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Tidak ada pesanan" description="Pesanan dari pembeli akan muncul di sini." />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-semibold">Pesanan #{shortId(o.id)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at, true)}</p>
                </div>
                <OrderStatusSelect orderId={o.id} status={o.status} />
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="text-sm">
                  <p className="font-medium">{o.shipping_name}</p>
                  <p className="text-muted-foreground">{o.profile?.email}</p>
                  <p className="text-muted-foreground">{o.shipping_phone}</p>
                  <p className="mt-1 whitespace-pre-line">{o.shipping_address}</p>
                  {o.notes && <p className="mt-1 text-muted-foreground">Catatan: {o.notes}</p>}
                </div>
                <ul className="divide-y text-sm">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-1.5">
                      <span className="min-w-0 truncate">
                        {i.product_name} <span className="text-muted-foreground">x{i.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium">{formatRupiah(i.subtotal)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between pt-2 font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatRupiah(o.total_amount)}</span>
                  </li>
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
