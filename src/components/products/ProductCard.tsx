import { Link } from 'react-router-dom'
import { ShoppingCart, Download, Package } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, getFulfillmentLabel } from '@/lib/utils'
import type { Product } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart()
  const inCart = isInCart(product.id)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product)
    toast.success(`${product.name} added to cart`)
  }

  const isDigital = product.fulfillment_type === 'fdm'
  const isOutOfStock = !isDigital && product.stock_count <= 0

  return (
    <Link to={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />
        <span className={`${styles.badge} ${styles[`badge_${product.fulfillment_type}`]}`}>
          {isDigital ? <Download size={11} /> : <Package size={11} />}
          {getFulfillmentLabel(product.fulfillment_type)}
        </span>
        {isOutOfStock && <div className={styles.outOfStockOverlay}>Out of Stock</div>}
      </div>

      <div className={styles.body}>
        {product.category && (
          <span className={styles.category}>{product.category.name}</span>
        )}
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>
          {product.description.length > 80
            ? product.description.slice(0, 80) + '…'
            : product.description}
        </p>

        <div className={styles.footer}>
          <span className={styles.price}>{formatCurrency(product.price)}</span>
          <button
            className={`${styles.addBtn} ${inCart ? styles.addBtnActive : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={inCart ? 'Already in cart' : 'Add to cart'}
          >
            <ShoppingCart size={15} />
            {inCart ? 'In Cart' : 'Add'}
          </button>
        </div>
      </div>
    </Link>
  )
}
