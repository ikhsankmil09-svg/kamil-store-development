import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('id', user.id)
    .single()

  return (data as Profile | null) ?? null
})

export async function requireUser(next = '/') {
  const profile = await getCurrentProfile()
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`)
  return profile
}

/** Otorisasi sisi server untuk halaman/aksi Admin. RLS di database tetap menjadi lapisan utama. */
export async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?next=/admin')
  if (profile.role !== 'admin') redirect('/?denied=admin')
  return profile
}
