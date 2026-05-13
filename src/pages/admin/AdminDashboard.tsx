import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BadgePercent, MessageSquareQuote, Package, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { DEFAULT_CURRENCY, formatCurrency, formatDate } from '@/lib/utils'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, discounts, reviews] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount, currency, status, created_at').order('created_at', { ascending: false }),
        supabase.from('discounts').select('id, is_active', { count: 'exact' }),
        supabase.from('reviews').select('id, is_approved', { count: 'exact' }),
      ])

      type OrderRow = { id: string; total_amount: number; currency: string; status: string; created_at: string }
      type DiscountRow = { id: string; is_active: boolean }
      type ReviewRow = { id: string; is_approved: boolean }

      const orderRows: OrderRow[] = (orders.data as OrderRow[] | null) || []
      const discountRows: DiscountRow[] = (discounts.data as DiscountRow[] | null) || []
      const reviewRows: ReviewRow[] = (reviews.data as ReviewRow[] | null) || []

      const paidOrders = orderRows.filter(o => o.status === 'paid' || o.status === 'delivered')
      const revenueByCurrency = paidOrders.reduce<Record<string, number>>((acc, order) => {
        const current = acc[order.currency] || 0
        acc[order.currency] = current + order.total_amount
        return acc
      }, {})
      const revenueLabel = Object.entries(revenueByCurrency).length
        ? Object.entries(revenueByCurrency)
            .map(([currency, amount]) => formatCurrency(amount, currency))
            .join(' / ')
        : formatCurrency(0, DEFAULT_CURRENCY)

      return {
        productCount: products.count || 0,
        orderCount: orderRows.length,
        revenueLabel,
        activeDiscounts: discountRows.filter(discount => discount.is_active).length,
        hiddenReviews: reviewRows.filter(review => !review.is_approved).length,
        recentOrders: orderRows.slice(0, 5),
      }
    },
  })

  const cards = [
    { label: 'Total Products', value: stats?.productCount ?? '--', icon: <Package size={22} />, href: '/admin/products', color: 'blue' },
    { label: 'Total Orders', value: stats?.orderCount ?? '--', icon: <ShoppingCart size={22} />, href: '/admin/orders', color: 'green' },
    { label: 'Revenue', value: stats?.revenueLabel || '--', icon: <DollarSign size={22} />, href: '/admin/orders', color: 'yellow' },
    { label: 'Active Discounts', value: stats?.activeDiscounts ?? '--', icon: <BadgePercent size={22} />, href: '/admin/discounts', color: 'purple' },
    { label: 'Hidden Reviews', value: stats?.hiddenReviews ?? '--', icon: <MessageSquareQuote size={22} />, href: '/admin/reviews', color: 'teal' },
  ]

  return (
    <>
      <SEO title="Admin Dashboard" noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Store Control</span>
            <h1 className={styles.title}>See the health of the Wingxtra store at a glance.</h1>
            <p className={styles.subtitle}>
              Track catalog volume, promotions, reviews, live orders, and revenue signals from the same premium dashboard instead of bouncing through disconnected admin screens.
            </p>
          </div>
          <Link to="/admin/products/new" className={styles.quickAction}>
            Add a new product <ArrowRight size={16} />
          </Link>
        </section>

        <div className={styles.cards}>
          {cards.map(card => (
            <Link key={card.label} to={card.href} className={`${styles.card} ${styles[`card_${card.color}`]}`}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <div>
                <p className={styles.cardLabel}>{card.label}</p>
                <p className={styles.cardValue}>{card.value}</p>
              </div>
            </Link>
          ))}
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Orders</span>
                <h2>Recent orders</h2>
              </div>
              <Link to="/admin/orders" className={styles.viewAll}>View all</Link>
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Order ID</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {stats.recentOrders.map(order => (
                <Link key={order.id} to="/admin/orders" className={styles.tableRow}>
                  <span className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span>{formatDate(order.created_at)}</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                  <span className={`${styles.badge} ${styles[`badge_${order.status}`]}`}>
                    {order.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}