import { useState } from 'react'
import { Save, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAdminOrders, useUpdateOrderShipping } from '@/hooks/useOrders'
import type { Order, OrderStatus, ShippingStatus } from '@/lib/database.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import styles from './AdminOrders.module.css'

const statusOptions: OrderStatus[] = ['pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded']
const shippingOptions: ShippingStatus[] = ['not_required', 'pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'returned']

function OrderCard({ order }: { order: Order }) {
  const updateOrder = useUpdateOrderShipping()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(order.shipping_status)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '')
  const [shippingCourier, setShippingCourier] = useState(order.shipping_courier || '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '')

  async function save() {
    try {
      await updateOrder.mutateAsync({ orderId: order.id, status, shippingStatus, trackingNumber, shippingCourier, trackingUrl })
      toast.success('Order updated')
    } catch (error) {
      console.error(error)
      toast.error('Could not update order')
    }
  }

  return (
    <article className={styles.orderCard}>
      <div className={styles.orderTop}>
        <div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><span>{formatDate(order.created_at)}</span></div>
        <div className={styles.amount}>{formatCurrency(order.total_amount, order.currency)}</div>
      </div>
      <div className={styles.items}>{order.order_items?.map(item => <span key={item.id}>{item.product?.name || 'Product'} x {item.quantity}</span>)}</div>
      <div className={styles.controls}>
        <label>Status<select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>{statusOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Shipping<select value={shippingStatus} onChange={e => setShippingStatus(e.target.value as ShippingStatus)}>{shippingOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Courier<input value={shippingCourier} onChange={e => setShippingCourier(e.target.value)} placeholder="DHL, FedEx, local courier" /></label>
        <label>Tracking #<input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} /></label>
        <label>Tracking URL<input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} /></label>
      </div>
      <Button onClick={save} loading={updateOrder.isPending}><Save size={15} /> Save and notify if needed</Button>
    </article>
  )
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders()
  return (
    <>
      <SEO title="Admin Orders" noIndex />
      <div className={styles.page}>
        <section className={styles.header}><span>Operations</span><h1>Orders</h1><p>Update shipping progress, tracking, and payment state. Shipment changes send customer notifications automatically.</p></section>
        {isLoading ? <LoadingSpinner /> : !orders?.length ? <div className={styles.empty}><Truck size={36} /> No orders yet.</div> : <div className={styles.list}>{orders.map(order => <OrderCard key={order.id} order={order} />)}</div>}
      </div>
    </>
  )
}
