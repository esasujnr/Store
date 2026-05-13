export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ProfileRole = 'customer' | 'admin'
export type FulfillmentType = 'fdm' | 'mjf' | 'composite'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type ShippingStatus = 'not_required' | 'pending' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'returned'
export type InventoryPolicy = 'deny' | 'allow_backorder' | 'made_to_order'
export type ProductOrigin = 'wingxtra' | 'curated_brand' | 'partner_brand'
export type DeliveryType = 'digital_download' | 'physical_shipment' | 'made_to_order'
export type AdditiveManufacturingType = 'stl_digital_files' | 'fdm_printable_files' | 'mjf_printed_parts' | 'printed_accessories'

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
  postal_code?: string
  is_default?: boolean
}

export interface Profile {
  id: string
  full_name: string
  role: ProfileRole
  avatar_url?: string
  shipping_addresses: ShippingAddress[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  created_at?: string
}

export interface MarketplaceBrand {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  origin_type: ProductOrigin
  warranty_notes?: string | null
  is_active: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  sale_price?: number | null
  sale_label?: string | null
  fulfillment_type: FulfillmentType
  category_id?: string | null
  category?: Category | null
  brand_id?: string | null
  marketplace_brand?: MarketplaceBrand | null
  brand?: string | null
  product_family?: string | null
  product_origin?: ProductOrigin | string | null
  delivery_type?: DeliveryType | string | null
  additive_manufacturing_type?: AdditiveManufacturingType | string | null
  supplier_sku?: string | null
  warranty_notes?: string | null
  compatibility_notes?: string | null
  image_url: string
  stl_file_path?: string | null
  stock_count: number
  track_inventory?: boolean | null
  inventory_policy?: InventoryPolicy | string | null
  low_stock_threshold?: number | null
  lead_time_days?: number | null
  is_active: boolean
  weight_grams: number
  is_drone_product: boolean
  is_recommended_electronic: boolean
  is_new_arrival?: boolean | null
  tags: string[]
  specs: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProductMedia {
  id: string
  product_id: string
  media_type: 'image' | 'video' | 'manual' | 'blueprint' | 'attachment' | 'download' | string
  title: string
  description?: string | null
  url: string
  file_path?: string | null
  storage_path?: string | null
  mime_type?: string | null
  sort_order?: number
  is_primary?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface BundleItem {
  id: string
  drone_product_id: string
  electronic_product_id: string
  sort_order: number
  created_at: string
  product?: Product | null
  electronic_product?: Product | null
}

export interface Discount {
  id: string
  code: string
  description?: string | null
  discount_type: 'percent' | 'fixed'
  value: number
  minimum_order_amount: number
  max_uses?: number | null
  usage_limit: number | null
  used_count?: number | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string
  body: string
  is_approved: boolean
  created_at: string
  updated_at?: string
  product?: Product | null
  profile?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  fulfillment_type: FulfillmentType
  download_url?: string | null
  download_expires_at?: string | null
  download_count?: number
  created_at?: string
  product?: Product | null
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  payment_reference?: string | null
  payment_provider?: string | null
  total_amount: number
  currency: string
  discount_code?: string | null
  discount_amount?: number | null
  has_digital: boolean
  has_physical: boolean
  shipping_address?: ShippingAddress | Record<string, unknown> | null
  shipping_status: ShippingStatus
  tracking_number?: string | null
  shipping_courier?: string | null
  tracking_url?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  admin_notes?: string | null
  fulfillment_notes?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  profile?: Profile | null
}

export type SiteContentKey = 'home_page' | 'drones_page' | 'shop_page' | 'global_store' | 'product_page_template'

export interface SiteContent {
  id: string
  key: SiteContentKey | string
  content: Record<string, unknown>
  published_content?: Record<string, unknown> | null
  is_published: boolean
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface SiteContentRevision {
  id: string
  content_key: SiteContentKey | string
  title: string
  action: 'draft' | 'publish' | 'restore' | string
  content: Record<string, unknown>
  published_content?: Record<string, unknown> | null
  is_published: boolean
  created_by?: string | null
  created_at: string
}

export interface OrderNotification {
  id: string
  order_id: string
  event_type: string
  recipient_email: string
  subject: string
  status: 'sent' | 'failed'
  provider_response?: Record<string, unknown> | null
  error_message?: string | null
  created_at: string
}
