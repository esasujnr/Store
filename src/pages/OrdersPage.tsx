import { Link } from 'react-router-dom'
import { Package, Download, ChevronRight } from 'lucide-react'
import SEO from '@/components/SEO'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'
import styles from './OrdersPage.module.css'

const STATUS_COLORS: Record<string, string> = {
  pending: 'status-pending',
  paid: 'status-paid',
  processing: 'status-processing',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
  refunded: 'status-refunded',
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders()

  return (
    <>
      <SEO title="My Orders" url="/orders" noIndex />
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>My Orders</h1>

          {isLoading ? (
            <div className={styles.loading}><LoadingSpinner size={40} /></div>
          ) : !orders || orders.length === 0 ? (
            <div className={styles.empty}>
              <Package size={56} strokeWidth={1} />
              <h2>No orders yet</h2>
              <p>Your orders will appear here after checkout.</p>
              <Link to="/shop" className={styles.shopLink}>Start Shopping</Link>
            </div>
          ) : (
            <div className={styles.list}>
              {orders.map(order => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className={styles.orderCard}
                >
                  <div className={styles.orderInfo}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                    </div>
                    <div className={styles.orderTypes}>
                      {order.has_digital && (
                        <span className={styles.typePill}>
                          <Download size={11} /> Digital
                        </span>
                      )}
                      {order.has_physical && (
                        <span className={styles.typePill}>
                          <Package size={11} /> Physical
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.orderRight}>
                    <span className={`${styles.status} ${styles[STATUS_COLORS[order.status] || 'status-pending']}`}>
                      {order.status}
                    </span>
                    <span className={styles.amount}>{formatCurrency(order.total_amount)}</span>
                    <ChevronRight size={16} className={styles.arrow} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
