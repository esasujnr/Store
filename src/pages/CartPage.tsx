import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, Download, Package } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, getFulfillmentLabel, isDigital } from '@/lib/utils'
import styles from './CartPage.module.css'

export default function CartPage() {
  const { items, totalItems, subtotal, hasPhysical, removeItem, updateQuantity, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <>
        <SEO title="Cart" url="/cart" noIndex />
        <div className={styles.empty}>
          <ShoppingBag size={56} strokeWidth={1} className={styles.emptyIcon} />
          <h2>Your cart is empty</h2>
          <p>Browse our store and add some products</p>
          <Link to="/shop">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO title="Cart" url="/cart" noIndex />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1>Shopping Cart</h1>
            <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
          </div>

          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.items}>
              {items.map(({ product, quantity }) => {
                const digital = isDigital(product.fulfillment_type)
                return (
                  <div key={product.id} className={styles.item}>
                    <img
                      src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={product.name}
                      className={styles.itemImg}
                    />
                    <div className={styles.itemInfo}>
                      <div className={styles.itemMeta}>
                        {product.category && (
                          <span className={styles.itemCategory}>{product.category.name}</span>
                        )}
                        <span className={`${styles.fulfillmentBadge} ${styles[`fb_${product.fulfillment_type}`]}`}>
                          {digital ? <Download size={11} /> : <Package size={11} />}
                          {getFulfillmentLabel(product.fulfillment_type)}
                        </span>
                      </div>
                      <h3 className={styles.itemName}>
                        <Link to={`/product/${product.slug}`}>{product.name}</Link>
                      </h3>
                      <p className={styles.itemPrice}>{formatCurrency(product.price)}</p>
                    </div>
                    <div className={styles.itemActions}>
                      {!digital && (
                        <div className={styles.qtyControl}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                          >−</button>
                          <span>{quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                          >+</button>
                        </div>
                      )}
                      <span className={styles.lineTotal}>
                        {formatCurrency(product.price * quantity)}
                      </span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(product.id)}
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h2>Order Summary</h2>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Items ({totalItems})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {hasPhysical && (
                  <div className={styles.summaryRow}>
                    <span>Shipping</span>
                    <span className={styles.shippingNote}>Calculated at checkout</span>
                  </div>
                )}
              </div>
              <div className={styles.summaryTotal}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {hasPhysical && (
                <div className={styles.physicalNote}>
                  <Package size={14} />
                  Physical items require a shipping address at checkout.
                </div>
              )}

              <Link to="/checkout">
                <Button size="lg" fullWidth>
                  Proceed to Checkout <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/shop" className={styles.continueShopping}>
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
