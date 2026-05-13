import { useMemo, useState } from 'react'
import { ExternalLink, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useMarketplaceBrands } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import type { MarketplaceBrand, ProductOrigin } from '@/lib/database.types'
import { slugify } from '@/lib/utils'
import styles from './AdminBrands.module.css'

type BrandDraft = {
  name: string
  slug: string
  description: string
  logo_url: string
  website_url: string
  origin_type: ProductOrigin
  warranty_notes: string
  sort_order: string
  is_active: boolean
}

const originOptions: Array<{ value: ProductOrigin; label: string }> = [
  { value: 'wingxtra', label: 'Wingxtra' },
  { value: 'curated_brand', label: 'Curated Brand' },
  { value: 'partner_brand', label: 'Partner Brand' },
]

function fromBrand(brand: MarketplaceBrand): BrandDraft {
  return {
    name: brand.name,
    slug: brand.slug,
    description: brand.description || '',
    logo_url: brand.logo_url || '',
    website_url: brand.website_url || '',
    origin_type: brand.origin_type,
    warranty_notes: brand.warranty_notes || '',
    sort_order: String(brand.sort_order || 0),
    is_active: brand.is_active,
  }
}

const emptyDraft: BrandDraft = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  website_url: '',
  origin_type: 'curated_brand',
  warranty_notes: '',
  sort_order: '0',
  is_active: true,
}

function payloadFromDraft(draft: BrandDraft) {
  return {
    name: draft.name.trim(),
    slug: (draft.slug || slugify(draft.name)).trim(),
    description: draft.description.trim() || null,
    logo_url: draft.logo_url.trim() || null,
    website_url: draft.website_url.trim() || null,
    origin_type: draft.origin_type,
    warranty_notes: draft.warranty_notes.trim() || null,
    sort_order: Number.parseInt(draft.sort_order, 10) || 0,
    is_active: draft.is_active,
  }
}

export default function AdminBrands() {
  const qc = useQueryClient()
  const { data: brands = [], isLoading } = useMarketplaceBrands(false)
  const [draft, setDraft] = useState<BrandDraft>(emptyDraft)
  const [editing, setEditing] = useState<Record<string, BrandDraft>>({})

  const activeBrands = useMemo(() => brands.filter(brand => brand.is_active).length, [brands])

  const createBrand = useMutation({
    mutationFn: async () => {
      if (!draft.name.trim()) throw new Error('Brand name is required')
      const { error } = await supabase.from('marketplace_brands').insert(payloadFromDraft({ ...draft, slug: draft.slug || slugify(draft.name) }) as never)
      if (error) throw error
    },
    onSuccess: () => {
      setDraft(emptyDraft)
      qc.invalidateQueries({ queryKey: ['marketplace-brands'] })
      toast.success('Brand added')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateBrand = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: BrandDraft }) => {
      if (!next.name.trim()) throw new Error('Brand name is required')
      const { error } = await supabase.from('marketplace_brands').update(payloadFromDraft(next) as never).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      setEditing(prev => {
        const copy = { ...prev }
        delete copy[vars.id]
        return copy
      })
      qc.invalidateQueries({ queryKey: ['marketplace-brands'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Brand updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const setEdit = (id: string, patch: Partial<BrandDraft>) => setEditing(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  return (
    <>
      <SEO title="Admin Brands" noIndex />
      <div className={styles.page}>
        <section className={styles.header}>
          <span>Marketplace</span>
          <h1>Brands</h1>
          <p>Add and edit Wingxtra, curated, and partner brands. Active brands can appear in the navbar preview and have their own filtered brand pages.</p>
          <div className={styles.stats}>
            <strong>{brands.length} total brands</strong>
            <strong>{activeBrands} active in store</strong>
          </div>
        </section>

        <form className={styles.form} onSubmit={event => { event.preventDefault(); createBrand.mutate() }}>
          <Input label="Brand name" value={draft.name} onChange={event => setDraft(prev => ({ ...prev, name: event.target.value, slug: prev.slug || slugify(event.target.value) }))} required />
          <Input label="Slug" value={draft.slug} onChange={event => setDraft(prev => ({ ...prev, slug: slugify(event.target.value) }))} />
          <label className={styles.field}>
            <span>Origin type</span>
            <select value={draft.origin_type} onChange={event => setDraft(prev => ({ ...prev, origin_type: event.target.value as ProductOrigin }))}>
              {originOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Input label="Logo / preview image URL" value={draft.logo_url} onChange={event => setDraft(prev => ({ ...prev, logo_url: event.target.value }))} />
          <Input label="Website URL" value={draft.website_url} onChange={event => setDraft(prev => ({ ...prev, website_url: event.target.value }))} />
          <Input label="Sort order" type="number" value={draft.sort_order} onChange={event => setDraft(prev => ({ ...prev, sort_order: event.target.value }))} />
          <label className={styles.fullField}>
            <span>Description</span>
            <textarea value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} />
          </label>
          <label className={styles.fullField}>
            <span>Warranty notes</span>
            <textarea value={draft.warranty_notes} onChange={event => setDraft(prev => ({ ...prev, warranty_notes: event.target.value }))} />
          </label>
          <label className={styles.switchField}><input type="checkbox" checked={draft.is_active} onChange={event => setDraft(prev => ({ ...prev, is_active: event.target.checked }))} /> Active brand</label>
          <Button loading={createBrand.isPending}>Add Brand</Button>
        </form>

        {isLoading ? <div className={styles.card}>Loading brands...</div> : (
          <div className={styles.grid}>
            {brands.map(brand => {
              const current = editing[brand.id] || fromBrand(brand)
              return (
                <article key={brand.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <strong>{brand.name}</strong>
                      <span>{brand.origin_type.replace(/_/g, ' ')}</span>
                    </div>
                    {brand.website_url && <a href={brand.website_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}
                  </div>
                  {current.logo_url && <img className={styles.preview} src={current.logo_url} alt="" />}
                  <div className={styles.editorGrid}>
                    <Input label="Name" value={current.name} onChange={event => setEdit(brand.id, { name: event.target.value })} />
                    <Input label="Slug" value={current.slug} onChange={event => setEdit(brand.id, { slug: slugify(event.target.value) })} />
                    <label className={styles.field}>
                      <span>Origin</span>
                      <select value={current.origin_type} onChange={event => setEdit(brand.id, { origin_type: event.target.value as ProductOrigin })}>
                        {originOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <Input label="Sort" type="number" value={current.sort_order} onChange={event => setEdit(brand.id, { sort_order: event.target.value })} />
                  </div>
                  <Input label="Logo / preview image URL" value={current.logo_url} onChange={event => setEdit(brand.id, { logo_url: event.target.value })} />
                  <Input label="Website URL" value={current.website_url} onChange={event => setEdit(brand.id, { website_url: event.target.value })} />
                  <label className={styles.fullField}>
                    <span>Description</span>
                    <textarea value={current.description} onChange={event => setEdit(brand.id, { description: event.target.value })} />
                  </label>
                  <label className={styles.fullField}>
                    <span>Warranty notes</span>
                    <textarea value={current.warranty_notes} onChange={event => setEdit(brand.id, { warranty_notes: event.target.value })} />
                  </label>
                  <label className={styles.switchField}><input type="checkbox" checked={current.is_active} onChange={event => setEdit(brand.id, { is_active: event.target.checked })} /> Active in store</label>
                  <Button loading={updateBrand.isPending} onClick={() => updateBrand.mutate({ id: brand.id, next: current })}>
                    <Save size={16} /> Save Brand
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
