'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string; success?: string; needsLogin?: boolean }

const qtySchema = z.coerce.number().int('Jumlah harus bilangan bulat.').min(1, 'Jumlah minimal 1.').max(100, 'Jumlah maksimal 100.')
const idSchema = z.string().uuid()

export async function addToCart(productId: string, quantity: number): Promise<Result> {
  const id = idSchema.safeParse(productId)
  const qty = qtySchema.safeParse(quantity)
  if (!id.success) return { error: 'Produk tidak valid.' }
  if (!qty.success) return { error: qty.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { needsLogin: true, error: 'Silakan masuk terlebih dahulu.' }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, stock, is_active')
    .eq('id', id.data)
    .maybeSingle()

  if (!product || !product.is_active) return { error: 'Produk tidak tersedia.' }
  if (product.stock < 1) return { error: `Stok "${product.name}" habis.` }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .maybeSingle()

  const newQty = (existing?.quantity ?? 0) + qty.data
  if (newQty > product.stock) {
    return {
      error: `Stok "${product.name}" hanya tersisa ${product.stock}. Di keranjang Anda sudah ada ${existing?.quantity ?? 0}.`,
    }
  }

  const { error } = existing
    ? await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
    : await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: product.id, quantity: newQty })

  if (error) return { error: 'Gagal menambahkan ke keranjang. Silakan coba lagi.' }

  revalidatePath('/', 'layout')
  return { success: `"${product.name}" ditambahkan ke keranjang.` }
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<Result> {
  const id = idSchema.safeParse(itemId)
  const qty = qtySchema.safeParse(quantity)
  if (!id.success) return { error: 'Item tidak valid.' }
  if (!qty.success) return { error: qty.error.issues[0].message }

  const supabase = await createClient()
  const { data: item } = await supabase
    .from('cart_items')
    .select('id, product:products(name, stock, is_active)')
    .eq('id', id.data)
    .maybeSingle()

  const product = item?.product as unknown as { name: string; stock: number; is_active: boolean } | null
  if (!item || !product) return { error: 'Item keranjang tidak ditemukan.' }
  if (!product.is_active) return { error: 'Produk sudah tidak tersedia.' }
  if (qty.data > product.stock) return { error: `Stok "${product.name}" hanya tersisa ${product.stock}.` }

  const { error } = await supabase.from('cart_items').update({ quantity: qty.data }).eq('id', id.data)
  if (error) return { error: 'Gagal memperbarui jumlah.' }

  revalidatePath('/', 'layout')
  return { success: 'Jumlah diperbarui.' }
}

export async function removeCartItem(itemId: string): Promise<Result> {
  const id = idSchema.safeParse(itemId)
  if (!id.success) return { error: 'Item tidak valid.' }

  const supabase = await createClient()
  const { error } = await supabase.from('cart_items').delete().eq('id', id.data)
  if (error) return { error: 'Gagal menghapus item.' }

  revalidatePath('/', 'layout')
  return { success: 'Item dihapus dari keranjang.' }
}
