'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { setUserRole } from '@/lib/actions/admin'
import type { Role } from '@/lib/types'

export function RoleButton({ userId, name, role }: { userId: string; name: string; role: Role }) {
  const makeAdmin = role === 'user'
  return (
    <ConfirmDialog
      title={makeAdmin ? 'Jadikan Admin?' : 'Cabut akses Admin?'}
      description={
        makeAdmin
          ? `${name} akan mendapat akses penuh ke dashboard Admin.`
          : `${name} akan kembali menjadi pembeli biasa dan tidak dapat mengakses dashboard Admin.`
      }
      confirmLabel={makeAdmin ? 'Ya, jadikan Admin' : 'Ya, cabut akses'}
      onConfirm={() => setUserRole(userId, makeAdmin ? 'admin' : 'user')}
    >
      {makeAdmin ? 'Jadikan Admin' : 'Jadikan User'}
    </ConfirmDialog>
  )
}
