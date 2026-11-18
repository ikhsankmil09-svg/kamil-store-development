'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutDashboard, LogOut, Menu, Package, ReceiptText, Store, Tags, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/categories', label: 'Kategori', icon: Tags },
  { href: '/admin/orders', label: 'Pesanan', icon: ReceiptText },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Navigasi Admin" className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-accent',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
      <Link href="/" onClick={onNavigate} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-accent">
        <Store className="size-4" aria-hidden="true" />
        Lihat toko
      </Link>
      <form action={signOut}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10">
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </button>
      </form>
    </nav>
  )
}

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-card p-4 lg:flex">
      <BrandLogo />
      <NavList />
    </aside>
  )
}

export function AdminTopbar({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Buka menu" />}>
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetTitle className="sr-only">Menu Admin</SheetTitle>
            <div className="mb-4">
              <BrandLogo />
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-primary">Admin</span>
      </div>
      <p className="hidden text-sm text-muted-foreground lg:block">Panel Admin KAMIL STORE</p>
      <p className="truncate text-sm font-medium">{name}</p>
    </header>
  )
}
