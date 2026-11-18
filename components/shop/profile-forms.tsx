'use client'

import { useActionState } from 'react'
import { changePassword, updateProfile } from '@/lib/actions/profile'
import { Input } from '@/components/ui/input'
import { Field, FormMessage, SubmitButton } from '@/components/form-bits'

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, action] = useActionState(updateProfile, undefined)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email" hint="Email tidak dapat diubah.">
        <Input id="email" value={email} readOnly disabled className="h-11" />
      </Field>
      <Field label="Nama lengkap" htmlFor="full_name">
        <Input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" required className="h-11" />
      </Field>
      <SubmitButton pendingText="Menyimpan..." className="h-11 w-full sm:w-fit">
        Simpan profil
      </SubmitButton>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Password baru" htmlFor="password" hint="Minimal 8 karakter, kombinasi huruf dan angka.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required className="h-11" />
      </Field>
      <Field label="Konfirmasi password baru" htmlFor="confirm_password">
        <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required className="h-11" />
      </Field>
      <SubmitButton pendingText="Menyimpan..." variant="outline" className="h-11 w-full sm:w-fit">
        Ubah password
      </SubmitButton>
    </form>
  )
}
