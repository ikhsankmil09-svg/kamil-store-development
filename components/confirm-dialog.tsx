'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type Result = { error?: string; success?: string } | void

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  onConfirm,
  children,
  variant = 'outline',
  size = 'sm',
  className,
  ariaLabel,
}: {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<Result>
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  className?: string
  ariaLabel?: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant={variant} size={size} className={className} aria-label={ariaLabel} disabled={pending} />}
      >
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm()
                if (result?.error) toast.error(result.error)
                else if (result?.success) toast.success(result.success)
              })
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
