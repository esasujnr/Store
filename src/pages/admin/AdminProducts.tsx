import { Link } from 'react-router-dom'
import { Edit, Package, Plus } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useProducts } from '@/hooks/useProducts'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { formatCurrency, getInventoryStatus, getProductPrice } from '@/lib/utils'
import { getFamilyLabel, getProductBrand, getProductFamily } from '@/lib/catalog'
import styles from './AdminProducts.module.css'

export default function AdminProducts() {
  const { data, isLoading } = useProducts()
  const products = data?.length ? data : fallbackProducts

  return (
    <>
      <SEO title="Admin Products" noIndex />
      <div className={styles.page}>
        <div className={styles.header}>
          <div><span>Catalog</span><h1>Products</h1><p>Manage Wingxtra products, curated UAV brands, stock rules, and product-page content.</p></div>
          <Link to="/admin/products/new"><Button><Plus size={16} /> New Product</Button></Link>
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <div className={styles.table}>
            <div className={styles.tableHeader}><span>Product</span><span>Family</span><span>Stock</span><span>Price</span><span></span></div>
            {products.map(product => {
              const inventory = getInventoryStatus(product)
              return <div key={product.id} className={styles.row}>
                <div className={styles.productCell}><img src={product.image_url} alt="" /><div><strong>{product.name}</strong><small>{getProductBrand(product)} - {product.slug}</small></div></div>
                <span>{getFamilyLabel(getProductFamily(product))}</span>
                <span className={styles[inventory.tone]}>{inventory.label}</span>
                <span>{formatCurrency(getProductPrice(product), 'GHS')}</span>
                <Link to={`/admin/products/${product.id}/edit`} className={styles.edit}><Edit size={15} /> Edit</Link>
              </div>
            })}
          </div>
        )}
        {!products.length && <div className={styles.empty}><Package size={40} /> No products yet.</div>}
      </div>
    </>
  )
}
