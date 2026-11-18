import { STATUS_LABEL, STATUS_STYLE } from '@/lib/format'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
