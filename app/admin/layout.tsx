import type { Metadata } from 'next'
import { AdminSidebar, AdminTopbar } from '@/components/admin/admin-nav'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin KAMIL STORE' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={profile.full_name} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
