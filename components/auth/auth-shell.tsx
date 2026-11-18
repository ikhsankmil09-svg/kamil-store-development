import { BrandLogo } from '@/components/brand-logo'

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-secondary/50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground text-pretty">{description}</p>
          {children}
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
