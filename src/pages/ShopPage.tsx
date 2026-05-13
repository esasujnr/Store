import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import Input from '@/components/ui/Input'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import {
  ADDITIVE_MANUFACTURING_OPTIONS,
  PRODUCT_FAMILY_OPTIONS,
  getProductAdditiveType,
  getProductBrand,
  getProductDeliveryType,
  getProductFamily,
  isNewArrival,
} from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { getDefaultSiteContent } from '@/lib/siteContent'
import { isProductOnSale } from '@/lib/utils'
import styles from './ShopPage.module.css'

function getParam(locationSearch: string, key: string) {
  return new URLSearchParams(locationSearch).get(key) || ''
}

export default function ShopPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>()
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: productData } = useProducts()
  const { data: contentData } = useSiteContent('shop_page', previewMode)
  const { data: brands } = useMarketplaceBrands(true)
  const content = contentData ?? getDefaultSiteContent('shop_page')
  const products = productData?.length ? productData : fallbackProducts

  const initialFamily = getParam(location.search, 'family') || (PRODUCT_FAMILY_OPTIONS.some(option => option.value === categorySlug) ? categorySlug || '' : '')
  const [search, setSearch] = useState(getParam(location.search, 'q'))
  const [family, setFamily] = useState(initialFamily)
  const [brand, setBrand] = useState(getParam(location.search, 'brand'))
  const [delivery, setDelivery] = useState(getParam(location.search, 'delivery'))
  const [additive, setAdditive] = useState(getParam(location.search, 'additive'))
  const [scope, setScope] = useState(getParam(location.search, 'scope'))
  const [fulfillment, setFulfillment] = useState(getParam(location.search, 'type'))

  useEffect(() => {
    setSearch(getParam(location.search, 'q'))
    setFamily(getParam(location.search, 'family') || (PRODUCT_FAMILY_OPTIONS.some(option => option.value === categorySlug) ? categorySlug || '' : ''))
    setBrand(getParam(location.search, 'brand'))
    setDelivery(getParam(location.search, 'delivery'))
    setAdditive(getParam(location.search, 'additive'))
    setScope(getParam(location.search, 'scope'))
    setFulfillment(getParam(location.search, 'type'))
  }, [categorySlug, location.search])

  const filtered = useMemo(() => products.filter(product => {
    const query = search.trim().toLowerCase()
    const categoryMatches = !categorySlug || PRODUCT_FAMILY_OPTIONS.some(option => option.value === categorySlug) || product.category?.slug === categorySlug
    if (!categoryMatches) return false
    if (query && !`${product.name} ${product.description} ${product.brand || ''} ${product.tags?.join(' ')}`.toLowerCase().includes(query)) return false
    if (family && getProductFamily(product) !== family) return false
    if (brand && getProductBrand(product) !== brand) return false
    if (delivery && getProductDeliveryType(product) !== delivery) return false
    if (additive && getProductAdditiveType(product) !== additive) return false
    if (fulfillment && product.fulfillment_type !== fulfillment) return false
    if (scope === 'sale' && !isProductOnSale(product)) return false
    if (scope === 'new' && !isNewArrival(product)) return false
    if (getParam(location.search, 'availability') === 'physical_only' && product.fulfillment_type === 'fdm') return false
    return true
  }), [brand, categorySlug, additive, delivery, family, fulfillment, location.search, products, scope, search])

  const brandOptions = brands?.length ? brands.map(item => item.name) : [...new Set(products.map(getProductBrand))]
  const activeFamily = PRODUCT_FAMILY_OPTIONS.find(option => option.value === family)
  const quickLinks = content.controls.quickLinks.length ? content.controls.quickLinks : getDefaultSiteContent('shop_page').controls.quickLinks

  function clearFilters() {
    setSearch('')
    setFamily('')
    setBrand('')
    setDelivery('')
    setAdditive('')
    setScope('')
    setFulfillment('')
  }

  return (
    <>
      <SEO title={content.seo.title} description={content.seo.description} url="/shop" />
      <div className={styles.page}>
        {content.visibility.hero && (
          <section className={styles.hero}>
            <div className="container">
              <span className={styles.eyebrow}>{content.hero.eyebrow}</span>
              <h1>{activeFamily ? activeFamily.label : content.hero.title}</h1>
              <p>{activeFamily ? activeFamily.description : content.hero.description}</p>
              <div className={styles.quickFamilies}>
                {quickLinks.map(link => (
                  <Link key={`${link.href}-${link.label}`} to={link.href}>
                    {link.label} <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.visibility.featureRail && content.featureRail.length > 0 && (
          <section className={styles.featureRail}>
            <div className="container">
              <div className={styles.featureRailGrid}>
                {content.featureRail.map(item => (
                  <Link key={`${item.href}-${item.title}`} to={item.href} className={styles.featureRailCard}>
                    <span>{item.linkLabel}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="container">
          {content.visibility.filters && (
            <section className={styles.filters}>
              <div className={styles.searchBox}>
                <Search size={18} />
                <Input placeholder={content.controls.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select value={family} onChange={e => setFamily(e.target.value)}><option value="">All families</option>{PRODUCT_FAMILY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <select value={brand} onChange={e => setBrand(e.target.value)}><option value="">All brands</option>{brandOptions.map(name => <option key={name} value={name}>{name}</option>)}</select>
              <select value={delivery} onChange={e => setDelivery(e.target.value)}><option value="">All delivery types</option><option value="digital_download">Digital Download</option><option value="physical_shipment">Physical Shipment</option><option value="made_to_order">Made To Order</option></select>
              <select value={additive} onChange={e => setAdditive(e.target.value)}><option value="">All additive types</option>{ADDITIVE_MANUFACTURING_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <select value={scope} onChange={e => setScope(e.target.value)}><option value="">All products</option><option value="new">New Arrivals</option><option value="sale">On Sale</option></select>
            </section>
          )}

          {content.visibility.resultSummary && (
            <section className={styles.catalogIntro}>
              <div>
                <SlidersHorizontal size={18} />
                <span>{filtered.length} {filtered.length === 1 ? content.controls.resultLabel.replace(/s\b/, '') : content.controls.resultLabel}</span>
              </div>
              <button onClick={clearFilters}>{content.controls.clearFiltersLabel}</button>
            </section>
          )}

          {content.visibility.collectionTiles && (
            <section className={styles.collectionTiles}>
              {PRODUCT_FAMILY_OPTIONS.slice(0, 8).map(option => (
                <Link key={option.value} to={option.href || `/collection/${option.value}`}>
                  <span>{option.label}</span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </section>
          )}

          {content.visibility.productGrid && (
            <>
              <section className={styles.grid}>{filtered.map(product => <ProductCard key={product.id} product={product} />)}</section>
              {!filtered.length && <div className={styles.empty}>{content.controls.emptyState}</div>}
            </>
          )}
        </div>
      </div>
    </>
  )
}
