import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  return (
    <div className={cn('relative aspect-square overflow-hidden bg-secondary', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src || '/placeholder.svg'} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-primary/40" role="img" aria-label={`${alt} (tanpa gambar)`}>
          <Package className="size-1/3" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
