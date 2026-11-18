'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { nativeSelectClass } from '@/components/form-bits'
import { updateOrderStatus } from '@/lib/actions/admin'
import { ORDER_STATUSES, STATUS_LABEL } from '@/lib/format'
import type { OrderStatus } from '@/lib/types'

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition()
  const locked = status === 'cancelled'

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Ubah status pesanan"
        value={status}
        disabled={pending || locked}
        className={`${nativeSelectClass} h-9 w-40`}
        onChange={(e) =>
          startTransition(async () => {
            const result = await updateOrderStatus(orderId, e.target.value)
            if (result.error) toast.error(result.error)
            else toast.success(result.success ?? 'Status diperbarui.')
          })
        }
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Menyimpan" />}
    </div>
  )
}
