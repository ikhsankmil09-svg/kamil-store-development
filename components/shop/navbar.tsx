import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NavLinks } from '@/components/shop/nav-links'

export async function Navbar() {
  const profile = await getCurrentProfile()
  let cartCount = 0

  if (profile) {
    const supabase = await createClient()
    const { data } = await supabase.from('cart_items').select('quantity')
    cartCount = (data ?? []).reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <NavLinks
      user={profile ? { name: profile.full_name || profile.email, isAdmin: profile.role === 'admin' } : null}
      cartCount={cartCount}
    />
  )
}
