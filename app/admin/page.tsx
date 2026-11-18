import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Banknote, Package, ReceiptText, Users } from 'lucide-react'
import { PageHeader } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRupiah, shortId } from '@/lib/format'
import type { Order } from '@/lib/types'

export const metadata: Metadata = { title: 'Dashboard' }

type Stats = {
  total_products: number
  total_orders: number
  total_users: number
  total_revenue: number
  pending_orders: number
  low_stock: number
}
type TopProduct = { product_id: string | null; product_name: string; total_qty: number; total_revenue: number }
type RecentOrder = Order & { profile: { full_name: string; email: string } | null }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const [{ data: stats }, { data: top }, { data: recent }] = await Promise.all([
    supabase.rpc('admin_dashboard_stats'),
    supabase.rpc('admin_top_products', { p_limit: 5 }),
    supabase
      .from('orders')
      .select('*, profile:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const s = (stats ?? {}) as Partial<Stats>
  const topProducts = (top ?? []) as TopProduct[]
  const recentOrders = (recent ?? []) as unknown as RecentOrder[]

  const cards = [
    { label: 'Total produk', value: String(s.total_products ?? 0), icon: Package },
    { label: 'Total pesanan', value: String(s.total_orders ?? 0), icon: ReceiptText },
    { label: 'Total pengguna', value: String(s.total_users ?? 0), icon: Users },
    { label: 'Total pendapatan', value: formatRupiah(s.total_revenue), icon: Banknote },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan operasional KAMIL STORE." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm">{label}</p>
            <p className="mt-0.5 text-lg font-extrabold break-words sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      {((s.pending_orders ?? 0) > 0 || (s.low_stock ?? 0) > 0) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {(s.pending_orders ?? 0) > 0 && (
            <Link href="/admin/orders" className="flex flex-1 items-center gap-2 rounded-xl border border-gold/50 bg-gold/15 px-4 py-3 text-sm font-medium">
              <ReceiptText className="size-4" aria-hidden="true" /> {s.pending_orders} pesanan menunggu diproses
            </Link>
          )}
          {(s.low_stock ?? 0) > 0 && (
            <Link href="/admin/products" className="flex flex-1 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" /> {s.low_stock} produk stok menipis (5 atau kurang)
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="terbaru">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="terbaru" className="font-semibold">
              Pesanan terbaru
            </h2>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
              Semua
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      #{shortId(o.id)} · {o.profile?.full_name || o.shipping_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at, true)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold">{formatRupiah(o.total_amount)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="terlaris">
          <h2 id="terlaris" className="mb-3 font-semibold">
            Produk terlaris
          </h2>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada penjualan.</p>
          ) : (
            <ol className="divide-y">
              {topProducts.map((p, i) => (
                <li key={`${p.product_id}-${p.product_name}`} className="flex items-center gap-3 py-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{p.product_name}</span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold">{p.total_qty} terjual</span>
                    <span className="text-xs text-muted-foreground">{formatRupiah(p.total_revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
