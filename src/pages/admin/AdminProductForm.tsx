import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { useCategories } from '@/hooks/useProducts'
import type { Product } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminProductForm.module.css'

const FULFILLMENT_TYPES = [
  { value: 'fdm', label: 'FDM (Digital Download)' },
  { value: 'mjf', label: 'MJF (3D Printed Physical)' },
  { value: 'composite', label: 'Composite (Carbon Fiber Physical)' },
]

export default function AdminProductForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    fulfillment_type: 'fdm',
    category_id: '',
    stock_count: '0',
    weight_grams: '0',
    is_active: true,
    is_drone_product: false,
    is_recommended_electronic: false,
    tags: '',
    specs: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [stlFile, setStlFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const p = data as Product
            setForm({
              name: p.name,
              slug: p.slug,
              description: p.description,
              price: String(p.price),
              fulfillment_type: p.fulfillment_type,
              category_id: p.category_id || '',
              stock_count: String(p.stock_count),
              weight_grams: String(p.weight_grams),
              is_active: p.is_active,
              is_drone_product: p.is_drone_product,
              is_recommended_electronic: p.is_recommended_electronic,
              tags: p.tags.join(', '),
              specs: JSON.stringify(p.specs || {}, null, 2),
            })
            setImagePreview(p.image_url)
          }
        })
    }
  }, [id, isEdit])

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: isEdit ? f.slug : slugify(name) }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let image_url = imagePreview
      let stl_file_path = ''

      // Upload image
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${form.slug}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      // Upload STL
      if (stlFile) {
        const path = `${form.slug}-${Date.now()}.stl`
        const { error: uploadError } = await supabase.storage
          .from('stl-files')
          .upload(path, stlFile, { upsert: true })
        if (uploadError) throw uploadError
        stl_file_path = path
      }

      let parsedSpecs: Record<string, string> = {}
      try {
        parsedSpecs = form.specs ? JSON.parse(form.specs) : {}
      } catch { parsedSpecs = {} }

      const payload: Partial<Product> = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price),
        fulfillment_type: form.fulfillment_type as Product['fulfillment_type'],
        category_id: form.category_id || null,
        stock_count: parseInt(form.stock_count),
        weight_grams: parseFloat(form.weight_grams),
        is_active: form.is_active,
        is_drone_product: form.is_drone_product,
        is_recommended_electronic: form.is_recommended_electronic,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        specs: parsedSpecs,
        ...(image_url && { image_url }),
        ...(stl_file_path && { stl_file_path }),
      }

      if (isEdit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('products').update(payload as any).eq('id', id!)
        if (error) throw error
        toast.success('Product updated')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('products').insert(payload as any)
        if (error) throw error
        toast.success('Product created')
      }

      navigate('/admin/products')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title={isEdit ? 'Edit Product' : 'New Product'} noIndex />
      <div>
        <h1 className={styles.title}>{isEdit ? 'Edit Product' : 'New Product'}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* Main fields */}
            <div className={styles.mainCol}>
              <div className={styles.section}>
                <h2>Product Info</h2>
                <div className={styles.fields}>
                  <Input
                    label="Product Name *"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    required
                  />
                  <Input
                    label="Slug"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    hint="URL-friendly identifier"
                    required
                  />
                  <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <textarea
                      className={styles.textarea}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder="Product description…"
                    />
                  </div>
                  <div className={styles.row2}>
                    <Input
                      label="Price (NGN) *"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                    <div className={styles.field}>
                      <label className={styles.label}>Fulfillment Type *</label>
                      <select
                        className={styles.select}
                        value={form.fulfillment_type}
                        onChange={e => setForm(f => ({ ...f, fulfillment_type: e.target.value }))}
                      >
                        {FULFILLMENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Category</label>
                      <select
                        className={styles.select}
                        value={form.category_id}
                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      >
                        <option value="">— No Category —</option>
                        {categories?.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    {form.fulfillment_type !== 'fdm' && (
                      <Input
                        label="Stock Count"
                        type="number"
                        min="0"
                        value={form.stock_count}
                        onChange={e => setForm(f => ({ ...f, stock_count: e.target.value }))}
                      />
                    )}
                  </div>
                  <Input
                    label="Tags (comma-separated)"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="fpv, racing, 5-inch"
                  />
                  <div className={styles.field}>
                    <label className={styles.label}>Specs (JSON)</label>
                    <textarea
                      className={styles.textarea}
                      value={form.specs}
                      onChange={e => setForm(f => ({ ...f, specs: e.target.value }))}
                      rows={4}
                      placeholder='{"Dimensions": "100x100mm", "Weight": "45g"}'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Side fields */}
            <div className={styles.sideCol}>
              {/* Image upload */}
              <div className={styles.section}>
                <h2>Product Image</h2>
                <label className={styles.uploadArea}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={24} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleImageChange}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    className={styles.clearImg}
                    onClick={() => { setImagePreview(''); setImageFile(null) }}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              {/* STL file */}
              {form.fulfillment_type === 'fdm' && (
                <div className={styles.section}>
                  <h2>STL File</h2>
                  <label className={styles.uploadArea}>
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={24} />
                      <span>{stlFile ? stlFile.name : 'Click to upload .stl file'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".stl"
                      className={styles.fileInput}
                      onChange={e => setStlFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}

              {/* Options */}
              <div className={styles.section}>
                <h2>Options</h2>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    Active (visible in store)
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={form.is_drone_product}
                      onChange={e => setForm(f => ({ ...f, is_drone_product: e.target.checked }))}
                    />
                    Is Drone Product
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={form.is_recommended_electronic}
                      onChange={e => setForm(f => ({ ...f, is_recommended_electronic: e.target.checked }))}
                    />
                    Is Recommended Electronic
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" size="lg" loading={loading}>
              {isEdit ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/products')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
