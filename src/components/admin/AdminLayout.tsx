import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Tag, ArrowLeft } from 'lucide-react'
import styles from './AdminLayout.module.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={17} />, end: true },
  { to: '/admin/products', label: 'Products', icon: <Package size={17} /> },
  { to: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={17} /> },
  { to: '/admin/categories', label: 'Categories', icon: <Tag size={17} /> },
]

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span>▲</span> Admin
        </div>
        <nav className={styles.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className={styles.back}>
          <ArrowLeft size={15} /> Back to Store
        </Link>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
