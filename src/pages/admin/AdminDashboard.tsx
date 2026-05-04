import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: false }),
      ])

      type OrderRow = { id: string; total_amount: number; status: string; created_at: string }
      const orderRows: OrderRow[] = (orders.data as OrderRow[] | null) || []
      const revenue = orderRows
        .filter(o => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0)

      return {
        productCount: products.count || 0,
        orderCount: orderRows.length,
        revenue,
        recentOrders: orderRows.slice(0, 5),
      }
    },
  })

  const cards = [
    { label: 'Total Products', value: stats?.productCount ?? '—', icon: <Package size={22} />, href: '/admin/products', color: 'blue' },
    { label: 'Total Orders', value: stats?.orderCount ?? '—', icon: <ShoppingCart size={22} />, href: '/admin/orders', color: 'green' },
    { label: 'Revenue', value: stats ? formatCurrency(stats.revenue) : '—', icon: <DollarSign size={22} />, href: '/admin/orders', color: 'yellow' },
    { label: 'Active', value: 'Live', icon: <TrendingUp size={22} />, href: '/', color: 'teal' },
  ]

  return (
    <>
      <SEO title="Admin Dashboard" noIndex />
      <div>
        <h1 className={styles.title}>Dashboard</h1>
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
              <h2>Recent Orders</h2>
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
                  <span>{formatCurrency(order.total_amount)}</span>
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
