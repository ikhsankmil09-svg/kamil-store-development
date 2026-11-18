import type { OrderStatus } from '@/lib/types'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value: number | string | null | undefined) {
  return rupiah.format(Number(value ?? 0))
}

export function formatDate(value: string | Date, withTime = false) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-sky-100 text-sky-800 border-sky-200',
  shipped: 'bg-violet-100 text-violet-800 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
}

export const ORDER_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[]

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

/** Hanya izinkan path internal untuk parameter `next` (cegah open redirect). */
export function safeNextPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }
  return value
}
