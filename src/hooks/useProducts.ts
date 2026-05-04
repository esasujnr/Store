import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/lib/database.types'

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle()

        if (cat && (cat as { id: string }).id) {
          query = query.eq('category_id', (cat as { id: string }).id)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data as Product | null
    },
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Category[]
    },
  })
}

export function useBundleItems(droneProductId: string) {
  return useQuery({
    queryKey: ['bundle', droneProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundle_items')
        .select('*, electronic_product:products!electronic_product_id(*, category:categories(*))')
        .eq('drone_product_id', droneProductId)
        .order('sort_order')

      if (error) throw error
      return data
    },
    enabled: !!droneProductId,
  })
}
