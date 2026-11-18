'use client'

import { useActionState } from 'react'
import { createOrder } from '@/lib/actions/orders'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FormMessage, SubmitButton } from '@/components/form-bits'

export function CheckoutForm({ defaultName, disabled }: { defaultName: string; disabled: boolean }) {
  const [state, action] = useActionState(createOrder, undefined)

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Nama penerima" htmlFor="shipping_name">
        <Input id="shipping_name" name="shipping_name" defaultValue={defaultName} autoComplete="name" required className="h-11" />
      </Field>
      <Field label="Nomor telepon" htmlFor="shipping_phone">
        <Input id="shipping_phone" name="shipping_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required className="h-11" />
      </Field>
      <Field label="Alamat pengiriman" htmlFor="shipping_address" hint="Minimal 10 karakter: jalan, nomor, kota, kode pos.">
        <Textarea id="shipping_address" name="shipping_address" rows={3} autoComplete="street-address" required />
      </Field>
      <Field label="Catatan (opsional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} maxLength={300} />
      </Field>
      <SubmitButton pendingText="Membuat pesanan..." className="h-11 w-full text-base" >
        Buat pesanan
      </SubmitButton>
      {disabled && <p className="text-sm text-destructive">Periksa kembali keranjang Anda sebelum membuat pesanan.</p>}
    </form>
  )
}
