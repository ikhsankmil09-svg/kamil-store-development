import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Laporan' }

type Day = { day: string; orders_count: number; revenue: number }
type Top = { product_id: string | null; product_name: string; total_qty: number; total_revenue: number }

const RANGES = [7, 30, 90]

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: daysParam } = await searchParams
  const days = RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30

  const supabase = await createClient()
  const [{ data: report }, { data: top }] = await Promise.all([
    supabase.rpc('admin_sales_report', { p_days: days }),
    supabase.rpc('admin_top_products', { p_limit: 10 }),
  ])

  const rows = (report ?? []) as Day[]
  const topProducts = (top ?? []) as Top[]
  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0)
  const totalOrders = rows.reduce((s, r) => s + Number(r.orders_count), 0)
  const maxRevenue = Math.max(...rows.map((r) => Number(r.revenue)), 1)
  const activeRows = rows.filter((r) => Number(r.orders_count) > 0).reverse()

  return (
    <div>
      <PageHeader title="Laporan penjualan" description="Pesanan yang dibatalkan tidak dihitung.">
        <nav aria-label="Rentang waktu" className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/reports?days=${r}`}
              aria-current={r === days ? 'page' : undefined}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                r === days ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
              )}
            >
              {r} hari
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendapatan</p>
          <p className="mt-1 text-lg font-extrabold text-primary sm:text-2xl">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Jumlah pesanan</p>
          <p className="mt-1 text-lg font-extrabold sm:text-2xl">{totalOrders}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="grafik">
        <h2 id="grafik" className="mb-4 font-semibold">
          Pendapatan harian
        </h2>
        {totalOrders === 0 ? (
          <EmptyState icon={BarChart3} title="Belum ada penjualan" description={`Tidak ada pesanan dalam ${days} hari terakhir.`} className="border-0 py-8" />
        ) : (
          <div className="flex h-44 items-end gap-0.5 sm:gap-1" role="img" aria-label={`Grafik pendapatan harian ${days} hari terakhir`}>
            {rows.map((r) => (
              <div key={r.day} className="group relative flex h-full flex-1 items-end" title={`${formatDate(r.day)}: ${formatRupiah(r.revenue)}`}>
                <div
                  className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary"
                  style={{ height: `${Math.max((Number(r.revenue) / maxRevenue) * 100, Number(r.revenue) > 0 ? 3 : 0)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="rincian">
          <h2 id="rincian" className="mb-3 font-semibold">
            Rincian per hari
          </h2>
          {activeRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {activeRows.map((r) => (
                <li key={r.day} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    {formatDate(r.day)} <span className="text-muted-foreground">· {r.orders_count} pesanan</span>
                  </span>
                  <span className="font-semibold">{formatRupiah(r.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="terlaris">
          <h2 id="terlaris" className="mb-3 font-semibold">
            Produk terlaris (sepanjang waktu)
          </h2>
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
          ) : (
            <ol className="divide-y">
              {topProducts.map((p, i) => (
                <li key={`${p.product_id}-${p.product_name}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.product_name}</span>
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
