import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/empty-state'
import { CartList } from '@/components/shop/cart-list'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { CartItemWithProduct } from '@/lib/types'

export const metadata: Metadata = { title: 'Keranjang' }

export default async function CartPage() {
  await requireUser('/cart')
  const supabase = await createClient()
  const { data } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(id, name, price, stock, image_url, is_active)')
    .order('created_at', { ascending: true })

  const items = (data ?? []) as unknown as CartItemWithProduct[]

  return (
    <div>
      <PageHeader title="Keranjang belanja" description="Periksa kembali barang sebelum checkout." />
      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Keranjang masih kosong" description="Yuk, cari produk favorit Anda dan tambahkan ke keranjang.">
          <Link href="/products" className={buttonVariants()}>
            Mulai belanja
          </Link>
        </EmptyState>
      ) : (
        <CartList items={items} />
      )}
    </div>
  )
}
