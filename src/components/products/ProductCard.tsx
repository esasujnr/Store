import { Link } from 'react-router-dom'
import { Download, Package, ShoppingCart } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  getProductPrice,
  getInventoryStatus,
  getFulfillmentLabel,
  isDigital,
  isProductOnSale,
} from '@/lib/utils'
import {
  getDeliveryLabel,
  getFamilyLabel,
  getProductBrand,
  getProductDeliveryType,
  getProductFamily,
  isNewArrival,
} from '@/lib/catalog'
import type { Product } from '@/lib/database.types'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  featured?: boolean
  className?: string
}

export default function ProductCard({ product, featured = false, className = '' }: ProductCardProps) {
  const { addItem, isInCart } = useCart()
  const { formatFromBase } = useCurrency()
  const digital = isDigital(product.fulfillment_type)
  const price = getProductPrice(product)
  const onSale = isProductOnSale(product)
  const inventory = getInventoryStatus(product)
  const family = getProductFamily(product)
  const deliveryType = getProductDeliveryType(product)

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''} ${className}`}>
      <Link to={`/product/${product.slug}`} className={styles.imageWrap}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={event => {
              event.currentTarget.src = 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80'
            }}
          />
        ) : (
          <div className={styles.imageFallback} />
        )}
        <div className={styles.badges}>
          {onSale && <span className={styles.saleBadge}>{product.sale_label || 'Sale'}</span>}
          {isNewArrival(product) && <span className={styles.newBadge}>New</span>}
          <span className={styles.deliveryBadge}>{digital ? <Download size={12} /> : <Package size={12} />}{getDeliveryLabel(deliveryType)}</span>
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span>{getProductBrand(product)}</span>
          <span>{getFamilyLabel(family)}</span>
        </div>
        <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.trustLine}>Curated and supplied by Wingxtra</div>
        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <strong>{formatFromBase(price)}</strong>
            {onSale && <span>{formatFromBase(product.price)}</span>}
            <small>{getFulfillmentLabel(product.fulfillment_type)}</small>
          </div>
          <Button size="sm" onClick={() => addItem(product)} disabled={!inventory.canPurchase}>
            <ShoppingCart size={15} /> {isInCart(product.id) ? 'Added' : inventory.canPurchase ? 'Add' : 'Sold out'}
          </Button>
        </div>
        <span className={`${styles.inventory} ${styles[`inventory_${inventory.tone}`]}`}>{inventory.label}</span>
      </div>
    </article>
  )
}
