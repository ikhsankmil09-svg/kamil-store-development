import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { RoleButton } from '@/components/admin/role-button'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Pengguna' }

export default async function AdminUsersPage() {
  const me = await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
  const users = (data ?? []) as Profile[]

  return (
    <div>
      <PageHeader title="Data pengguna" description={`${users.length} akun terdaftar`} />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pengguna" />
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.full_name || '(tanpa nama)'}
                  {u.id === me.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(Anda)</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">Bergabung {formatDate(u.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    u.role === 'admin' ? 'bg-gold/25 text-gold-foreground' : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {u.role === 'admin' ? 'Admin' : 'User'}
                </span>
                {u.id !== me.id && <RoleButton userId={u.id} name={u.full_name || u.email} role={u.role} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
