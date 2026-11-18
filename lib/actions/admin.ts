'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ORDER_STATUSES } from '@/lib/format'
import type { ActionState } from '@/lib/types'

type Result = { error?: string; success?: string }

const UNAUTHORIZED: Result = { error: 'Akses ditolak. Hanya Admin yang dapat melakukan tindakan ini.' }

/** Lapisan 1: cek role di server. Lapisan 2 (utama): RLS & fungsi database. */
async function assertAdmin() {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin' ? profile : null
}

const uuid = z.string().uuid()

function friendlyDbError(message: string) {
  if (message.includes('row-level security') || message.includes('permission denied')) return UNAUTHORIZED.error!
  if (message.includes('categories_name_key')) return 'Nama kategori sudah digunakan.'
  return message
}

/* ---------------------------- Kategori ---------------------------- */

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(80, 'Nama kategori maksimal 80 karakter.'),
})

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await assertAdmin())) return UNAUTHORIZED
  const parsed = categorySchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const id = String(formData.get('id') ?? '')
  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('categories').update({ name: parsed.data.name }).eq('id', uuid.parse(id))
    : await supabase.from('categories').insert({ name: parsed.data.name })

  if (error) return { error: friendlyDbError(error.message) }
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  return { success: id ? 'Kategori diperbarui.' : 'Kategori ditambahkan.' }
}

export async function deleteCategory(id: string): Promise<Result> {
  if (!(await assertAdmin())) return UNAUTHORIZED
  if (!uuid.safeParse(id).success) return { error: 'Kategori tidak valid.' }
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: friendlyDbError(error.message) }
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  return { success: 'Kategori dihapus. Produk terkait menjadi tanpa kategori.' }
}

/* ----------------------------- Produk ----------------------------- */

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi.').max(150, 'Nama produk maksimal 150 karakter.'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter.'),
  price: z.coerce
    .number({ message: 'Harga harus berupa angka.' })
    .min(0, 'Harga tidak boleh negatif.')
    .max(999_999_999, 'Harga terlalu besar.'),
  stock: z.coerce
    .number({ message: 'Stok harus berupa angka.' })
    .int('Stok harus bilangan bulat.')
    .min(0, 'Stok tidak boleh negatif.')
    .max(1_000_000, 'Stok terlalu besar.'),
  category_id: z.union([z.string().uuid(), z.literal('')]),
  image_url: z.string().trim().max(500),
})

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await assertAdmin())) return UNAUTHORIZED

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    stock: formData.get('stock'),
    category_id: formData.get('category_id') ?? '',
    image_url: formData.get('image_url') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { image_url, category_id, ...rest } = parsed.data
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`
  if (image_url && !image_url.startsWith(allowedPrefix)) {
    return { error: 'URL gambar tidak valid. Unggah gambar melalui formulir.' }
  }

  const payload = {
    ...rest,
    category_id: category_id || null,
    image_url: image_url || null,
    is_active: formData.get('is_active') === 'on',
  }

  const id = String(formData.get('id') ?? '')
  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('products').update(payload).eq('id', uuid.parse(id))
    : await supabase.from('products').insert(payload)

  if (error) return { error: friendlyDbError(error.message) }
  revalidatePath('/', 'layout')
  return { success: id ? 'Produk diperbarui.' : 'Produk ditambahkan.' }
}

export async function deleteProduct(id: string): Promise<Result> {
  if (!(await assertAdmin())) return UNAUTHORIZED
  if (!uuid.safeParse(id).success) return { error: 'Produk tidak valid.' }
  const supabase = await createClient()
  const { error, count } = await supabase.from('products').delete({ count: 'exact' }).eq('id', id)
  if (error) return { error: friendlyDbError(error.message) }
  if (!count) return { error: 'Produk tidak ditemukan atau tidak dapat dihapus.' }
  revalidatePath('/', 'layout')
  return { success: 'Produk dihapus.' }
}

/* ----------------------------- Pesanan ---------------------------- */

export async function updateOrderStatus(orderId: string, status: string): Promise<Result> {
  if (!(await assertAdmin())) return UNAUTHORIZED
  if (!uuid.safeParse(orderId).success) return { error: 'Pesanan tidak valid.' }
  if (!(ORDER_STATUSES as string[]).includes(status)) return { error: 'Status tidak valid.' }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('orders')
    .update({ status }, { count: 'exact' })
    .eq('id', orderId)
  if (error) return { error: friendlyDbError(error.message) }
  if (!count) return { error: 'Pesanan tidak ditemukan.' }
  revalidatePath('/admin', 'layout')
  revalidatePath('/orders')
  return { success: 'Status pesanan diperbarui.' }
}

/* ----------------------------- Pengguna --------------------------- */

export async function setUserRole(userId: string, role: string): Promise<Result> {
  if (!(await assertAdmin())) return UNAUTHORIZED
  if (!uuid.safeParse(userId).success) return { error: 'Pengguna tidak valid.' }
  if (role !== 'admin' && role !== 'user') return { error: 'Role tidak valid.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role })
  if (error) return { error: friendlyDbError(error.message) }
  revalidatePath('/admin/users')
  return { success: 'Role pengguna diperbarui.' }
}
