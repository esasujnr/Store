import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useProducts } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import styles from './AdminMedia.module.css'

export default function AdminMedia() {
  const qc = useQueryClient()
  const { data: products = [] } = useProducts()
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [mediaType, setMediaType] = useState('image')

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('product_media').insert({ product_id: productId, title, url, media_type: mediaType, is_active: true })
      if (error) throw error
    },
    onSuccess: () => { setTitle(''); setUrl(''); qc.invalidateQueries({ queryKey: ['product-media'] }); toast.success('Media added') },
  })

  return <><SEO title="Admin Media" noIndex /><div className={styles.page}><section className={styles.header}><span>Media</span><h1>Product Media Manager</h1><p>Add images, videos, manuals, blueprints, and file references to product pages.</p></section><form className={styles.form} onSubmit={e => { e.preventDefault(); save.mutate() }}><label>Product<select value={productId} onChange={e => setProductId(e.target.value)}>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Type<select value={mediaType} onChange={e => setMediaType(e.target.value)}><option>image</option><option>video</option><option>manual</option><option>blueprint</option><option>attachment</option></select></label><Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required /><Input label="URL or file path" value={url} onChange={e => setUrl(e.target.value)} required /><Button loading={save.isPending}>Add Media</Button></form></div></>
}
