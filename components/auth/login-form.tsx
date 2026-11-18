'use client'

import { useActionState } from 'react'
import { signIn } from '@/lib/actions/auth'
import { Input } from '@/components/ui/input'
import { Field, FormMessage, SubmitButton } from '@/components/form-bits'

export function LoginForm({ next, confirmError }: { next: string; confirmError?: boolean }) {
  const [state, action] = useActionState(signIn, undefined)

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {confirmError && !state && (
        <FormMessage state={{ error: 'Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Silakan masuk atau daftar ulang.' }} />
      )}
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" required className="h-11" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Masukkan password" required className="h-11" />
      </Field>
      <SubmitButton pendingText="Memproses..." className="h-11 w-full text-base">
        Masuk
      </SubmitButton>
    </form>
  )
}
