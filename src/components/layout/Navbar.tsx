import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, ShieldCheck, ShoppingCart, User, X } from 'lucide-react'
import { NAV_PRODUCT_CARDS, getBrandSlug, getProductBrand } from '@/lib/catalog'
import { useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import { useSiteContent } from '@/hooks/useSiteContent'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { getDefaultSiteContent } from '@/lib/siteContent'
import { STORE_REGION_CONFIG } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: globalContent } = useSiteContent('global_store', previewMode)
  const content = globalContent ?? getDefaultSiteContent('global_store')
  const { user, profile, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const { storeRegion, setStoreRegion } = useCurrency()
  const { data: productsData } = useProducts()
  const { data: brands } = useMarketplaceBrands(true)
  const navProducts = productsData?.length ? productsData : fallbackProducts
  const productCards = NAV_PRODUCT_CARDS.filter(card => card.value !== 'new_arrivals' && card.value !== 'brands')
  const maxBrandCards = Number.parseInt(content.navbar.maxBrandCards || '8', 10) || 8

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

    return [...byName.values()].sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name)).slice(0, maxBrandCards)
  }, [brands, maxBrandCards, navProducts])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Wingxtra Store">
          <img src="/brand/wingxtra-logo-white.svg" alt="Wingxtra" />
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {content.navbar.showShop && (
            <NavLink to="/shop" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>{content.navbar.shopLabel}</NavLink>
          )}
          {content.navbar.showNewArrivals && (
            <NavLink to="/collection/new-arrivals" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>{content.navbar.newArrivalsLabel}</NavLink>
          )}

          {content.navbar.showProducts && (
            <div className={styles.productsWrap} onMouseLeave={() => setProductsOpen(false)}>
              <button
                className={`${styles.navLink} ${styles.productsButton}`}
                onMouseEnter={() => setProductsOpen(true)}
                onClick={() => setProductsOpen(open => !open)}
                aria-expanded={productsOpen}
              >
                {content.navbar.productsLabel} <ChevronDown size={15} />
              </button>
              {productsOpen && (
                <div className={styles.megaPanel}>
                  <div className={styles.megaHeader}>
                    <span>{content.navbar.megaEyebrow}</span>
                    <h3>{content.navbar.megaTitle}</h3>
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
          )}

          {content.navbar.showBrands && (
            <div className={styles.productsWrap} onMouseLeave={() => setBrandsOpen(false)}>
              <button
                className={`${styles.navLink} ${styles.productsButton}`}
                onMouseEnter={() => setBrandsOpen(true)}
                onClick={() => setBrandsOpen(open => !open)}
                aria-expanded={brandsOpen}
              >
                {content.navbar.brandsLabel} <ChevronDown size={15} />
              </button>
              {brandsOpen && (
                <div className={`${styles.megaPanel} ${styles.brandPanel}`}>
                  <div className={styles.megaHeader}>
                    <span>{content.navbar.brandsEyebrow}</span>
                    <h3>{content.navbar.brandsTitle}</h3>
                    <Link to="/collection/brands" className={styles.panelLink} onClick={() => setBrandsOpen(false)}>{content.navbar.brandsViewAllLabel}</Link>
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
          )}
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
          {content.navbar.showShop && <Link to="/shop" onClick={() => setMenuOpen(false)}>{content.navbar.shopLabel}</Link>}
          {content.navbar.showNewArrivals && <Link to="/collection/new-arrivals" onClick={() => setMenuOpen(false)}>{content.navbar.newArrivalsLabel}</Link>}
          {content.navbar.showProducts && <div className={styles.mobileGroupTitle}>{content.navbar.productsLabel}</div>}
          {content.navbar.showProducts && productCards.map(card => (
            <Link key={card.value} to={card.href || '/shop'} onClick={() => setMenuOpen(false)}>{card.label}</Link>
          ))}
          {content.navbar.showBrands && <div className={styles.mobileGroupTitle}>{content.navbar.brandsLabel}</div>}
          {content.navbar.showBrands && <Link to="/collection/brands" onClick={() => setMenuOpen(false)}>{content.navbar.brandsViewAllLabel}</Link>}
          {content.navbar.showBrands && brandCards.map(brand => (
            <Link key={brand.slug} to={`/brand/${brand.slug}`} onClick={() => setMenuOpen(false)}>{brand.name}</Link>
          ))}
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
          {user ? <button onClick={() => { void signOut(); setMenuOpen(false) }}>Sign out</button> : <Link to="/login" onClick={() => setMenuOpen(false)}>Account</Link>}
        </div>
      )}
    </header>
  )
}
