import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BundleItem, Category, Discount, MarketplaceBrand, Product, ProductMedia, Review } from '@/lib/database.types'

const productSelect = '*, category:categories(*), marketplace_brand:marketplace_brands(*)'

function normalizeProduct(product: unknown): Product {
  const p = product as Product
  return {
    ...p,
    price: Number(p.price || 0),
    sale_price: p.sale_price == null ? null : Number(p.sale_price),
    stock_count: Number(p.stock_count || 0),
    weight_grams: Number(p.weight_grams || 0),
    tags: Array.isArray(p.tags) ? p.tags : [],
    specs: (p.specs || {}) as Record<string, unknown>,
  }
}

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(productSelect)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (categorySlug) query = query.eq('category.slug', categorySlug)

      const { data, error } = await query
      if (error) throw error
      return ((data || []) as unknown[]).map(normalizeProduct)
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(productSelect)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data ? normalizeProduct(data) : null
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      return (data || []) as Category[]
    },
  })
}

export function useBundleItems(productId: string) {
  return useQuery({
    queryKey: ['bundle-items', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundle_items')
        .select('*, product:products!product_bundle_items_electronic_product_id_fkey(*, category:categories(*))')
        .eq('drone_product_id', productId)
        .order('sort_order')
      if (error) return [] as BundleItem[]
      return ((data || []) as unknown[]).map(row => {
        const item = row as BundleItem
        return { ...item, product: item.product ? normalizeProduct(item.product) : null, electronic_product: item.product ? normalizeProduct(item.product) : null }
      })
    },
  })
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profile:profiles(id, full_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
      if (error) return [] as Review[]
      return (data || []) as Review[]
    },
  })
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profile:profiles(id, full_name, avatar_url), product:products(id, name, slug, image_url)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Review[]
    },
  })
}

export function useProductMedia(productId?: string, activeOnly = true) {
  return useQuery({
    queryKey: ['product-media', productId, activeOnly],
    enabled: Boolean(productId),
    queryFn: async () => {
      let query = supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order')
      if (activeOnly) query = query.eq('is_active', true)
      const { data, error } = await query
      if (error) return [] as ProductMedia[]
      return (data || []) as ProductMedia[]
    },
  })
}

export function useMarketplaceBrands(activeOnly = false) {
  return useQuery({
    queryKey: ['marketplace-brands', activeOnly],
    queryFn: async () => {
      let query = supabase.from('marketplace_brands').select('*').order('sort_order').order('name')
      if (activeOnly) query = query.eq('is_active', true)
      const { data, error } = await query
      if (error) return [] as MarketplaceBrand[]
      return (data || []) as MarketplaceBrand[]
    },
  })
}

export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Discount[]
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
