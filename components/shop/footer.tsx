import { BrandLogo } from '@/components/brand-logo'

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <BrandLogo />
        <p>&copy; {new Date().getFullYear()} KAMIL STORE. Belanja mudah, aman, dan nyaman.</p>
      </div>
    </footer>
  )
}
