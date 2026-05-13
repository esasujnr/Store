import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useMarketplaceBrands } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import styles from './AdminBrands.module.css'

export default function AdminBrands() {
  const qc = useQueryClient()
  const { data: brands = [] } = useMarketplaceBrands(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createBrand = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('marketplace_brands').insert({ name, slug: slugify(name), description, origin_type: 'curated_brand', is_active: true })
      if (error) throw error
    },
    onSuccess: () => { setName(''); setDescription(''); qc.invalidateQueries({ queryKey: ['marketplace-brands'] }); toast.success('Brand added') },
  })

  return <><SEO title="Admin Brands" noIndex /><div className={styles.page}><section className={styles.header}><span>Marketplace</span><h1>Brands</h1><p>Manage Wingxtra and curated UAV supplier brands.</p></section><form className={styles.form} onSubmit={e => { e.preventDefault(); createBrand.mutate() }}><Input label="Brand name" value={name} onChange={e => setName(e.target.value)} required /><Input label="Description" value={description} onChange={e => setDescription(e.target.value)} /><Button loading={createBrand.isPending}>Add Brand</Button></form><div className={styles.grid}>{brands.map(brand => <article key={brand.id} className={styles.card}><strong>{brand.name}</strong><span>{brand.origin_type}</span><p>{brand.description}</p></article>)}</div></div></>
}
