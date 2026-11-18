'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/types'

const nameSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama lengkap minimal 2 karakter.').max(100, 'Nama lengkap maksimal 100 karakter.'),
})

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter.')
      .max(72, 'Password maksimal 72 karakter.')
      .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
      .regex(/[0-9]/, 'Password harus mengandung angka.'),
    confirm_password: z.string(),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: 'Konfirmasi password tidak sama.',
    path: ['confirm_password'],
  })

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = nameSchema.safeParse({ full_name: formData.get('full_name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi berakhir. Silakan masuk kembali.' }

  // Hanya kolom full_name yang boleh diubah (grant kolom + RLS); role tidak bisa diubah user.
  const { error } = await supabase.from('profiles').update({ full_name: parsed.data.full_name }).eq('id', user.id)
  if (error) return { error: 'Gagal menyimpan profil. Silakan coba lagi.' }

  revalidatePath('/', 'layout')
  return { success: 'Profil berhasil diperbarui.' }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === 'same_password') return { error: 'Password baru harus berbeda dari password lama.' }
    if (error.code === 'weak_password') return { error: 'Password terlalu lemah.' }
    return { error: 'Gagal mengubah password. Silakan coba lagi.' }
  }
  return { success: 'Password berhasil diubah.' }
}
