'use client'

import { useActionState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { Input } from '@/components/ui/input'
import { Field, FormMessage, SubmitButton } from '@/components/form-bits'

export function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined)

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Nama lengkap" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" placeholder="Nama Anda" required className="h-11" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" required className="h-11" />
      </Field>
      <Field label="Password" htmlFor="password" hint="Minimal 8 karakter, kombinasi huruf dan angka.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required className="h-11" />
      </Field>
      <Field label="Konfirmasi password" htmlFor="confirm_password">
        <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required className="h-11" />
      </Field>
      <SubmitButton pendingText="Mendaftarkan..." className="h-11 w-full text-base">
        Daftar
      </SubmitButton>
    </form>
  )
}
