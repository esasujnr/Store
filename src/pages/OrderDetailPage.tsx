import { useParams, Link } from 'react-router-dom'
import { Download, Package, MapPin, ChevronLeft, Clock } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOrder } from '@/hooks/useOrders'
import { formatCurrency, formatDate, getFulfillmentLabel, isDigital } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import styles from './OrderDetailPage.module.css'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, refetch } = useOrder(id!)
  const { user } = useAuth()

  async function requestDownload(orderItemId: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ order_item_id: orderItemId }),
        }
      )
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
        refetch()
      } else {
        toast.error(data.error || 'Failed to generate download link')
      }
    } catch {
      toast.error('Failed to generate download link')
    }
  }

  if (isLoading) return <LoadingSpinner fullPage />

  if (!order) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20vh 0', color: 'var(--color-neutral-400)' }}>
      Order not found
    </div>
  )

  return (
    <>
      <SEO title={`Order #${order.id.slice(0, 8).toUpperCase()}`} noIndex />
      <div className={styles.page}>
        <div className="container">
          <Link to="/orders" className={styles.back}>
            <ChevronLeft size={16} /> Back to Orders
          </Link>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className={styles.date}>{formatDate(order.created_at)}</p>
            </div>
            <span className={`${styles.status} ${styles[`status_${order.status}`]}`}>
              {order.status}
            </span>
          </div>

          <div className={styles.grid}>
            {/* Items */}
            <section className={styles.section}>
              <h2>Items</h2>
              <div className={styles.items}>
                {order.order_items?.map(item => {
                  const digital = isDigital(item.fulfillment_type)
                  const hasValidUrl = item.download_url && item.download_expires_at
                    && new Date(item.download_expires_at) > new Date()

                  return (
                    <div key={item.id} className={styles.item}>
                      <img
                        src={item.product?.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={item.product?.name}
                        className={styles.itemImg}
                      />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.product?.name}</span>
                        <span className={styles.itemType}>
                          {digital ? <Download size={12} /> : <Package size={12} />}
                          {getFulfillmentLabel(item.fulfillment_type)}
                        </span>
                        <span className={styles.itemQty}>Qty: {item.quantity}</span>
                      </div>
                      <div className={styles.itemRight}>
                        <span className={styles.itemPrice}>{formatCurrency(item.unit_price * item.quantity)}</span>
                        {digital && order.status === 'paid' && (
                          hasValidUrl ? (
                            <a href={item.download_url} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline">
                                <Download size={13} /> Download
                              </Button>
                            </a>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => requestDownload(item.id)}>
                              <Clock size={13} /> Get Link
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Sidebar */}
            <div>
              {/* Summary */}
              <section className={styles.section}>
                <h2>Summary</h2>
                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Payment Ref</span>
                    <span className={styles.ref}>{order.payment_reference || '—'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Total</span>
                    <strong>{formatCurrency(order.total_amount)}</strong>
                  </div>
                  {order.has_physical && (
                    <div className={styles.summaryRow}>
                      <span>Shipping</span>
                      <span className={styles.shippingStatus}>{order.shipping_status}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className={styles.summaryRow}>
                      <span>Tracking</span>
                      <span>{order.tracking_number}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Shipping address */}
              {order.has_physical && order.shipping_address && (
                <section className={styles.section} style={{ marginTop: 'var(--space-4)' }}>
                  <h2>
                    <MapPin size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Shipping To
                  </h2>
                  <div className={styles.address}>
                    <p>{(order.shipping_address as { full_name?: string }).full_name}</p>
                    <p>{(order.shipping_address as { address_line1?: string }).address_line1}</p>
                    <p>
                      {(order.shipping_address as { city?: string }).city},{' '}
                      {(order.shipping_address as { state?: string }).state}
                    </p>
                    <p>{(order.shipping_address as { country?: string }).country}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
