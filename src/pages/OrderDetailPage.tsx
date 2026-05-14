import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Download, Package, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOrder } from '@/hooks/useOrders'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getFulfillmentLabel } from '@/lib/utils'
import styles from './OrderDetailPage.module.css'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const { data: order, isLoading, refetch } = useOrder(id)
  const verifiedRef = useRef(false)
  const [refreshingDownloadId, setRefreshingDownloadId] = useState<string | null>(null)

  useEffect(() => {
    const shouldVerify = params.get('verify') === '1' && id && !verifiedRef.current
    if (!shouldVerify) return
    verifiedRef.current = true
    const provider = params.get('provider') || order?.payment_provider || 'paystack'
    const reference = params.get('reference') || params.get('trxref') || params.get('transaction_id') || params.get('TransactionToken') || params.get('transaction_token') || id
    supabase.functions.invoke('verify-payment', {
      body: {
        provider,
        reference,
        order_id: id,
        transaction_id: params.get('transaction_id') || params.get('reference') || undefined,
        transaction_token: params.get('TransactionToken') || params.get('transaction_token') || undefined,
      },
    })
      .then(({ data, error }) => {
        if (error || !data?.success) throw error || new Error(data?.error || 'Payment verification failed')
        toast.success('Payment verified')
        refetch()
      })
      .catch(error => {
        console.error(error)
        toast.error('Payment could not be verified yet')
      })
  }, [id, order?.payment_provider, params, refetch])

  async function refreshDownload(orderItemId: string) {
    setRefreshingDownloadId(orderItemId)
    try {
      const { data, error } = await supabase.functions.invoke('generate-download', {
        body: { order_item_id: orderItemId },
      })
      if (error || !data?.url) throw error || new Error(data?.error || 'Download link could not be generated')
      await refetch()
      window.open(data.url as string, '_blank', 'noopener,noreferrer')
      toast.success('Secure download link refreshed')
    } catch (error) {
      console.error(error)
      toast.error('Could not refresh this download link')
    } finally {
      setRefreshingDownloadId(null)
    }
  }

  if (isLoading) return <LoadingSpinner fullPage />
  if (!order) return <div className={styles.page}><div className="container"><h1>Order not found</h1><Link to="/orders">Back to orders</Link></div></div>

  return (
    <>
      <SEO title={`Order #${order.id.slice(0, 8).toUpperCase()}`} noIndex />
      <div className={styles.page}>
        <div className="container">
          <Link to="/orders" className={styles.back}>Back to orders</Link>
          <section className={styles.hero}>
            <div>
              <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
              <h1>{formatCurrency(order.total_amount, order.currency)}</h1>
              <p>Placed {formatDate(order.created_at)}. Payment status: <strong>{order.status}</strong></p>
            </div>
            {order.has_physical && <div className={styles.shipping}><Truck size={22} /><strong>{order.shipping_status}</strong><span>{order.tracking_number || 'Tracking not added yet'}</span></div>}
          </section>

          <section className={styles.items}>
            <h2>Items</h2>
            {order.order_items?.map(item => (
              <div key={item.id} className={styles.item}>
                <img src={item.product?.image_url || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=400&q=80'} alt={item.product?.name || 'Product'} />
                <div>
                  <h3>{item.product?.name || 'Product'}</h3>
                  <p>{getFulfillmentLabel(item.fulfillment_type)} x {item.quantity}</p>
                  {item.fulfillment_type === 'fdm' && order.status === 'paid' && (
                    <div className={styles.downloadActions}>
                      {item.download_url && <a href={item.download_url} target="_blank" rel="noreferrer" className={styles.download}><Download size={15} /> Download current link</a>}
                      <button
                        type="button"
                        className={styles.refreshDownload}
                        onClick={() => refreshDownload(item.id)}
                        disabled={refreshingDownloadId === item.id}
                      >
                        {refreshingDownloadId === item.id ? 'Preparing link...' : 'Refresh secure link'}
                      </button>
                    </div>
                  )}
                </div>
                <strong>{formatCurrency(item.unit_price * item.quantity, order.currency)}</strong>
              </div>
            ))}
          </section>

          <section className={styles.timeline}>
            <h2>Fulfillment</h2>
            <div className={styles.timelineGrid}>
              <div><Package size={18} /><strong>Payment</strong><span>{order.status}</span></div>
              <div><Truck size={18} /><strong>Shipping</strong><span>{order.shipping_status}</span></div>
              <div><Download size={18} /><strong>Digital files</strong><span>{order.has_digital ? 'Available after verified payment' : 'Not required'}</span></div>
            </div>
          </section>
          <Link to="/shop"><Button>Continue shopping</Button></Link>
        </div>
      </div>
    </>
  )
}
