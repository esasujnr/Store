import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BadgeCheck, Boxes, Sparkles } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import { useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import { PRODUCT_FAMILY_OPTIONS, getProductBrand, getProductFamily, isNewArrival } from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import styles from './CollectionPage.module.css'

const COLLECTION_IMAGES: Record<string, string> = {
  new: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1800&q=80',
  brands: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80',
  wingxtra_aircraft: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1800&q=80',
  fixed_wing_uavs: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1800&q=80',
  vtol_uavs: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80',
  multirotor_uavs: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1800&q=80',
  additive_manufacturing: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1800&q=80',
  airframes_kits: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1800&q=80',
}

function getCollectionMeta(slug: string) {
  if (slug === 'new-arrivals') {
    return {
      eyebrow: 'New arrivals',
      title: 'Fresh UAV products added to the Wingxtra marketplace.',
      description: 'A focused landing page for the newest aircraft, electronics, printable files, mission systems, and hardware releases.',
      image: COLLECTION_IMAGES.new,
    }
  }

  if (slug === 'brands') {
    return {
      eyebrow: 'Curated brands',
      title: 'Browse Wingxtra and selected UAV partner brands.',
      description: 'Every brand on this store should feel deliberately selected, quality-gated, and presented through a Wingxtra buying experience.',
      image: COLLECTION_IMAGES.brands,
    }
  }

  const family = PRODUCT_FAMILY_OPTIONS.find(option => option.value === slug)
  return {
    eyebrow: 'Collection',
    title: family?.label || 'All Products',
    description: family?.description || 'Browse the complete Wingxtra UAV marketplace catalog.',
    image: COLLECTION_IMAGES[slug] || COLLECTION_IMAGES.wingxtra_aircraft,
    family,
  }
}

export default function CollectionPage() {
  const { slug = 'all-products' } = useParams<{ slug: string }>()
  const { data } = useProducts()
  const { data: brands } = useMarketplaceBrands(true)
  const products = data?.length ? data : fallbackProducts
  const meta = getCollectionMeta(slug)

  const filtered = products.filter(product => {
    if (slug === 'all-products' || slug === 'brands') return true
    if (slug === 'new-arrivals') return isNewArrival(product)
    return getProductFamily(product) === slug
  })

  const brandNames = brands?.length
    ? brands.map(brand => brand.name)
    : Array.from(new Set(products.map(getProductBrand))).sort()

  const brandGroups = brandNames
    .map(name => ({ name, products: products.filter(product => getProductBrand(product) === name) }))
    .filter(group => group.products.length)

  return (
    <>
      <SEO title={`${meta.title} | Wingxtra Store`} description={meta.description} url={`/collection/${slug}`} />
      <div className={styles.page}>
        <section className={styles.hero}>
          <img src={meta.image} alt="" className={styles.heroImage} />
          <div className={styles.heroOverlay} />
          <div className="container">
            <Link to="/shop" className={styles.back}><ArrowLeft size={16} /> Back to shop</Link>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>{meta.eyebrow}</span>
              <h1>{meta.title}</h1>
              <p>{meta.description}</p>
              <div className={styles.heroStats}>
                <div><Boxes size={18} /><strong>{filtered.length}</strong><span>Products</span></div>
                <div><BadgeCheck size={18} /><strong>Curated</strong><span>By Wingxtra</span></div>
                <div><Sparkles size={18} /><strong>Clear</strong><span>Buying path</span></div>
              </div>
            </div>
          </div>
        </section>

        <main className="container">
          {slug === 'brands' ? (
            <section className={styles.brandStack}>
              {brandGroups.map(group => (
                <article key={group.name} className={styles.brandSection}>
                  <div className={styles.brandHead}>
                    <div>
                      <span className={styles.eyebrow}>Brand</span>
                      <h2>{group.name}</h2>
                    </div>
                    <Link to={`/shop?brand=${encodeURIComponent(group.name)}`}>View in shop <ArrowRight size={16} /></Link>
                  </div>
                  <div className={styles.grid}>{group.products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}</div>
                </article>
              ))}
            </section>
          ) : (
            <>
              <div className={styles.collectionNav}>
                <Link to="/shop">All products</Link>
                <Link to="/collection/new-arrivals">New arrivals</Link>
                {PRODUCT_FAMILY_OPTIONS.slice(0, 7).map(option => (
                  <Link key={option.value} to={option.href || `/collection/${option.value}`}>{option.label}</Link>
                ))}
              </div>
              <section className={styles.grid}>{filtered.map(product => <ProductCard key={product.id} product={product} />)}</section>
              {!filtered.length && <div className={styles.empty}>No products in this collection yet. The collection is ready for products when you add them in admin.</div>}
            </>
          )}
        </main>
      </div>
    </>
  )
}
