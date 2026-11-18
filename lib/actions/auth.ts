'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/format'
import type { ActionState } from '@/lib/types'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email wajib diisi.')
  .email('Format email tidak valid.')

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi.'),
})

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Nama lengkap minimal 2 karakter.')
      .max(100, 'Nama lengkap maksimal 100 karakter.'),
    email: emailSchema,
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

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: 'Email Anda belum dikonfirmasi. Cek kotak masuk email Anda lalu klik tautan konfirmasi.' }
    }
    if (error.status === 429 || error.code === 'over_request_rate_limit') {
      return { error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' }
    }
    if (error.code === 'invalid_credentials') {
      return { error: 'Email atau password salah.' }
    }
    return { error: 'Tidak dapat masuk saat ini. Silakan coba lagi.' }
  }

  revalidatePath('/', 'layout')
  redirect(safeNextPath(String(formData.get('next') ?? '')))
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const origin = h.get('origin') ?? `${proto}://${host}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // role TIDAK dikirim dari klien; trigger database yang menentukan role.
      data: { full_name: parsed.data.full_name },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === 'weak_password') return { error: 'Password terlalu lemah. Gunakan kombinasi huruf dan angka yang lebih panjang.' }
    if (error.code === 'email_address_invalid') return { error: 'Alamat email tidak dapat digunakan. Gunakan email yang valid.' }
    if (error.status === 429 || error.code?.startsWith('over_')) {
      return { error: 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.' }
    }
    return { error: 'Pendaftaran gagal. Silakan coba lagi.' }
  }

  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/')
  }

  return {
    success:
      'Pendaftaran berhasil. Kami telah mengirim tautan konfirmasi ke email Anda. Klik tautan tersebut, lalu masuk.',
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
