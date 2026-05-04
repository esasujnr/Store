import { useState } from 'react'
import { Package, Download, ChevronDown, ChevronUp } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { useAdminOrders, useUpdateOrderShipping } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminOrders.module.css'

const SHIPPING_STATUSES = ['not_required', 'pending', 'processing', 'shipped', 'delivered']

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders()
  const updateShipping = useUpdateOrderShipping()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editTracking, setEditTracking] = useState<{ [id: string]: string }>({})

  function handleShippingUpdate(order: Order, newStatus: string) {
    updateShipping.mutate(
      {
        orderId: order.id,
        shippingStatus: newStatus,
        trackingNumber: editTracking[order.id] ?? order.tracking_number,
      },
      {
        onSuccess: () => toast.success('Shipping status updated'),
        onError: () => toast.error('Failed to update'),
      }
    )
  }

  return (
    <>
      <SEO title="Admin — Orders" noIndex />
      <div>
        <h1 className={styles.title}>Orders</h1>

        {isLoading ? (
          <p className={styles.loading}>Loading…</p>
        ) : (
          <div className={styles.list}>
            {orders?.map(order => (
              <div key={order.id} className={styles.order}>
                <button
                  className={styles.orderHeader}
                  onClick={() => setExpanded(e => e === order.id ? null : order.id)}
                >
                  <div className={styles.orderMeta}>
                    <span className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                    <div className={styles.typePills}>
                      {order.has_digital && <span className={styles.pill}>
                        <Download size={11} /> Digital
                      </span>}
                      {order.has_physical && <span className={styles.pill}>
                        <Package size={11} /> Physical
                      </span>}
                    </div>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={`${styles.badge} ${styles[`badge_${order.status}`]}`}>
                      {order.status}
                    </span>
                    <span className={styles.amount}>{formatCurrency(order.total_amount)}</span>
                    {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expanded === order.id && (
                  <div className={styles.orderBody}>
                    {/* Items */}
                    <div className={styles.items}>
                      {order.order_items?.map(item => (
                        <div key={item.id} className={styles.item}>
                          <img
                            src={item.product?.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=80'}
                            alt={item.product?.name}
                            className={styles.itemImg}
                          />
                          <div>
                            <p className={styles.itemName}>{item.product?.name}</p>
                            <p className={styles.itemMeta}>
                              {item.fulfillment_type.toUpperCase()} · Qty {item.quantity}
                            </p>
                          </div>
                          <span className={styles.itemPrice}>
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping controls */}
                    {order.has_physical && (
                      <div className={styles.shippingPanel}>
                        <h3>Shipping Status</h3>
                        <div className={styles.shippingControls}>
                          <select
                            className={styles.select}
                            value={order.shipping_status}
                            onChange={e => handleShippingUpdate(order, e.target.value)}
                          >
                            {SHIPPING_STATUSES.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className={styles.trackingInput}
                            placeholder="Tracking number"
                            value={editTracking[order.id] ?? order.tracking_number}
                            onChange={e => setEditTracking(t => ({ ...t, [order.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleShippingUpdate(order, order.shipping_status)}
                            loading={updateShipping.isPending}
                          >
                            Save
                          </Button>
                        </div>

                        {order.shipping_address && (
                          <div className={styles.shipAddr}>
                            <strong>Ship to:</strong>{' '}
                            {(order.shipping_address as { address_line1?: string; city?: string; state?: string }).address_line1},{' '}
                            {(order.shipping_address as { city?: string }).city},{' '}
                            {(order.shipping_address as { state?: string }).state}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
