import { clsx, type ClassValue } from 'clsx'
import type { Discount, FulfillmentType, InventoryPolicy, Product } from './database.types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export type SupportedCurrency = 'USD' | 'GHS' | 'NGN'
export type StoreRegion = 'international' | 'ghana' | 'nigeria'
export type PaymentProvider = 'paystack' | 'manual'

export const BASE_CURRENCY: SupportedCurrency = 'GHS'
export const DEFAULT_CURRENCY: SupportedCurrency = 'USD'
export const DEFAULT_STORE_REGION: StoreRegion = 'international'
export const SUPPORTED_CURRENCIES = ['USD', 'GHS', 'NGN'] as const

export const STORE_REGION_CONFIG: Record<StoreRegion, {
  key: StoreRegion
  label: string
  shortLabel: string
  currency: SupportedCurrency
  provider: PaymentProvider
  description: string
}> = {
  international: {
    key: 'international',
    label: 'International Store',
    shortLabel: 'International',
    currency: 'USD',
    provider: 'manual',
    description: 'USD storefront for international buyers while international checkout is being finalized.',
  },
  ghana: {
    key: 'ghana',
    label: 'Ghana Store',
    shortLabel: 'Ghana Store',
    currency: 'GHS',
    provider: 'paystack',
    description: 'GHS checkout for Ghanaian customers through Paystack.',
  },
  nigeria: {
    key: 'nigeria',
    label: 'Nigeria Store',
    shortLabel: 'Nigeria Store',
    currency: 'NGN',
    provider: 'manual',
    description: 'NGN storefront for Nigerian buyers while regional checkout is being finalized.',
  },
}

export const STORE_REGIONS = Object.keys(STORE_REGION_CONFIG) as StoreRegion[]

const CURRENCY_RATES_FROM_GHS: Record<SupportedCurrency, number> = {
  GHS: 1,
  USD: 0.068,
  NGN: 105,
}

export function normalizeCurrency(value?: string | null): SupportedCurrency {
  const upper = String(value || DEFAULT_CURRENCY).toUpperCase()
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency) ? upper as SupportedCurrency : DEFAULT_CURRENCY
}

export function normalizeStoreRegion(value?: string | null): StoreRegion {
  return STORE_REGIONS.includes(value as StoreRegion) ? value as StoreRegion : DEFAULT_STORE_REGION
}

export function getStoreRegionCurrency(region: StoreRegion): SupportedCurrency {
  return STORE_REGION_CONFIG[normalizeStoreRegion(region)].currency
}

export function getStoreRegionPaymentProvider(region: StoreRegion): PaymentProvider {
  return STORE_REGION_CONFIG[normalizeStoreRegion(region)].provider
}

export function getGatewayChargeCurrency(provider: PaymentProvider, displayCurrency: SupportedCurrency): SupportedCurrency {
  if (provider === 'paystack') return 'GHS'
  return displayCurrency
}

export function convertFromBaseCurrency(amount: number, currency: SupportedCurrency = DEFAULT_CURRENCY): number {
  const converted = Number(amount || 0) * CURRENCY_RATES_FROM_GHS[normalizeCurrency(currency)]
  return Number(converted.toFixed(2))
}

export function convertBaseAmountForGateway(amount: number, provider: PaymentProvider, displayCurrency: SupportedCurrency): number {
  return convertFromBaseCurrency(amount, getGatewayChargeCurrency(provider, displayCurrency))
}

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const normalized = normalizeCurrency(currency)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalized,
    maximumFractionDigits: normalized === 'NGN' ? 0 : 2,
  }).format(Number(amount || 0))
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(value: string, length = 120): string {
  if (!value || value.length <= length) return value
  return `${value.slice(0, length).trim()}...`
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function formatDate(value?: string | null): string {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export function getFulfillmentLabel(type: FulfillmentType | string): string {
  if (type === 'fdm') return 'Digital STL File'
  if (type === 'mjf') return 'MJF Printed Part'
  if (type === 'composite') return 'Composite Part'
  return 'Product'
}

export function getFulfillmentBadgeColor(type: FulfillmentType | string): string {
  if (type === 'fdm') return 'blue'
  if (type === 'mjf') return 'green'
  if (type === 'composite') return 'orange'
  return 'slate'
}

export function isDigital(type?: FulfillmentType | string | null): boolean {
  return type === 'fdm'
}

export function isPhysical(type?: FulfillmentType | string | null): boolean {
  return !!type && !isDigital(type)
}

export function getProductPrice(product: Product): number {
  const sale = Number(product.sale_price || 0)
  const regular = Number(product.price || 0)
  return sale > 0 && sale < regular ? sale : regular
}

export function isProductOnSale(product: Product): boolean {
  const sale = Number(product.sale_price || 0)
  return sale > 0 && sale < Number(product.price || 0)
}

export function calculateDiscountAmount(subtotalBase: number, discount: Discount | null): number {
  if (!discount) return 0
  if ((discount.minimum_order_amount || 0) > subtotalBase) return 0
  if (discount.discount_type === 'percent') return Number(Math.min(subtotalBase, subtotalBase * (discount.value / 100)).toFixed(2))
  return Number(Math.min(subtotalBase, discount.value).toFixed(2))
}

export function getInventoryPolicy(product: Product): InventoryPolicy {
  const policy = product.inventory_policy as InventoryPolicy | null | undefined
  if (policy === 'allow_backorder' || policy === 'made_to_order' || policy === 'deny') return policy
  return isDigital(product.fulfillment_type) ? 'made_to_order' : 'deny'
}

export function isInventoryTracked(product: Product): boolean {
  if (isDigital(product.fulfillment_type)) return false
  return product.track_inventory !== false
}

export function canPurchaseQuantity(product: Product, quantity = 1): boolean {
  if (!product.is_active) return false
  if (!isInventoryTracked(product)) return true
  const policy = getInventoryPolicy(product)
  if (policy === 'allow_backorder' || policy === 'made_to_order') return true
  return Number(product.stock_count || 0) >= quantity
}

export function isLowStock(product: Product): boolean {
  if (!isInventoryTracked(product)) return false
  const threshold = Number(product.low_stock_threshold ?? 3)
  return Number(product.stock_count || 0) > 0 && Number(product.stock_count || 0) <= threshold
}

export function getInventoryStatus(product: Product, quantity = 1) {
  const tracked = isInventoryTracked(product)
  const policy = getInventoryPolicy(product)
  const stock = Number(product.stock_count || 0)
  const canPurchase = canPurchaseQuantity(product, quantity)
  const leadTime = Number(product.lead_time_days || 0)

  if (!tracked) {
    return { tracked, policy, stock, canPurchase, label: isDigital(product.fulfillment_type) ? 'Instant download' : 'Available', tone: 'available' as const }
  }
  if (policy === 'made_to_order') {
    return { tracked, policy, stock, canPurchase, label: leadTime > 0 ? `Made to order - ${leadTime} day lead time` : 'Made to order', tone: 'madeToOrder' as const }
  }
  if (policy === 'allow_backorder' && stock <= 0) {
    return { tracked, policy, stock, canPurchase, label: 'Backorder available', tone: 'backorder' as const }
  }
  if (stock <= 0) {
    return { tracked, policy, stock, canPurchase: false, label: 'Out of stock', tone: 'out' as const }
  }
  if (isLowStock(product)) {
    return { tracked, policy, stock, canPurchase, label: `Low stock - ${stock} left`, tone: 'low' as const }
  }
  return { tracked, policy, stock, canPurchase, label: `${stock} in stock`, tone: 'available' as const }
}
