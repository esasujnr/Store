import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, User, Menu, X, ChevronDown, Package, LogOut, Settings,
  LayoutDashboard, Plane, Cpu, Layers, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import styles from './Navbar.module.css'

type ProductCategory = {
  label: string
  href: string
  description: string
  Icon: typeof Plane
  image: string
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    label: 'Drones',
    href: '/shop/drone-frames',
    description: 'Race-ready frames, airframes & complete builds engineered for FPV performance.',
    Icon: Plane,
    image:
      'https://images.pexels.com/photos/442589/pexels-photo-442589.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    label: 'Electronics',
    href: '/shop/motors',
    description: 'Motors, ESCs, flight controllers and wiring — the brains and muscle of every build.',
    Icon: Cpu,
    image:
      'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    label: 'Carbon Fiber',
    href: '/shop/carbon-fiber-parts',
    description: 'Precision-cut carbon plates, arms and accessories. Lightweight. Stiff. Relentless.',
    Icon: Layers,
    image:
      'https://images.pexels.com/photos/2876034/pexels-photo-2876034.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]


export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductsOpen(false)
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openProducts() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setProductsOpen(true)
  }

  function closeProductsSoon() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setProductsOpen(false), 120)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <header className={`${styles.navbar} ${scrolled || productsOpen ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>▲</span>
            <span>VOLANT</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.desktopNav} aria-label="Primary">
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Shop
            </NavLink>

            {/* Products mega menu trigger */}
            <div
              className={styles.megaWrap}
              onMouseEnter={openProducts}
              onMouseLeave={closeProductsSoon}
            >
              <button
                type="button"
                className={`${styles.navLink} ${styles.megaTrigger} ${productsOpen ? styles.navLinkActive : ''}`}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                onClick={() => setProductsOpen(v => !v)}
              >
                Products
                <ChevronDown
                  size={14}
                  className={`${styles.megaChevron} ${productsOpen ? styles.megaChevronOpen : ''}`}
                />
              </button>

              {productsOpen && (
                <div className={styles.megaPanel} role="menu">
                  <div className={styles.megaSide}>
                    <div className={styles.megaSideHeader}>
                      <div className={styles.megaEyebrow}>Shop</div>
                      <Link
                        to="/shop"
                        className={styles.megaSideLink}
                        onClick={() => setProductsOpen(false)}
                      >
                        View all products
                      </Link>
                    </div>
                    <div className={styles.megaCategoryList}>
                      {PRODUCT_CATEGORIES.map(cat => {
                        const Icon = cat.Icon
                        return (
                          <Link
                            key={cat.href}
                            to={cat.href}
                            className={styles.megaCategoryItem}
                            onClick={() => setProductsOpen(false)}
                          >
                            <span className={styles.megaCategoryIcon}>
                              <Icon size={16} />
                            </span>
                            <span>{cat.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  <div className={styles.megaInner}>
                    <div className={styles.megaHeader}>
                      <div>
                        <div className={styles.megaEyebrow}>Catalog</div>
                        <h3 className={styles.megaTitle}>Explore the full lineup</h3>
                      </div>
                    </div>

                    <div className={styles.megaGrid}>
                      {PRODUCT_CATEGORIES.map(cat => {
                        const Icon = cat.Icon
                        return (
                          <Link
                            key={cat.href}
                            to={cat.href}
                            className={styles.megaCard}
                            onClick={() => setProductsOpen(false)}
                            role="menuitem"
                          >
                            <div className={styles.megaImageWrap}>
                              <img src={cat.image} alt="" loading="lazy" />
                              <div className={styles.megaImageOverlay} />
                              <div className={styles.megaIconBadge}>
                                <Icon size={16} />
                              </div>
                            </div>
                            <div className={styles.megaCardBody}>
                              <div className={styles.megaCardTitleRow}>
                                <span className={styles.megaCardTitle}>{cat.label}</span>
                                <ArrowRight size={14} className={styles.megaCardArrow} />
                              </div>
                              <p className={styles.megaCardDesc}>{cat.description}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          <nav className={styles.mobileMenu} aria-label="Mobile">

            {/* Mobile Products collapsible */}
            <button
              type="button"
              className={`${styles.mobileLink} ${styles.mobileProductsTrigger}`}
              aria-expanded={mobileProductsOpen}
              onClick={() => setMobileProductsOpen(v => !v)}
            >
              <span>Products</span>
              <ChevronDown
                size={16}
                className={mobileProductsOpen ? styles.megaChevronOpen : ''}
              />
            </button>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </NavLink>

            {mobileProductsOpen && (
              <div className={styles.mobileSubmenu}>
                {PRODUCT_CATEGORIES.map(cat => {
                  const Icon = cat.Icon
                  return (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      className={styles.mobileSubLink}
                      onClick={() => {
                        setMenuOpen(false)
                        setMobileProductsOpen(false)
                      }}
                    >
                      <span className={styles.mobileSubIcon}>
                        <Icon size={15} />
                      </span>
                      <span>
                        <span className={styles.mobileSubLabel}>{cat.label}</span>
                        <span className={styles.mobileSubDesc}>{cat.description}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

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
