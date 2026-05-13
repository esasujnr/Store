import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Boxes, Globe2 } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import { useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import { getBrandSlug, getProductBrand } from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import styles from './CollectionPage.module.css'

function titleFromSlug(slug: string) {
  return slug.split('-').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export default function BrandPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data } = useProducts()
  const { data: brands } = useMarketplaceBrands(true)
  const products = data?.length ? data : fallbackProducts

  const brand = brands?.find(item => item.slug === slug)
  const filtered = products.filter(product => getBrandSlug(getProductBrand(product), product.marketplace_brand?.slug) === slug)
  const brandName = brand?.name || (filtered[0] ? getProductBrand(filtered[0]) : titleFromSlug(slug))
  const description = brand?.description || `${brandName} products curated and supplied through the Wingxtra UAV marketplace.`
  const heroImage = filtered[0]?.image_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80'

  return (
    <>
      <SEO title={`${brandName} Products | Wingxtra Store`} description={description} url={`/brand/${slug}`} />
      <div className={styles.page}>
        <section className={styles.hero}>
          <img src={heroImage} alt="" className={styles.heroImage} />
          <div className={styles.heroOverlay} />
          <div className="container">
            <Link to="/collection/brands" className={styles.back}><ArrowLeft size={16} /> Back to brands</Link>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Brand catalog</span>
              <h1>{brandName}</h1>
              <p>{description}</p>
              <div className={styles.heroStats}>
                <div><Boxes size={18} /><strong>{filtered.length}</strong><span>Products</span></div>
                <div><BadgeCheck size={18} /><strong>Curated</strong><span>By Wingxtra</span></div>
                <div><Globe2 size={18} /><strong>{brand?.origin_type ? brand.origin_type.replace(/_/g, ' ') : 'Brand'}</strong><span>Profile</span></div>
              </div>
            </div>
          </div>
        </section>

        <main className="container">
          <div className={styles.collectionNav}>
            <Link to="/shop">All products</Link>
            <Link to="/collection/new-arrivals">New arrivals</Link>
            <Link to="/collection/brands">All brands</Link>
          </div>
          <section className={styles.grid}>{filtered.map(product => <ProductCard key={product.id} product={product} />)}</section>
          {!filtered.length && <div className={styles.empty}>No products are currently assigned to this brand. Add or link products in admin to populate this brand page.</div>}
        </main>
      </div>
    </>
  )
}
