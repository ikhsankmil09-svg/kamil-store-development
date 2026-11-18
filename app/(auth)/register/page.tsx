import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Daftar' }

export default function RegisterPage() {
  return (
    <AuthShell
      title="Buat akun baru"
      description="Daftar gratis untuk mulai berbelanja dan melacak pesanan Anda."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
