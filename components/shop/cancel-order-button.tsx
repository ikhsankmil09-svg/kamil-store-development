'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { cancelMyOrder } from '@/lib/actions/orders'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  return (
    <ConfirmDialog
      title="Batalkan pesanan?"
      description="Pesanan akan dibatalkan dan stok barang dikembalikan. Tindakan ini tidak dapat dibatalkan."
      confirmLabel="Ya, batalkan"
      onConfirm={() => cancelMyOrder(orderId)}
    >
      Batalkan pesanan
    </ConfirmDialog>
  )
}
