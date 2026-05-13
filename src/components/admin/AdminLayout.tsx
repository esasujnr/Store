import { NavLink, Outlet, Link } from 'react-router-dom'
import { Boxes, GaugeCircle, Images, LayoutDashboard, MessageSquareQuote, Package, Percent, Rows3, Settings, ShoppingBag, Tags } from 'lucide-react'
import styles from './AdminLayout.module.css'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/discounts', label: 'Discounts', icon: Percent },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
  { to: '/admin/content', label: 'Store Content', icon: Settings },
  { to: '/admin/media', label: 'Product Media', icon: Images },
  { to: '/admin/brands', label: 'Brands', icon: Boxes },
  { to: '/admin/collections', label: 'Navigation', icon: Rows3 },
]

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.brand}>
          <img src="/brand/wingxtra-logo-white.svg" alt="Wingxtra" />
          <span>Admin</span>
        </Link>
        <nav className={styles.nav}>
          {links.map(link => {
            const Icon = link.icon
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                <Icon size={18} /> {link.label}
              </NavLink>
            )
          })}
        </nav>
        <div className={styles.status}><GaugeCircle size={18} /> Store control center</div>
      </aside>
      <main className={styles.main}><Outlet /></main>
    </div>
  )
}
