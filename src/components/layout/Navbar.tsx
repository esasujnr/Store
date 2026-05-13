import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, Menu, ShoppingCart, User, X, LogOut, ShieldCheck } from 'lucide-react'
import { NAV_PRODUCT_CARDS, getBrandSlug, getProductBrand } from '@/lib/catalog'
import { useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { STORE_REGION_CONFIG } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const { user, profile, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const { storeRegion, setStoreRegion } = useCurrency()
  const { data: productsData } = useProducts()
  const { data: brands } = useMarketplaceBrands(true)
  const navProducts = productsData?.length ? productsData : fallbackProducts
  const productCards = NAV_PRODUCT_CARDS.filter(card => card.value !== 'new_arrivals' && card.value !== 'brands')

  const brandCards = useMemo(() => {
    const byName = new Map<string, { name: string; slug: string; description: string; image: string; count: number }>()

    for (const product of navProducts) {
      const name = getProductBrand(product)
      const slug = getBrandSlug(name, product.marketplace_brand?.slug)
      const existing = byName.get(name)
      byName.set(name, {
        name,
        slug,
        description: existing?.description || product.marketplace_brand?.description || `${name} products curated by Wingxtra.`,
        image:
          existing?.image ||
          product.image_url ||
          product.marketplace_brand?.logo_url ||
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
        count: (existing?.count || 0) + 1,
      })
    }

    for (const brand of brands || []) {
      const existing = byName.get(brand.name)
      byName.set(brand.name, {
        name: brand.name,
        slug: brand.slug,
        description: brand.description || existing?.description || `${brand.name} products curated by Wingxtra.`,
        image: existing?.image || brand.logo_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
        count: existing?.count || 0,
      })
    }

    return [...byName.values()].sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name)).slice(0, 8)
  }, [brands, navProducts])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Wingxtra Store">
          <img src="/brand/wingxtra-logo-white.svg" alt="Wingxtra" />
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/shop" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>Shop</NavLink>
          <NavLink to="/collection/new-arrivals" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>New Arrivals</NavLink>

          <div className={styles.productsWrap} onMouseLeave={() => setProductsOpen(false)}>
            <button
              className={`${styles.navLink} ${styles.productsButton}`}
              onMouseEnter={() => setProductsOpen(true)}
              onClick={() => setProductsOpen(open => !open)}
              aria-expanded={productsOpen}
            >
              Products <ChevronDown size={15} />
            </button>
            {productsOpen && (
              <div className={styles.megaPanel}>
                <div className={styles.megaHeader}>
                  <span>Collections</span>
                  <h3>Browse by UAV mission, platform, and technology</h3>
                </div>
                <div className={styles.megaGrid}>
                  {productCards.map(card => (
                    <Link key={card.value} to={card.href || '/shop'} className={styles.megaCard} onClick={() => setProductsOpen(false)}>
                      {card.image && (
                        <span className={styles.cardImage}>
                          <img src={card.image} alt="" loading="lazy" />
                        </span>
                      )}
                      <span className={styles.cardBody}>
                        <span className={styles.cardTitle}>{card.label}</span>
                        <span className={styles.cardDescription}>{card.description}</span>
                        <span className={styles.cardCta}>Explore</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.productsWrap} onMouseLeave={() => setBrandsOpen(false)}>
            <button
              className={`${styles.navLink} ${styles.productsButton}`}
              onMouseEnter={() => setBrandsOpen(true)}
              onClick={() => setBrandsOpen(open => !open)}
              aria-expanded={brandsOpen}
            >
              Brands <ChevronDown size={15} />
            </button>
            {brandsOpen && (
              <div className={`${styles.megaPanel} ${styles.brandPanel}`}>
                <div className={styles.megaHeader}>
                  <span>Brand partners</span>
                  <h3>Preview curated UAV brands</h3>
                  <Link to="/collection/brands" className={styles.panelLink} onClick={() => setBrandsOpen(false)}>View all brands</Link>
                </div>
                <div className={styles.brandGrid}>
                  {brandCards.map(brand => (
                    <Link key={brand.slug} to={`/brand/${brand.slug}`} className={styles.brandCard} onClick={() => setBrandsOpen(false)}>
                      <span className={styles.brandThumb}>
                        <img
                          src={brand.image}
                          alt=""
                          loading="eager"
                          onError={event => {
                            event.currentTarget.src = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'
                          }}
                        />
                      </span>
                      <span className={styles.brandInfo}>
                        <strong>{brand.name}</strong>
                        <small>{brand.count} product{brand.count === 1 ? '' : 's'}</small>
                        <span>{brand.description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className={styles.actions}>
          <label className={styles.storeSwitcher}>
            <span>Store</span>
            <select value={storeRegion} onChange={e => setStoreRegion(e.target.value as keyof typeof STORE_REGION_CONFIG)}>
              {Object.values(STORE_REGION_CONFIG).map(config => (
                <option key={config.key} value={config.key}>{config.shortLabel} - {config.currency}</option>
              ))}
            </select>
          </label>

          <Link to="/cart" className={styles.cartLink} aria-label="Cart">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span>{totalItems}</span>}
          </Link>

          {user ? (
            <div className={styles.account}>
              <Link to="/profile" className={styles.accountButton}>
                <User size={17} />
                <span>{profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}</span>
                {isAdmin && <strong>Admin</strong>}
              </Link>
              <div className={styles.accountMenu}>
                {isAdmin && <Link to="/admin"><ShieldCheck size={15} /> Admin</Link>}
                <Link to="/orders">Orders</Link>
                <button onClick={signOut}><LogOut size={15} /> Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className={styles.accountButton}><User size={17} /> Account</Link>
          )}

          <button className={styles.mobileToggle} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobilePanel}>
          <div className={styles.mobileHeader}>
            <img src="/brand/wingxtra-logo-white.svg" alt="Wingxtra" />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={22} /></button>
          </div>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/collection/new-arrivals" onClick={() => setMenuOpen(false)}>New Arrivals</Link>
          <div className={styles.mobileGroupTitle}>Products</div>
          {productCards.map(card => (
            <Link key={card.value} to={card.href || '/shop'} onClick={() => setMenuOpen(false)}>{card.label}</Link>
          ))}
          <div className={styles.mobileGroupTitle}>Brands</div>
          <Link to="/collection/brands" onClick={() => setMenuOpen(false)}>All Brands</Link>
          {brandCards.map(brand => (
            <Link key={brand.slug} to={`/brand/${brand.slug}`} onClick={() => setMenuOpen(false)}>{brand.name}</Link>
          ))}
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
          {user ? <button onClick={() => { void signOut(); setMenuOpen(false) }}>Sign out</button> : <Link to="/login" onClick={() => setMenuOpen(false)}>Account</Link>}
        </div>
      )}
    </header>
  )
}
