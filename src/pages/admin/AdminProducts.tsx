import { Link } from 'react-router-dom'
import { Plus, CreditCard as Edit, Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getFulfillmentLabel } from '@/lib/utils'
import type { Product } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminProducts.module.css'

export default function AdminProducts() {
  const qc = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('products').update({ is_active } as any).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  return (
    <>
      <SEO title="Admin — Products" noIndex />
      <div>
        <div className={styles.header}>
          <h1 className={styles.title}>Products</h1>
          <Link to="/admin/products/new">
            <Button>
              <Plus size={16} /> Add Product
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className={styles.loading}>Loading…</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Product</span>
              <span>Type</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span></span>
            </div>
            {products?.map(product => (
              <div key={product.id} className={styles.row}>
                <div className={styles.productCell}>
                  <img
                    src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=80'}
                    alt={product.name}
                    className={styles.thumb}
                  />
                  <div>
                    <p className={styles.productName}>{product.name}</p>
                    <p className={styles.productSlug}>{product.slug}</p>
                  </div>
                </div>
                <span className={`${styles.typeBadge} ${styles[`type_${product.fulfillment_type}`]}`}>
                  {getFulfillmentLabel(product.fulfillment_type)}
                </span>
                <span className={styles.cell}>{product.category?.name || '—'}</span>
                <span className={styles.cell}>{formatCurrency(product.price)}</span>
                <span className={styles.cell}>
                  {product.fulfillment_type === 'fdm' ? '∞' : product.stock_count}
                </span>
                <span>
                  <button
                    className={`${styles.statusToggle} ${product.is_active ? styles.statusActive : styles.statusInactive}`}
                    onClick={() => toggleActive.mutate({ id: product.id, is_active: !product.is_active })}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </button>
                </span>
                <div className={styles.actions}>
                  <Link to={`/admin/products/${product.id}/edit`}>
                    <button className={styles.editBtn}>
                      <Edit size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
