export type Role = 'admin' | 'user'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'

export type Profile = {
  id: string
  full_name: string
  email: string
  role: Role
  created_at: string
}

export type Category = {
  id: string
  name: string
  created_at: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  description: string
  price: number
  stock: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductWithCategory = Product & {
  category: { id: string; name: string } | null
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

export type Order = {
  id: string
  user_id: string
  total_amount: number
  status: OrderStatus
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderWithItems = Order & { order_items: OrderItem[] }

export type CartItemWithProduct = {
  id: string
  quantity: number
  product: Pick<Product, 'id' | 'name' | 'price' | 'stock' | 'image_url' | 'is_active'> | null
}

export type ActionState = { error?: string; success?: string } | undefined
