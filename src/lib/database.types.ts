export type FulfillmentType = 'fdm' | 'mjf' | 'composite'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type ShippingStatus = 'not_required' | 'pending' | 'processing' | 'shipped' | 'delivered'
export type UserRole = 'customer' | 'admin'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string
  shipping_addresses: ShippingAddress[]
  created_at: string
  updated_at: string
}

export interface ShippingAddress {
  id: string
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  country: string
  postal_code: string
  is_default: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  fulfillment_type: FulfillmentType
  category_id: string | null
  image_url: string
  stl_file_path: string
  stock_count: number
  is_active: boolean
  weight_grams: number
  is_drone_product: boolean
  is_recommended_electronic: boolean
  tags: string[]
  specs: Record<string, string | number>
  created_at: string
  updated_at: string
  category?: Category
}

export interface ProductBundleItem {
  id: string
  drone_product_id: string
  electronic_product_id: string
  sort_order: number
  created_at: string
  electronic_product?: Product
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  payment_reference: string
  payment_provider: string
  total_amount: number
  currency: string
  has_digital: boolean
  has_physical: boolean
  shipping_address: ShippingAddress | null
  shipping_status: ShippingStatus
  tracking_number: string
  notes: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  fulfillment_type: FulfillmentType
  download_url: string
  download_expires_at: string | null
  download_count: number
  created_at: string
  product?: Product
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>>
      }
      product_bundle_items: {
        Row: ProductBundleItem
        Insert: Omit<ProductBundleItem, 'id' | 'created_at'>
        Update: Partial<Omit<ProductBundleItem, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
    }
  }
}
