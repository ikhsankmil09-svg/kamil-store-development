'use client'

import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SubmitButton({
  children,
  pendingText = 'Memproses...',
  className,
  variant,
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
  variant?: React.ComponentProps<typeof Button>['variant']
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className} variant={variant} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? pendingText : children}
    </Button>
  )
}

export function FormMessage({ state, className }: { state: ActionState; className?: string }) {
  if (!state?.error && !state?.success) return null
  const isError = Boolean(state.error)
  const Icon = isError ? AlertCircle : CheckCircle2
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
        isError ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/30 bg-accent text-accent-foreground',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{state.error ?? state.success}</span>
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const nativeSelectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'
