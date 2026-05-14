import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Images, Upload, X } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import {
  ADDITIVE_MANUFACTURING_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  PRODUCT_FAMILY_OPTIONS,
  PRODUCT_ORIGIN_OPTIONS,
  getProductAdditiveType,
  getProductDeliveryType,
  getProductFamily,
} from '@/lib/catalog'
import { slugify } from '@/lib/utils'
import { useCategories, useMarketplaceBrands, useProducts } from '@/hooks/useProducts'
import type { Product } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminProductForm.module.css'

const FULFILLMENT_TYPES = [
  { value: 'fdm', label: 'FDM (Digital Download)' },
  { value: 'mjf', label: 'MJF (3D Printed Physical)' },
  { value: 'composite', label: 'Composite (Carbon Fiber Physical)' },
]

const PRODUCT_SPEC_TEMPLATES = {
  fdm: {
    wingspan: '1200 mm',
    file_formats: 'STL | PDF build guide',
    skill_level: 'Intermediate',
    build_time: 'One weekend',
    ideal_for: 'Builders printing a lightweight prototype locally',
    included: ['Airframe STL set', 'Print orientation notes', 'Assembly checklist'],
    requirements: ['FDM printer with 220 x 220 mm bed', 'PLA+ or PETG', 'Matching electronics and fasteners'],
    print_settings: ['0.2 mm layer height', '3 perimeters', '15-20% gyroid infill'],
    recommended_materials: ['PLA+', 'PETG'],
    license: 'Digital product for personal workshop use.',
    support_policy: 'Includes product-page guidance and update notes for supported revisions.',
    who_it_is_for: 'Builders who want to print, tune, and iterate locally.',
    who_it_is_not_for: 'Buyers looking for a finished shipped aircraft.',
  },
  mjf: {
    production_method: 'MJF PA12 nylon production',
    finish: 'Bead blasted matte finish',
    shipping_window: 'Ships in 4-7 business days',
    skill_level: 'Workshop-ready',
    build_time: 'Bolt-on integration',
    ideal_for: 'Builders who want finished nylon parts without self-printing',
    included: ['Finished structural parts', 'Post-processed production output', 'Packed shipment'],
    requirements: ['Matching hardware kit', 'Compatible electronics', 'Standard workshop tools'],
    shipping_notes: ['Physical orders are packed separately from digital purchases.'],
    support_policy: 'Includes order support and build-fit guidance for the supplied part.',
    who_it_is_for: 'Buyers who want durable production parts ready for assembly.',
    who_it_is_not_for: 'Builders looking only for raw digital STL files.',
  },
  composite: {
    production_method: 'Composite layup for lightweight structural performance',
    finish: 'Workshop-ready composite finish',
    shipping_window: 'Ships in 5-10 business days',
    skill_level: 'Experienced builder',
    build_time: 'Integration-focused assembly',
    ideal_for: 'Fixed-wing and FPV builds that prioritize low weight and rigidity',
    included: ['Finished composite component', 'Packed structural hardware set', 'Shipment-ready packaging'],
    requirements: ['Compatible airframe geometry', 'Workshop tools for assembly', 'Matching electronics where applicable'],
    shipping_notes: ['Composite parts are inspected before dispatch.'],
    support_policy: 'Includes order support and guidance on fitment within the supported build workflow.',
    who_it_is_for: 'Builders who want lighter structural parts than standard printed options.',
    who_it_is_not_for: 'Buyers expecting a digital-only product.',
  },
} as const

type ProductContentBuilder = {
  product_page_layout: string
  overview: string
  product_story_title: string
  product_story: string
  blueprint_title: string
  video_url: string
  video_title: string
  video_description: string
  included: string
  requirements: string
  manufacturing_notes: string
  purchase_notes: string
  support_policy: string
  shipping_window: string
  who_it_is_for: string
  who_it_is_not_for: string
  technical_specs: string
  product_faqs: string
  recommended_product_slugs: string
}

type ProductPageVisibility = {
  trustLine: boolean
  assuranceBar: boolean
  beforeYouBuy: boolean
  templateGuide: boolean
  dossier: boolean
  video: boolean
  detailCards: boolean
  technicalSpecs: boolean
  reviews: boolean
  bundles: boolean
}

const EMPTY_CONTENT_BUILDER: ProductContentBuilder = {
  product_page_layout: 'auto',
  overview: '',
  product_story_title: '',
  product_story: '',
  blueprint_title: '',
  video_url: '',
  video_title: '',
  video_description: '',
  included: '',
  requirements: '',
  manufacturing_notes: '',
  purchase_notes: '',
  support_policy: '',
  shipping_window: '',
  who_it_is_for: '',
  who_it_is_not_for: '',
  technical_specs: '',
  product_faqs: '',
  recommended_product_slugs: '',
}

const BUILDER_LIST_FIELDS: Array<keyof ProductContentBuilder> = ['included', 'requirements', 'manufacturing_notes', 'purchase_notes']

const DEFAULT_PRODUCT_PAGE_VISIBILITY: ProductPageVisibility = {
  trustLine: true,
  assuranceBar: true,
  beforeYouBuy: true,
  templateGuide: true,
  dossier: true,
  video: true,
  detailCards: true,
  technicalSpecs: true,
  reviews: true,
  bundles: true,
}

const PRODUCT_PAGE_VISIBILITY_LABELS: Array<{ key: keyof ProductPageVisibility; label: string; help: string }> = [
  { key: 'trustLine', label: 'Trust line', help: 'Brand, origin, and warranty line near the buy area.' },
  { key: 'assuranceBar', label: 'Assurance bar', help: 'Payment, delivery, and support confidence badges.' },
  { key: 'beforeYouBuy', label: 'Before you buy', help: 'Buyer-fit notes and expectations.' },
  { key: 'templateGuide', label: 'Guide cards', help: 'Product family explanation cards.' },
  { key: 'dossier', label: 'Files / dossier', help: 'Downloads, requirements, and product dossier sections.' },
  { key: 'video', label: 'Video', help: 'Embedded build or demonstration video.' },
  { key: 'detailCards', label: 'Detail cards', help: 'Included items, requirements, and manufacturing notes.' },
  { key: 'technicalSpecs', label: 'Technical specs', help: 'Structured specification table.' },
  { key: 'reviews', label: 'Reviews', help: 'Customer reviews and review form.' },
  { key: 'bundles', label: 'Recommended products', help: 'Linked add-ons, bundles, and shopping list.' },
]

function listToTextarea(value: unknown): string {
  if (Array.isArray(value)) return value.map(item => String(item)).join('\n')
  if (typeof value === 'string') return value.split('|').map(item => item.trim()).filter(Boolean).join('\n')
  return ''
}

function textareaToList(value: string): string[] {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function labelValueListToTextarea(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>
          const label = String(row.label || row.name || row.key || '').trim()
          const specValue = String(row.value || row.description || '').trim()
          return label && specValue ? `${label}: ${specValue}` : label || specValue
        }
        return String(item).trim()
      })
      .filter(Boolean)
      .join('\n')
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([label, specValue]) => `${label}: ${String(specValue)}`)
      .join('\n')
  }

  return typeof value === 'string' ? value : ''
}

function textareaToLabelValueList(value: string): Array<{ label: string; value: string }> {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const separatorIndex = item.search(/[:|-]/)
      if (separatorIndex === -1) return { label: item, value: '' }
      return {
        label: item.slice(0, separatorIndex).trim(),
        value: item.slice(separatorIndex + 1).trim(),
      }
    })
    .filter(item => item.label || item.value)
}

function faqsToTextarea(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>
          const question = String(row.question || row.title || '').trim()
          const answer = String(row.answer || row.body || row.description || '').trim()
          return question && answer ? `${question} | ${answer}` : question || answer
        }
        return String(item).trim()
      })
      .filter(Boolean)
      .join('\n')
  }

  return typeof value === 'string' ? value : ''
}

function textareaToFaqs(value: string): Array<{ question: string; answer: string }> {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [question = '', ...answerParts] = item.split('|')
      return {
        question: question.trim(),
        answer: answerParts.join('|').trim(),
      }
    })
    .filter(item => item.question && item.answer)
}

function specsToVisibility(specs: Record<string, unknown>): ProductPageVisibility {
  const value = specs.product_page_visibility
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PRODUCT_PAGE_VISIBILITY
  const overrides = value as Partial<Record<keyof ProductPageVisibility, unknown>>
  return PRODUCT_PAGE_VISIBILITY_LABELS.reduce<ProductPageVisibility>(
    (next, item) => ({
      ...next,
      [item.key]: typeof overrides[item.key] === 'boolean' ? Boolean(overrides[item.key]) : next[item.key],
    }),
    { ...DEFAULT_PRODUCT_PAGE_VISIBILITY },
  )
}

function specsToBuilder(specs: Record<string, unknown>): ProductContentBuilder {
  return {
    product_page_layout: String(specs.product_page_layout || 'auto'),
    overview: String(specs.overview || specs.long_description || specs.design_summary || ''),
    product_story_title: String(specs.product_story_title || ''),
    product_story: String(specs.product_story || ''),
    blueprint_title: String(specs.blueprint_title || ''),
    video_url: String(specs.video_url || specs.youtube_url || specs.video_embed_url || ''),
    video_title: String(specs.video_title || ''),
    video_description: String(specs.video_description || ''),
    included: listToTextarea(specs.included || specs.download_contents),
    requirements: listToTextarea(specs.requirements || specs.required_parts || specs.electronics_required),
    manufacturing_notes: listToTextarea(specs.manufacturing_notes || specs.print_settings || specs.shipping_notes),
    purchase_notes: listToTextarea(specs.purchase_notes || specs.notes),
    support_policy: String(specs.support_policy || specs.support || ''),
    shipping_window: String(specs.shipping_window || specs.lead_time || specs.leadtime || ''),
    who_it_is_for: String(specs.who_it_is_for || specs.who_its_for || specs.ideal_for || ''),
    who_it_is_not_for: String(specs.who_it_is_not_for || specs.who_its_not_for || ''),
    technical_specs: labelValueListToTextarea(specs.technical_specs),
    product_faqs: faqsToTextarea(specs.product_faqs),
    recommended_product_slugs: listToTextarea(specs.recommended_product_slugs),
  }
}

function mergeBuilderIntoSpecs(specs: Record<string, unknown>, builder: ProductContentBuilder, visibility: ProductPageVisibility) {
  const next: Record<string, unknown> = { ...specs }
  ;(Object.keys(builder) as Array<keyof ProductContentBuilder>).forEach(key => {
    const value = builder[key].trim()
    if (!value) {
      delete next[key]
      return
    }
    if (key === 'technical_specs') {
      next.technical_specs = textareaToLabelValueList(value)
      return
    }
    if (key === 'product_faqs') {
      next.product_faqs = textareaToFaqs(value)
      return
    }
    if (key === 'recommended_product_slugs') {
      next.recommended_product_slugs = textareaToList(value)
      return
    }
    next[key] = BUILDER_LIST_FIELDS.includes(key) ? textareaToList(value) : value
  })
  if (!builder.technical_specs.trim()) delete next.technical_specs
  if (!builder.product_faqs.trim()) delete next.product_faqs
  if (!builder.recommended_product_slugs.trim()) delete next.recommended_product_slugs
  next.product_page_layout = builder.product_page_layout || 'auto'
  next.product_page_visibility = visibility
  if (builder.shipping_window.trim()) next.lead_time = builder.shipping_window.trim()
  if (builder.who_it_is_for.trim()) next.ideal_for = builder.who_it_is_for.trim()
  return next
}

export default function AdminProductForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: brands } = useMarketplaceBrands(true)
  const { data: products = [] } = useProducts()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    sale_price: '',
    sale_label: '',
    fulfillment_type: 'fdm',
    brand_id: '',
    brand: 'Wingxtra',
    product_family: 'additive_manufacturing',
    product_origin: 'wingxtra',
    delivery_type: 'digital_download',
    additive_manufacturing_type: 'fdm_printable_files',
    supplier_sku: '',
    warranty_notes: '',
    compatibility_notes: '',
    is_new_arrival: false,
    category_id: '',
    stock_count: '0',
    track_inventory: true,
    inventory_policy: 'deny',
    low_stock_threshold: '3',
    lead_time_days: '0',
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
  const [builder, setBuilder] = useState<ProductContentBuilder>(EMPTY_CONTENT_BUILDER)
  const [pageVisibility, setPageVisibility] = useState<ProductPageVisibility>(DEFAULT_PRODUCT_PAGE_VISIBILITY)

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
            const productSpecs = (p.specs || {}) as Record<string, unknown>
            setForm({
              name: p.name,
              slug: p.slug,
              description: p.description,
              price: String(p.price),
              sale_price: p.sale_price ? String(p.sale_price) : '',
              sale_label: p.sale_label || '',
              fulfillment_type: p.fulfillment_type,
              brand_id: p.brand_id || '',
              brand: p.brand || 'Wingxtra',
              product_family: p.product_family || getProductFamily(p),
              product_origin: p.product_origin || (p.brand && p.brand !== 'Wingxtra' ? 'curated_brand' : 'wingxtra'),
              delivery_type: p.delivery_type || getProductDeliveryType(p),
              additive_manufacturing_type: p.additive_manufacturing_type || getProductAdditiveType(p),
              supplier_sku: p.supplier_sku || '',
              warranty_notes: p.warranty_notes || '',
              compatibility_notes: p.compatibility_notes || '',
              is_new_arrival: Boolean(p.is_new_arrival),
              category_id: p.category_id || '',
              stock_count: String(p.stock_count),
              track_inventory: p.track_inventory !== false,
              inventory_policy: p.inventory_policy || (p.fulfillment_type === 'fdm' ? 'made_to_order' : 'deny'),
              low_stock_threshold: String(p.low_stock_threshold ?? 3),
              lead_time_days: String(p.lead_time_days ?? 0),
              weight_grams: String(p.weight_grams),
              is_active: p.is_active,
              is_drone_product: p.is_drone_product,
              is_recommended_electronic: p.is_recommended_electronic,
              tags: p.tags.join(', '),
              specs: JSON.stringify(productSpecs, null, 2),
            })
            setBuilder(specsToBuilder(productSpecs))
            setPageVisibility(specsToVisibility(productSpecs))
            setImagePreview(p.image_url)
          }
        })
    }
  }, [id, isEdit])

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: isEdit ? f.slug : slugify(name) }))
  }

  function handleFulfillmentChange(fulfillment_type: string) {
    setForm(f => ({
      ...f,
      fulfillment_type,
      delivery_type: fulfillment_type === 'fdm' ? 'digital_download' : fulfillment_type === 'mjf' ? 'made_to_order' : f.delivery_type || 'physical_shipment',
      product_family: fulfillment_type === 'fdm' || fulfillment_type === 'mjf' ? 'additive_manufacturing' : f.product_family,
      additive_manufacturing_type:
        fulfillment_type === 'fdm'
          ? 'fdm_printable_files'
          : fulfillment_type === 'mjf'
            ? 'mjf_printed_parts'
            : f.additive_manufacturing_type,
      track_inventory: fulfillment_type !== 'fdm',
      inventory_policy: fulfillment_type === 'fdm' ? 'made_to_order' : fulfillment_type === 'mjf' ? 'made_to_order' : f.inventory_policy,
    }))
  }

  function handleBrandSelect(brandId: string) {
    const selectedBrand = brands?.find(brand => brand.id === brandId)
    setForm(current => ({
      ...current,
      brand_id: brandId,
      brand: selectedBrand?.name || current.brand,
      product_origin: selectedBrand?.origin_type || current.product_origin,
      warranty_notes: current.warranty_notes || selectedBrand?.warranty_notes || '',
    }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function applySpecTemplate() {
    const template = PRODUCT_SPEC_TEMPLATES[form.fulfillment_type as keyof typeof PRODUCT_SPEC_TEMPLATES]
    setForm(current => ({
      ...current,
      specs: JSON.stringify(template, null, 2),
    }))
    setBuilder(specsToBuilder(template as unknown as Record<string, unknown>))
    setPageVisibility(DEFAULT_PRODUCT_PAGE_VISIBILITY)
    toast.success('Spec template inserted')
  }

  function updateBuilder<K extends keyof ProductContentBuilder>(key: K, value: ProductContentBuilder[K]) {
    setBuilder(current => ({ ...current, [key]: value }))
  }

  function togglePageVisibility(key: keyof ProductPageVisibility) {
    setPageVisibility(current => ({ ...current, [key]: !current[key] }))
  }

  function toggleRecommendedProduct(slug: string) {
    setBuilder(current => {
      const selected = new Set(textareaToList(current.recommended_product_slugs))
      if (selected.has(slug)) selected.delete(slug)
      else selected.add(slug)
      return { ...current, recommended_product_slugs: Array.from(selected).join('\n') }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let image_url = imagePreview
      let stl_file_path = ''

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${form.slug}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      if (stlFile) {
        const path = `${form.slug}-${Date.now()}.stl`
        const { error: uploadError } = await supabase.storage.from('stl-files').upload(path, stlFile, { upsert: true })
        if (uploadError) throw uploadError
        stl_file_path = path
      }

      let parsedSpecs: Record<string, unknown> = {}
      try {
        parsedSpecs = form.specs ? JSON.parse(form.specs) : {}
      } catch {
        parsedSpecs = {}
      }

      const salePrice = form.sale_price ? parseFloat(form.sale_price) : null
      const basePrice = parseFloat(form.price)

      const mergedSpecs = mergeBuilderIntoSpecs(parsedSpecs, builder, pageVisibility)

      const payload: Partial<Product> = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: basePrice,
        sale_price: salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : null,
        sale_label: form.sale_label.trim(),
        fulfillment_type: form.fulfillment_type as Product['fulfillment_type'],
        brand_id: form.brand_id || null,
        brand: form.brand.trim() || 'Wingxtra',
        product_family: form.product_family,
        product_origin: form.product_origin,
        delivery_type: form.delivery_type,
        additive_manufacturing_type: form.product_family === 'additive_manufacturing' ? form.additive_manufacturing_type : null,
        supplier_sku: form.supplier_sku.trim(),
        warranty_notes: form.warranty_notes.trim(),
        compatibility_notes: form.compatibility_notes.trim(),
        is_new_arrival: form.is_new_arrival,
        category_id: form.category_id || null,
        stock_count: parseInt(form.stock_count),
        track_inventory: form.fulfillment_type === 'fdm' ? false : form.track_inventory,
        inventory_policy: form.inventory_policy,
        low_stock_threshold: parseInt(form.low_stock_threshold || '3'),
        lead_time_days: parseInt(form.lead_time_days || '0'),
        weight_grams: parseFloat(form.weight_grams),
        is_active: form.is_active,
        is_drone_product: form.is_drone_product,
        is_recommended_electronic: form.is_recommended_electronic,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        specs: mergedSpecs,
        ...(image_url && { image_url }),
        ...(stl_file_path && { stl_file_path }),
      }

      if (isEdit) {
        const { error } = await supabase.from('products').update(payload as never).eq('id', id!)
        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase.from('products').insert(payload as never)
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

  const selectedRecommendedProductSlugs = new Set(textareaToList(builder.recommended_product_slugs))
  const recommendedProductOptions = products
    .filter(product => product.id !== id)
    .slice(0, 24)
  const basePriceValue = Number(form.price || 0)
  const salePriceValue = Number(form.sale_price || 0)
  const saleIsActive = salePriceValue > 0 && salePriceValue < basePriceValue
  const saleIsInvalid = salePriceValue > 0 && basePriceValue > 0 && salePriceValue >= basePriceValue

  return (
    <>
      <SEO title={isEdit ? 'Edit Product' : 'New Product'} noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{isEdit ? 'Edit Product' : 'New Product'}</span>
            <h1 className={styles.title}>{isEdit ? 'Refine a product already in the catalog.' : 'Create a new store-ready product.'}</h1>
            <p className={styles.subtitle}>
              Build cleaner product data here so the storefront can present clearer pricing, fulfillment, promotions, and buyer guidance later.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.mainCol}>
              <div className={styles.section}>
                <h2>Product info</h2>
                <div className={styles.fields}>
                  <Input label="Product Name *" value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                  <Input label="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} hint="URL-friendly identifier" required />
                  <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <textarea
                      className={styles.textarea}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder="Product description..."
                    />
                  </div>
                  <div className={styles.row2}>
                    <Input
                      label="Base Price (GHS) *"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      hint="Stored in the store base currency and converted for USD, GHS, and NGN on the storefront."
                      required
                    />
                    <div className={styles.field}>
                      <label className={styles.label}>Fulfillment Type *</label>
                      <select
                        className={styles.select}
                        value={form.fulfillment_type}
                        onChange={e => handleFulfillmentChange(e.target.value)}
                      >
                        {FULFILLMENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Managed Brand Profile</label>
                      <select
                        className={styles.select}
                        value={form.brand_id}
                        onChange={e => handleBrandSelect(e.target.value)}
                      >
                        <option value="">Manual brand name</option>
                        {brands?.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Brand"
                      value={form.brand}
                      onChange={e => setForm(f => ({ ...f, brand: e.target.value, brand_id: '' }))}
                      hint="Use a managed brand profile when possible; manual names still work for one-off products."
                    />
                  </div>
                  <div className={styles.row2}>
                    <Input
                      label="Supplier SKU"
                      value={form.supplier_sku}
                      onChange={e => setForm(f => ({ ...f, supplier_sku: e.target.value }))}
                      hint="Optional internal or supplier code."
                    />
                    <div className={styles.field}>
                      <label className={styles.label}>Product Family</label>
                      <select
                        className={styles.select}
                        value={form.product_family}
                        onChange={e => setForm(f => ({ ...f, product_family: e.target.value }))}
                      >
                        {PRODUCT_FAMILY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Product Origin</label>
                      <select
                        className={styles.select}
                        value={form.product_origin}
                        onChange={e => setForm(f => ({ ...f, product_origin: e.target.value }))}
                      >
                        {PRODUCT_ORIGIN_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Delivery Type</label>
                      <select
                        className={styles.select}
                        value={form.delivery_type}
                        onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}
                      >
                        {DELIVERY_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Additive Manufacturing Type</label>
                      <select
                        className={styles.select}
                        value={form.additive_manufacturing_type}
                        onChange={e => setForm(f => ({ ...f, additive_manufacturing_type: e.target.value }))}
                      >
                        <option value="">Not additive manufacturing</option>
                        {ADDITIVE_MANUFACTURING_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Marketplace Role</label>
                      <div className={styles.readOnlyInfo}>
                        {form.brand_id ? 'Linked to managed brand profile' : 'Manual brand entry'}
                      </div>
                    </div>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Warranty / Support Notes</label>
                      <textarea
                        className={styles.textarea}
                        value={form.warranty_notes}
                        onChange={e => setForm(f => ({ ...f, warranty_notes: e.target.value }))}
                        rows={3}
                        placeholder="Manufacturer warranty, Wingxtra inspection, or support policy..."
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Compatibility Notes</label>
                      <textarea
                        className={styles.textarea}
                        value={form.compatibility_notes}
                        onChange={e => setForm(f => ({ ...f, compatibility_notes: e.target.value }))}
                        rows={3}
                        placeholder="Recommended flight controllers, motors, aircraft, or payload fitment..."
                      />
                    </div>
                  </div>
                  <div className={styles.merchPanel}>
                    <div className={styles.inventoryHeader}>
                      <span className={styles.builderEyebrow}>Merchandising status</span>
                      <h3>Control New Arrival and Sale badges from admin.</h3>
                    </div>
                    <div className={styles.row2}>
                      <Input
                        label="Sale Price (GHS)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.sale_price}
                        onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                        hint="On Sale turns on only when this is lower than the base price."
                      />
                      <Input
                        label="Sale Label"
                        value={form.sale_label}
                        onChange={e => setForm(f => ({ ...f, sale_label: e.target.value }))}
                        hint="Example: Limited drop, Launch price, Bundle deal."
                      />
                    </div>
                    <div className={styles.merchStatusGrid}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={form.is_new_arrival} onChange={e => setForm(f => ({ ...f, is_new_arrival: e.target.checked }))} />
                        Mark as New Arrival
                      </label>
                      <div className={`${styles.merchStatus} ${saleIsActive ? styles.merchStatusActive : ''} ${saleIsInvalid ? styles.merchStatusWarning : ''}`}>
                        <strong>{saleIsActive ? 'On Sale badge active' : saleIsInvalid ? 'Sale inactive' : 'Regular price'}</strong>
                        <span>
                          {saleIsActive
                            ? `${form.sale_label || 'Sale'} will show on product cards and pages.`
                            : saleIsInvalid
                              ? 'Sale price must be lower than base price to show as on sale.'
                              : 'Add a sale price below base price to show an On Sale badge.'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.clearSaleBtn}
                      onClick={() => setForm(f => ({ ...f, sale_price: '', sale_label: '' }))}
                    >
                      Clear sale pricing
                    </button>
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Category</label>
                      <select
                        className={styles.select}
                        value={form.category_id}
                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      >
                        <option value="">No Category</option>
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
                  {form.fulfillment_type !== 'fdm' && (
                    <div className={styles.inventoryPanel}>
                      <div className={styles.inventoryHeader}>
                        <span className={styles.builderEyebrow}>Inventory rules</span>
                        <h3>Control how stock behaves at checkout.</h3>
                      </div>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={form.track_inventory}
                          onChange={e => setForm(f => ({ ...f, track_inventory: e.target.checked }))}
                        />
                        Track inventory for this product
                      </label>
                      <div className={styles.row2}>
                        <div className={styles.field}>
                          <label className={styles.label}>Inventory Policy</label>
                          <select
                            className={styles.select}
                            value={form.inventory_policy}
                            onChange={e => setForm(f => ({ ...f, inventory_policy: e.target.value }))}
                          >
                            <option value="deny">Deny checkout when stock is empty</option>
                            <option value="allow_backorder">Allow backorders</option>
                            <option value="made_to_order">Made to order</option>
                          </select>
                        </div>
                        <Input
                          label="Low-stock threshold"
                          type="number"
                          min="0"
                          value={form.low_stock_threshold}
                          onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                        />
                      </div>
                      <Input
                        label="Lead time in days"
                        type="number"
                        min="0"
                        value={form.lead_time_days}
                        onChange={e => setForm(f => ({ ...f, lead_time_days: e.target.value }))}
                        hint="Shown for made-to-order items and useful for customer expectation setting."
                      />
                    </div>
                  )}
                  <Input
                    label="Tags (comma-separated)"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="fpv, racing, 5-inch"
                  />

                  <div className={styles.builderPanel}>
                    <div className={styles.builderHeader}>
                      <div>
                        <span className={styles.builderEyebrow}>Product page builder</span>
                        <h3>Control the storefront story without touching code.</h3>
                      </div>
                      <p>
                        These fields power the public product page sections. Use one line per item for lists.
                      </p>
                    </div>

                    <div className={styles.builderControlGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Product Page Layout</label>
                        <select
                          className={styles.select}
                          value={builder.product_page_layout}
                          onChange={e => updateBuilder('product_page_layout', e.target.value)}
                        >
                          <option value="auto">Auto: use product type</option>
                          <option value="aircraft">Aircraft / UAV detail layout</option>
                          <option value="standard">Standard marketplace product layout</option>
                        </select>
                        <p className={styles.fieldHint}>Use Aircraft for UAVs and airframes. Use Standard for electronics, motors, tools, and accessories.</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Section Visibility</label>
                        <div className={styles.builderToggleGrid}>
                          {PRODUCT_PAGE_VISIBILITY_LABELS.map(item => (
                            <label key={item.key} className={styles.builderToggle}>
                              <input
                                type="checkbox"
                                checked={pageVisibility[item.key]}
                                onChange={() => togglePageVisibility(item.key)}
                              />
                              <span>
                                <strong>{item.label}</strong>
                                <small>{item.help}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.builderGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Overview / Design Summary</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.overview}
                          onChange={e => updateBuilder('overview', e.target.value)}
                          rows={4}
                          placeholder="Explain what the product is, who it is for, and how it fits into a UAV build."
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Who It Is For</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.who_it_is_for}
                          onChange={e => updateBuilder('who_it_is_for', e.target.value)}
                          rows={4}
                          placeholder="Example: Builders who need a stable mapping platform with room for payload electronics."
                        />
                      </div>
                      <Input
                        label="Product Story Title"
                        value={builder.product_story_title}
                        onChange={e => updateBuilder('product_story_title', e.target.value)}
                        placeholder="Designed like a real aircraft component."
                      />
                      <Input
                        label="Blueprint / Build Context Title"
                        value={builder.blueprint_title}
                        onChange={e => updateBuilder('blueprint_title', e.target.value)}
                        placeholder="Build context before checkout"
                      />
                      <div className={styles.field}>
                        <label className={styles.label}>Product Story</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.product_story}
                          onChange={e => updateBuilder('product_story', e.target.value)}
                          rows={5}
                          placeholder="Longer narrative about engineering intent, material choice, compatibility, and why the product exists."
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>What Is Included</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.included}
                          onChange={e => updateBuilder('included', e.target.value)}
                          rows={5}
                          placeholder={'Core airframe kit\nBuild guide\nHardware notes'}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Requirements</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.requirements}
                          onChange={e => updateBuilder('requirements', e.target.value)}
                          rows={5}
                          placeholder={'Compatible flight controller\nRecommended motor and ESC\nBasic workshop tools'}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Manufacturing / Print / Shipping Notes</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.manufacturing_notes}
                          onChange={e => updateBuilder('manufacturing_notes', e.target.value)}
                          rows={5}
                          placeholder={'0.2 mm layer height\nPA12 MJF production\nComposite parts inspected before dispatch'}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Purchase Notes</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.purchase_notes}
                          onChange={e => updateBuilder('purchase_notes', e.target.value)}
                          rows={4}
                          placeholder={'Digital files are released after confirmed payment.\nPhysical items ship separately from digital orders.'}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Who It Is Not For</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.who_it_is_not_for}
                          onChange={e => updateBuilder('who_it_is_not_for', e.target.value)}
                          rows={4}
                          placeholder="Example: Not ideal if you want a fully assembled ready-to-fly aircraft."
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Technical Specs</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.technical_specs}
                          onChange={e => updateBuilder('technical_specs', e.target.value)}
                          rows={5}
                          placeholder={'Wingspan: 1200 mm\nMaterial: PA12 MJF nylon\nPayload: 1.5 kg'}
                        />
                        <p className={styles.fieldHint}>Use one spec per line in Label: Value format.</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Product FAQs</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.product_faqs}
                          onChange={e => updateBuilder('product_faqs', e.target.value)}
                          rows={5}
                          placeholder={'Is this a digital file? | This product includes downloadable STL files.\nCan I use it commercially? | Check the license and support policy before use.'}
                        />
                        <p className={styles.fieldHint}>Use one question per line in Question | Answer format.</p>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Recommended Products</label>
                      <p className={styles.fieldHint}>Choose add-ons or companion products for this page. These appear as recommendations even when no bundle table has been set up.</p>
                      <div className={styles.recommendedPickGrid}>
                        {recommendedProductOptions.map(product => (
                          <label key={product.id} className={styles.recommendedPickItem}>
                            <input
                              type="checkbox"
                              checked={selectedRecommendedProductSlugs.has(product.slug)}
                              onChange={() => toggleRecommendedProduct(product.slug)}
                            />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{product.brand || 'Wingxtra'} | {product.slug}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                      <textarea
                        className={styles.textarea}
                        value={builder.recommended_product_slugs}
                        onChange={e => updateBuilder('recommended_product_slugs', e.target.value)}
                        rows={3}
                        placeholder={'wingxtra-flight-controller\npayload-bay-stl'}
                      />
                      <p className={styles.fieldHint}>You can also paste product slugs manually, one per line.</p>
                    </div>

                    <div className={styles.videoGrid}>
                      <Input
                        label="Video URL"
                        value={builder.video_url}
                        onChange={e => updateBuilder('video_url', e.target.value)}
                        hint="YouTube, YouTube embed, or no-cookie embed URL."
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <Input
                        label="Video Title"
                        value={builder.video_title}
                        onChange={e => updateBuilder('video_title', e.target.value)}
                        placeholder="Build video"
                      />
                      <div className={styles.field}>
                        <label className={styles.label}>Video Description</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.video_description}
                          onChange={e => updateBuilder('video_description', e.target.value)}
                          rows={3}
                          placeholder="Explain what the buyer should look for in the video."
                        />
                      </div>
                      <Input
                        label="Shipping / Lead Time"
                        value={builder.shipping_window}
                        onChange={e => updateBuilder('shipping_window', e.target.value)}
                        placeholder="Ships in 4-7 business days"
                      />
                      <div className={styles.field}>
                        <label className={styles.label}>Support Policy</label>
                        <textarea
                          className={styles.textarea}
                          value={builder.support_policy}
                          onChange={e => updateBuilder('support_policy', e.target.value)}
                          rows={3}
                          placeholder="Explain revision support, brand warranty, or Wingxtra fitment guidance."
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Advanced Specs (JSON)</label>
                    <div className={styles.specTools}>
                      <button type="button" className={styles.specButton} onClick={applySpecTemplate}>
                        Load {form.fulfillment_type.toUpperCase()} template
                      </button>
                      <span className={styles.specHint}>Optional advanced override. The product page builder above will merge into this JSON when saved.</span>
                    </div>
                    <textarea
                      className={styles.textarea}
                      value={form.specs}
                      onChange={e => setForm(f => ({ ...f, specs: e.target.value }))}
                      rows={9}
                      placeholder='{"wingspan":"1200 mm","included":["Airframe STL set","Build notes"],"requirements":["FDM printer","Electronics"],"print_settings":["0.2 mm layers"],"support_policy":"Includes update notes for supported revisions."}'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sideCol}>
              <div className={styles.section}>
                <h2>Product image</h2>
                <label className={styles.uploadArea}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={24} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className={styles.fileInput} onChange={handleImageChange} />
                </label>
                {imagePreview && (
                  <button type="button" className={styles.clearImg} onClick={() => { setImagePreview(''); setImageFile(null) }}>
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              {form.fulfillment_type === 'fdm' && (
                <div className={styles.section}>
                  <h2>STL file</h2>
                  <label className={styles.uploadArea}>
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={24} />
                      <span>{stlFile ? stlFile.name : 'Click to upload .stl file'}</span>
                    </div>
                    <input type="file" accept=".stl" className={styles.fileInput} onChange={e => setStlFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}

              <div className={styles.section}>
                <h2>Options</h2>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    Active (visible in store)
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={form.is_drone_product} onChange={e => setForm(f => ({ ...f, is_drone_product: e.target.checked }))} />
                    Is Drone Product
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={form.is_recommended_electronic} onChange={e => setForm(f => ({ ...f, is_recommended_electronic: e.target.checked }))} />
                    Is Recommended Electronic
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" size="lg" loading={loading}>{isEdit ? 'Update Product' : 'Create Product'}</Button>
            {isEdit && <Button type="button" variant="secondary" onClick={() => navigate(`/admin/media?product=${id}`)}><Images size={16} /> Manage Media</Button>}
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  )
}
