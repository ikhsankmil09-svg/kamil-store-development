import type { Metadata } from 'next'
import { PageHeader } from '@/components/empty-state'
import { PasswordForm, ProfileForm } from '@/components/shop/profile-forms'
import { requireUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const profile = await requireUser('/profile')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profil saya" description={`Bergabung sejak ${formatDate(profile.created_at)}`}>
        <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {profile.role === 'admin' ? 'Admin' : 'Pembeli'}
        </span>
      </PageHeader>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="data-diri">
          <h2 id="data-diri" className="mb-4 text-lg font-semibold">
            Data diri
          </h2>
          <ProfileForm fullName={profile.full_name} email={profile.email} />
        </section>
        <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="keamanan">
          <h2 id="keamanan" className="mb-4 text-lg font-semibold">
            Keamanan
          </h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  )
}
