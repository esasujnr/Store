import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Download, Package, ChevronRight, SquareCheck as CheckSquare, Square, Plus, Minus } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useProduct, useBundleItems } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, getFulfillmentLabel, isDigital } from '@/lib/utils'
import type { Product } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './ProductPage.module.css'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading } = useProduct(slug!)
  const { data: bundleItems } = useBundleItems(product?.id ?? '')
  const { addItem, isInCart } = useCart()
  const [qty, setQty] = useState(1)
  const [selectedElectronics, setSelectedElectronics] = useState<Set<string>>(new Set())

  if (isLoading) return <LoadingSpinner fullPage />
  if (!product) return (
    <div className={styles.notFound}>
      <h2>Product not found</h2>
      <Link to="/shop">Back to Shop</Link>
    </div>
  )

  const digital = isDigital(product.fulfillment_type)
  const inCart = isInCart(product.id)
  const outOfStock = !digital && product.stock_count <= 0

  function handleAddToCart() {
    addItem(product!, qty)
    // Add selected electronics too
    if (bundleItems) {
      bundleItems
        .filter(bi => selectedElectronics.has(bi.electronic_product_id))
        .forEach(bi => {
          if (bi.electronic_product) {
            addItem(bi.electronic_product as Product, 1)
          }
        })
    }
    const extras = selectedElectronics.size
    toast.success(`Added to cart${extras > 0 ? ` (+${extras} electronics)` : ''}`)
  }

  function toggleElectronic(id: string) {
    setSelectedElectronics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fulfillmentColor = {
    fdm: '#22c55e',
    mjf: '#3b82f6',
    composite: '#eab308',
  }[product.fulfillment_type] || '#94a3b8'

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} - ${getFulfillmentLabel(product.fulfillment_type)}`}
        image={product.image_url}
        url={`/product/${product.slug}`}
        type="product"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          ...(product.category ? [{ name: product.category.name, url: `/shop/${product.category.slug}` }] : []),
          { name: product.name, url: `/product/${product.slug}` },
        ]}
        product={{
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image_url,
          sku: product.id,
          availability: outOfStock ? 'OutOfStock' : 'InStock',
        }}
      />

      <div className={styles.page}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/shop">Shop</Link>
            {product.category && (
              <>
                <ChevronRight size={14} />
                <Link to={`/shop/${product.category.slug}`}>{product.category.name}</Link>
              </>
            )}
            <ChevronRight size={14} />
            <span>{product.name}</span>
          </nav>

          <div className={styles.grid}>
            {/* Image */}
            <div className={styles.imageSection}>
              <div className={styles.imageWrapper}>
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={product.name}
                  className={styles.image}
                />
                <span
                  className={styles.typeBadge}
                  style={{ background: fulfillmentColor + '22', color: fulfillmentColor, borderColor: fulfillmentColor + '44' }}
                >
                  {digital ? <Download size={13} /> : <Package size={13} />}
                  {getFulfillmentLabel(product.fulfillment_type)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className={styles.info}>
              {product.category && (
                <Link to={`/shop/${product.category.slug}`} className={styles.categoryTag}>
                  {product.category.name}
                </Link>
              )}
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.price}>{formatCurrency(product.price)}</p>

              {product.description && (
                <p className={styles.description}>{product.description}</p>
              )}

              {/* Specs */}
              {Object.keys(product.specs || {}).length > 0 && (
                <div className={styles.specs}>
                  <h3>Specifications</h3>
                  <dl className={styles.specsList}>
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className={styles.specItem}>
                        <dt>{key}</dt>
                        <dd>{String(val)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Stock */}
              {!digital && (
                <div className={styles.stockRow}>
                  <span className={`${styles.stockDot} ${outOfStock ? styles.stockDotOut : styles.stockDotIn}`} />
                  <span className={styles.stockText}>
                    {outOfStock ? 'Out of Stock' : `${product.stock_count} in stock`}
                  </span>
                </div>
              )}

              {/* Quantity */}
              {!digital && !outOfStock && (
                <div className={styles.qtyRow}>
                  <span className={styles.qtyLabel}>Quantity</span>
                  <div className={styles.qtyControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyVal}>{qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQty(q => Math.min(product.stock_count, q + 1))}
                      disabled={qty >= product.stock_count}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              <Button
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={outOfStock || (inCart && !selectedElectronics.size)}
                className={styles.addBtn}
              >
                <ShoppingCart size={18} />
                {inCart ? 'Add Again' : 'Add to Cart'}
              </Button>

              {digital && (
                <p className={styles.downloadNote}>
                  <Download size={13} />
                  STL files delivered via secure, 15-minute expiring link after payment.
                </p>
              )}
            </div>
          </div>

          {/* Recommended Electronics (Craycle-style bundling) */}
          {bundleItems && bundleItems.length > 0 && (
            <section className={styles.bundleSection}>
              <h2 className={styles.bundleTitle}>Recommended Electronics</h2>
              <p className={styles.bundleSubtitle}>Add compatible components to your order</p>
              <div className={styles.bundleGrid}>
                {bundleItems.map(item => {
                  const ep = item.electronic_product as Product
                  if (!ep) return null
                  const checked = selectedElectronics.has(item.electronic_product_id)
                  return (
                    <button
                      key={item.id}
                      className={`${styles.bundleCard} ${checked ? styles.bundleCardSelected : ''}`}
                      onClick={() => toggleElectronic(item.electronic_product_id)}
                    >
                      <div className={styles.bundleCheck}>
                        {checked ? <CheckSquare size={18} color="var(--color-accent-400)" /> : <Square size={18} />}
                      </div>
                      <img
                        src={ep.image_url || 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200'}
                        alt={ep.name}
                        className={styles.bundleImg}
                      />
                      <div className={styles.bundleInfo}>
                        <span className={styles.bundleCategory}>{ep.category?.name}</span>
                        <span className={styles.bundleName}>{ep.name}</span>
                        <span className={styles.bundlePrice}>{formatCurrency(ep.price)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedElectronics.size > 0 && (
                <p className={styles.bundleSummary}>
                  {selectedElectronics.size} item{selectedElectronics.size > 1 ? 's' : ''} selected — will be added to cart
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  )
}
