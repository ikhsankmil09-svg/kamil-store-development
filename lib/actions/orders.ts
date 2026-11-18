'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/types'

const checkoutSchema = z.object({
  shipping_name: z.string().trim().min(2, 'Nama penerima minimal 2 karakter.').max(100, 'Nama penerima terlalu panjang.'),
  shipping_phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, 'Nomor telepon harus 8-20 karakter (angka, +, atau -).'),
  shipping_address: z.string().trim().min(10, 'Alamat pengiriman minimal 10 karakter.').max(500, 'Alamat terlalu panjang.'),
  notes: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional(),
})

export async function createOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse({
    shipping_name: formData.get('shipping_name'),
    shipping_phone: formData.get('shipping_phone'),
    shipping_address: formData.get('shipping_address'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  // Item diambil dari keranjang di database, bukan dari input klien.
  const { data: cart } = await supabase.from('cart_items').select('product_id, quantity')
  if (!cart || cart.length === 0) return { error: 'Keranjang masih kosong. Tambahkan produk terlebih dahulu.' }

  const { data: orderId, error } = await supabase.rpc('create_order', {
    p_items: cart,
    p_shipping_name: parsed.data.shipping_name,
    p_shipping_phone: parsed.data.shipping_phone,
    p_shipping_address: parsed.data.shipping_address,
    p_notes: parsed.data.notes ?? null,
  })

  if (error || !orderId) {
    return { error: error?.message || 'Pesanan gagal dibuat. Silakan coba lagi.' }
  }

  revalidatePath('/', 'layout')
  redirect(`/orders?success=${orderId}`)
}

export async function cancelMyOrder(orderId: string): Promise<{ error?: string; success?: string }> {
  if (!z.string().uuid().safeParse(orderId).success) return { error: 'Pesanan tidak valid.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_my_order', { p_order_id: orderId })
  if (error) return { error: error.message }
  revalidatePath('/orders')
  return { success: 'Pesanan dibatalkan dan stok dikembalikan.' }
}
