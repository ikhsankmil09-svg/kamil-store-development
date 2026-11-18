'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ShoppingCart,
  User,
  UserPlus,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BrandLogo } from '@/components/brand-logo'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

type Props = {
  user: { name: string; isAdmin: boolean } | null
  cartCount: number
}

const LINKS = [
  { href: '/', label: 'Home', icon: Home, auth: false },
  { href: '/products', label: 'Produk', icon: Package, auth: false },
  { href: '/cart', label: 'Keranjang', icon: ShoppingCart, auth: true },
  { href: '/orders', label: 'Pesanan', icon: ReceiptText, auth: true },
  { href: '/profile', label: 'Profil', icon: User, auth: true },
]

export function NavLinks({ user, cartCount }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const links = LINKS.filter((l) => !l.auth || user)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <BrandLogo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                isActive(href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {href === '/cart' && cartCount > 0 && (
                <span className="ml-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-gold-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                  <LayoutDashboard aria-hidden="true" /> Admin
                </Link>
              )}
              <form action={signOut}>
                <Button type="submit" variant="outline" size="lg">
                  <LogOut aria-hidden="true" /> Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
                Masuk
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'lg' })}>
                Daftar
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && (
            <Link
              href="/cart"
              aria-label={`Keranjang, ${cartCount} barang`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), 'relative')}
            >
              <ShoppingCart aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Buka menu" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <div className="mt-2">
                <BrandLogo />
              </div>
              {user && <p className="truncate text-sm text-muted-foreground">Halo, {user.name}</p>}
              <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium',
                      isActive(href) ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                    {href === '/cart' && cartCount > 0 && (
                      <span className="ml-auto rounded-full bg-gold px-2 text-xs font-bold text-gold-foreground">{cartCount}</span>
                    )}
                  </Link>
                ))}
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                  >
                    <LayoutDashboard className="size-5" aria-hidden="true" /> Dashboard Admin
                  </Link>
                )}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                {user ? (
                  <form action={signOut}>
                    <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
                      <LogOut aria-hidden="true" /> Logout
                    </Button>
                  </form>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 w-full')}>
                      <LogIn aria-hidden="true" /> Masuk
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full')}>
                      <UserPlus aria-hidden="true" /> Daftar
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
