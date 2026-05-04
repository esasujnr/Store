import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Order } from '@/lib/database.types'

export function useOrders() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Order[]
    },
    enabled: !!user,
  })
}

export function useOrder(orderId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error
      return data as Order | null
    },
    enabled: !!orderId && !!user,
  })
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Order[]
    },
  })
}

export function useUpdateOrderShipping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      shippingStatus,
      trackingNumber,
    }: {
      orderId: string
      shippingStatus: string
      trackingNumber?: string
    }) => {
      const updatePayload: Record<string, string> = { shipping_status: shippingStatus }
      if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
