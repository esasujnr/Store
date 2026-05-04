import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Filter, X } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useProducts, useCategories } from '@/hooks/useProducts'
import styles from './ShopPage.module.css'

const FULFILLMENT_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'fdm', label: 'FDM Digital' },
  { value: 'mjf', label: 'MJF 3D Printed' },
  { value: 'composite', label: 'Carbon Fiber' },
]

export default function ShopPage() {
  const { category: categorySlug } = useParams<{ category?: string }>()
  const [fulfillmentFilter, setFulfillmentFilter] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  const { data: products, isLoading } = useProducts(categorySlug)
  const { data: categories } = useCategories()

  // Fallback categories if Supabase not connected
  const fallbackCategories = [
    { id: '1', slug: 'carbon-fiber-parts', name: 'Carbon Fiber Parts' },
    { id: '2', slug: 'drone-frames', name: 'Drone Frames' },
    { id: '3', slug: 'escs', name: 'ESCs' },
    { id: '4', slug: 'filament', name: 'Filament' },
    { id: '5', slug: 'fpv-parts', name: 'FPV Parts' },
    { id: '6', slug: 'motors', name: 'Motors' },
    { id: '7', slug: 'propellers', name: 'Propellers' },
    { id: '8', slug: 'servos', name: 'Servos' },
  ]

  const displayCategories = categories?.length ? categories : fallbackCategories

  const currentCategory = displayCategories?.find(c => c.slug === categorySlug)

  const filtered = (products ?? [])
    .filter(p => !fulfillmentFilter || p.fulfillment_type === fulfillmentFilter)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <>
      <SEO
        title={currentCategory ? `${currentCategory.name} — Shop` : 'Shop All Products'}
        description="Browse our full range of drone frames, motors, ESCs, STL downloads, and carbon fiber parts."
        url={categorySlug ? `/shop/${categorySlug}` : '/shop'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          ...(currentCategory ? [{ name: currentCategory.name, url: `/shop/${categorySlug}` }] : []),
        ]}
      />

      <div className={styles.page}>
        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Categories</h3>
              <nav className={styles.categoryNav}>
                <Link
                  to="/shop"
                  className={`${styles.categoryLink} ${!categorySlug ? styles.categoryLinkActive : ''}`}
                >
                  All Products
                </Link>
                {displayCategories?.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/shop/${cat.slug}`}
                    className={`${styles.categoryLink} ${categorySlug === cat.slug ? styles.categoryLinkActive : ''}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>

              <h3 className={styles.sidebarTitle} style={{ marginTop: 'var(--space-8)' }}>Type</h3>
              <div className={styles.filterGroup}>
                {FULFILLMENT_FILTERS.map(f => (
                  <button
                    key={f.value}
                    className={`${styles.filterBtn} ${fulfillmentFilter === f.value ? styles.filterBtnActive : ''}`}
                    onClick={() => setFulfillmentFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </aside>

            {/* Main */}
            <main className={styles.main}>
              <div className={styles.header}>
                <div>
                  <h1 className={styles.pageTitle}>
                    {currentCategory?.name ?? 'All Products'}
                  </h1>
                  {!isLoading && (
                    <p className={styles.count}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {isLoading ? (
                <div className={styles.loading}>
                  <LoadingSpinner size={40} />
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                  <p>No products found.</p>
                  {fulfillmentFilter && (
                    <button className={styles.clearFilter} onClick={() => setFulfillmentFilter('')}>
                      <X size={14} /> Clear filter
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.grid}>
                  {filtered.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
