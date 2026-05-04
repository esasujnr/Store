import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, ChevronDown, Package, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Drones', href: '/shop/drone-frames' },
  { label: 'Electronics', href: '/shop/motors' },
  { label: 'Carbon Fiber', href: '/shop/carbon-fiber-parts' },
]

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>▲</span>
            <span>VOLANT</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.desktopNav}>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            <Link to="/cart" className={styles.cartBtn} aria-label="Shopping cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
              )}
            </Link>

            {user ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userBtn}
                  onClick={() => setUserMenuOpen(v => !v)}
                  aria-label="User menu"
                >
                  <User size={18} />
                  <span className={styles.userName}>
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown size={14} className={userMenuOpen ? styles.chevronOpen : ''} />
                </button>
                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={15} /> Admin
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className={styles.dropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={15} /> Profile
                    </Link>
                    <Link
                      to="/orders"
                      className={styles.dropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package size={15} /> Orders
                    </Link>
                    <button className={`${styles.dropdownItem} ${styles.signOutBtn}`} onClick={handleSignOut}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={styles.signInBtn}>
                Sign In
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className={styles.mobileToggle}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className={styles.mobileMenu}>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
