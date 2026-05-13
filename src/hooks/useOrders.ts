import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus, ShippingStatus } from '@/lib/database.types'

const orderSelect = '*, order_items(*, product:products(*, category:categories(*)))'
const adminOrderSelect = '*, profile:profiles(*), order_items(*, product:products(*, category:categories(*)))'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(orderSelect)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Order[]
    },
  })
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['order', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(orderSelect)
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data as Order | null
    },
  })
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(adminOrderSelect)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Order[]
    },
  })
}

export type OrderFulfillmentUpdate = {
  orderId: string
  status?: OrderStatus
  shippingStatus?: ShippingStatus
  trackingNumber?: string
  shippingCourier?: string
  trackingUrl?: string
  fulfillmentNotes?: string
  adminNotes?: string
}

function getNotificationEvent(input: OrderFulfillmentUpdate): string | null {
  if (input.status === 'cancelled') return 'order_cancelled'
  if (input.status === 'refunded') return 'order_refunded'
  if (input.shippingStatus === 'processing' || input.shippingStatus === 'ready_to_ship') return 'shipment_processing'
  if (input.shippingStatus === 'shipped') return 'shipment_shipped'
  if (input.shippingStatus === 'delivered') return 'order_delivered'
  return null
}

export function useUpdateOrderShipping() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrderFulfillmentUpdate) => {
      const payload: Record<string, unknown> = {}
      if (input.status) payload.status = input.status
      if (input.shippingStatus) payload.shipping_status = input.shippingStatus
      if (input.trackingNumber !== undefined) payload.tracking_number = input.trackingNumber
      if (input.shippingCourier !== undefined) payload.shipping_courier = input.shippingCourier
      if (input.trackingUrl !== undefined) payload.tracking_url = input.trackingUrl
      if (input.fulfillmentNotes !== undefined) payload.fulfillment_notes = input.fulfillmentNotes
      if (input.adminNotes !== undefined) payload.admin_notes = input.adminNotes
      if (input.shippingStatus === 'shipped') payload.shipped_at = new Date().toISOString()
      if (input.shippingStatus === 'delivered') payload.delivered_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', input.orderId)
        .select(adminOrderSelect)
        .single()
      if (error) throw error

      const eventType = getNotificationEvent(input)
      if (eventType) {
        supabase.functions.invoke('send-order-notification', {
          body: { order_id: input.orderId, event_type: eventType },
        }).catch(error => console.error('Order notification failed', error))
      }

      return data as Order
    },
    onSuccess: order => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', order.id] })
    },
  })
}
