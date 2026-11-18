import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Masuk' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  return (
    <AuthShell
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan belanja di KAMIL STORE."
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <LoginForm next={next ?? '/'} confirmError={error === 'confirm'} />
    </AuthShell>
  )
}
