import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { deepMergeContent, getDefaultSiteContent, type ContentKey, type SiteContentMap } from '@/lib/siteContent'
import type { SiteContent } from '@/lib/database.types'

export function useSiteContent<K extends ContentKey>(key: K, mode: 'published' | 'draft' = 'published') {
  return useQuery({
    queryKey: ['site-content', key, mode],
    queryFn: async () => {
      const baseQuery = () => supabase.from('site_content').select('*').eq('key', key).maybeSingle()

      if (mode === 'draft') {
        const { data, error } = await baseQuery()
        if (!error && data) {
          const row = data as SiteContent | null
          return deepMergeContent(getDefaultSiteContent(key), row?.content) as SiteContentMap[K]
        }
      }

      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', key)
        .eq('is_published', true)
        .maybeSingle()

      if (error) throw error
      const row = data as SiteContent | null
      return deepMergeContent(getDefaultSiteContent(key), row?.published_content || row?.content) as SiteContentMap[K]
    },
  })
}

export function useAdminSiteContent() {
  return useQuery({
    queryKey: ['admin-site-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('key')

      if (error) throw error

      const rows = ((data || []) as SiteContent[]).reduce<Partial<Record<ContentKey, SiteContent>>>((acc, row) => {
        if (row.key === 'home_page' || row.key === 'drones_page' || row.key === 'shop_page' || row.key === 'global_store' || row.key === 'product_page_template') {
          acc[row.key] = row
        }
        return acc
      }, {})

      return {
        home_page: { row: rows.home_page || null, content: deepMergeContent(getDefaultSiteContent('home_page'), rows.home_page?.content) },
        drones_page: { row: rows.drones_page || null, content: deepMergeContent(getDefaultSiteContent('drones_page'), rows.drones_page?.content) },
        shop_page: { row: rows.shop_page || null, content: deepMergeContent(getDefaultSiteContent('shop_page'), rows.shop_page?.content) },
        global_store: { row: rows.global_store || null, content: deepMergeContent(getDefaultSiteContent('global_store'), rows.global_store?.content) },
        product_page_template: { row: rows.product_page_template || null, content: deepMergeContent(getDefaultSiteContent('product_page_template'), rows.product_page_template?.content) },
      }
    },
  })
}
