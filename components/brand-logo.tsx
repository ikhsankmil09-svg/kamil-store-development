import Link from 'next/link'
import { Store } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BrandLogo({ href = '/', className, label }: { href?: string; className?: string; label?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 font-bold tracking-tight', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Store className="size-5" aria-hidden="true" />
      </span>
      <span className="text-base leading-none">
        KAMIL <span className="text-primary">STORE</span>
        {label && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle text-[10px] font-semibold uppercase text-gold-foreground">{label}</span>}
      </span>
    </Link>
  )
}
