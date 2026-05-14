import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, Eye, EyeOff, FileArchive, FileText, FileUp, Image as ImageIcon, Link as LinkIcon, PlayCircle, Save, Star, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAdminProducts, useProductMedia } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import type { Product, ProductMedia } from '@/lib/database.types'
import styles from './AdminMedia.module.css'

const PRODUCT_MEDIA_BUCKET = 'product-media'

const MEDIA_TYPES = [
  { value: 'image', label: 'Image', helper: 'Gallery image or product hero candidate' },
  { value: 'video', label: 'Video', helper: 'YouTube embed, MP4, WebM, or hosted video URL' },
  { value: 'manual', label: 'Manual', helper: 'Build guide, setup guide, or user manual' },
  { value: 'spec_sheet', label: 'Spec Sheet', helper: 'Datasheet, product specification, or technical PDF' },
  { value: 'blueprint', label: 'Blueprint PDF', helper: 'Plan sheets, drawings, or technical PDFs' },
  { value: 'stl', label: 'STL File', helper: 'Printable digital file attachment' },
  { value: 'mjf_file', label: 'MJF File', helper: 'MJF production file or manufacturing reference' },
  { value: 'download', label: 'Download Pack', helper: 'Digital download pack, ZIP bundle, or customer file set' },
  { value: 'attachment', label: 'Attachment', helper: 'Any supporting downloadable asset' },
]

type DraftMedia = {
  media_type: string
  title: string
  description: string
  url: string
  sort_order: string
  is_primary: boolean
  is_active: boolean
}

type MediaEdit = DraftMedia

const emptyDraft: DraftMedia = {
  media_type: 'image',
  title: '',
  description: '',
  url: '',
  sort_order: '0',
  is_primary: false,
  is_active: true,
}

function getMediaHref(media: Pick<ProductMedia, 'url' | 'storage_path'>) {
  if (media.url) return media.url
  if (media.storage_path) return supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(media.storage_path).data.publicUrl
  return ''
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.trim())
}

function getVideoEmbedUrl(rawUrl: string) {
  const source = rawUrl.trim()
  if (!source) return ''

  try {
    const url = new URL(source)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.replace('/', '')}`
    if (host.includes('youtube.com')) {
      const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop()
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    }
  } catch {
    return source
  }

  return source
}

function getAcceptForType(type: string) {
  if (type === 'image') return 'image/*'
  if (type === 'video') return 'video/*'
  if (type === 'manual' || type === 'blueprint' || type === 'spec_sheet') return '.pdf,application/pdf'
  if (type === 'stl') return '.stl,.3mf,.obj,.zip'
  if (type === 'mjf_file') return '.3mf,.step,.stp,.zip,.pdf'
  return '.pdf,.zip,.stl,.3mf,.step,.stp,.obj,image/*,video/*'
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function mediaIcon(type: string) {
  if (type === 'image') return <ImageIcon size={18} />
  if (type === 'video') return <PlayCircle size={18} />
  if (type === 'manual' || type === 'blueprint') return <FileText size={18} />
  return <FileArchive size={18} />
}

function mediaTypeLabel(type: string) {
  return MEDIA_TYPES.find(item => item.value === type)?.label || type.replace(/_/g, ' ')
}

function toEdit(media: ProductMedia): MediaEdit {
  return {
    media_type: media.media_type || 'image',
    title: media.title || '',
    description: media.description || '',
    url: media.url || '',
    sort_order: String(media.sort_order ?? 0),
    is_primary: Boolean(media.is_primary),
    is_active: media.is_active !== false,
  }
}

export default function AdminMedia() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: products = [] } = useAdminProducts()
  const [productId, setProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [draft, setDraft] = useState<DraftMedia>(emptyDraft)
  const [file, setFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [edits, setEdits] = useState<Record<string, MediaEdit>>({})

  const selectedProduct = useMemo(
    () => products.find(product => product.id === productId) as Product | undefined,
    [productId, products]
  )

  const productOptions = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    const filtered = term
      ? products.filter(product => {
          const haystack = [product.name, product.slug, product.brand, product.marketplace_brand?.name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(term)
        })
      : products

    if (selectedProduct && !filtered.some(product => product.id === selectedProduct.id)) {
      return [selectedProduct, ...filtered]
    }

    return filtered
  }, [productSearch, products, selectedProduct])

  const { data: productMedia = [], isLoading } = useProductMedia(productId, false)

  useEffect(() => {
    if (!products.length) return
    const requestedProductId = searchParams.get('product')
    if (requestedProductId && products.some(product => product.id === requestedProductId)) {
      setProductId(requestedProductId)
      return
    }
    if (!productId) {
      const firstProductId = products[0].id
      setProductId(firstProductId)
      setSearchParams({ product: firstProductId }, { replace: true })
    }
  }, [productId, products, searchParams, setSearchParams])

  useEffect(() => {
    setEdits(Object.fromEntries(productMedia.map(media => [media.id, toEdit(media)])))
  }, [productMedia])

  const mediaStats = useMemo(() => {
    const active = productMedia.filter(media => media.is_active !== false)
    return {
      images: active.filter(media => media.media_type === 'image').length,
      videos: active.filter(media => media.media_type === 'video').length,
      files: active.filter(media => !['image', 'video'].includes(media.media_type)).length,
      hidden: productMedia.length - active.length,
    }
  }, [productMedia])

  function handleProductChange(nextProductId: string) {
    setProductId(nextProductId)
    setSearchParams({ product: nextProductId })
  }

  const invalidateMedia = () => {
    qc.invalidateQueries({ queryKey: ['product-media'] })
    qc.invalidateQueries({ queryKey: ['products'] })
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    qc.invalidateQueries({ queryKey: ['product'] })
  }

  const setPrimaryImage = async (mediaId: string, href: string) => {
    const { error: clearError } = await supabase
      .from('product_media')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('media_type', 'image')

    if (clearError) throw clearError

    const { error: mediaError } = await supabase
      .from('product_media')
      .update({ is_primary: true, is_active: true })
      .eq('id', mediaId)

    if (mediaError) throw mediaError

    const { error: productError } = await supabase
      .from('products')
      .update({ image_url: href })
      .eq('id', productId)

    if (productError) throw productError
  }

  const addMedia = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error('Choose a product first')
      if (!draft.title.trim()) throw new Error('Add a clear media title')
      if (uploadMode === 'file' && !file) throw new Error('Choose a file to upload')
      if (uploadMode === 'url' && !draft.url.trim()) throw new Error('Add a URL')

      let storagePath = ''
      let publicUrl = draft.url.trim()
      let mimeType = ''

      if (uploadMode === 'file' && file) {
        const safeName = sanitizeFileName(file.name)
        storagePath = `${productId}/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from(PRODUCT_MEDIA_BUCKET).upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type || undefined,
          upsert: false,
        })

        if (uploadError) throw uploadError
        publicUrl = supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl
        mimeType = file.type || ''
      }

      const payload = {
        product_id: productId,
        media_type: draft.media_type,
        title: draft.title.trim(),
        description: draft.description.trim(),
        url: publicUrl,
        storage_path: storagePath,
        file_path: storagePath,
        mime_type: mimeType,
        sort_order: Number(draft.sort_order || 0),
        is_primary: draft.media_type === 'image' ? draft.is_primary : false,
        is_active: draft.is_active,
      }

      const { data, error } = await supabase.from('product_media').insert(payload).select('*').single()
      if (error) throw error

      const inserted = data as ProductMedia
      if (payload.is_primary && publicUrl) {
        await setPrimaryImage(inserted.id, publicUrl)
      }
    },
    onSuccess: () => {
      setDraft(emptyDraft)
      setFile(null)
      invalidateMedia()
      toast.success('Product media added')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveEdit = useMutation({
    mutationFn: async (media: ProductMedia) => {
      const edit = edits[media.id]
      if (!edit) return

      const payload = {
        media_type: edit.media_type,
        title: edit.title.trim(),
        description: edit.description.trim(),
        url: edit.url.trim(),
        sort_order: Number(edit.sort_order || 0),
        is_primary: edit.media_type === 'image' ? edit.is_primary : false,
        is_active: edit.is_active,
      }

      const { error } = await supabase.from('product_media').update(payload).eq('id', media.id)
      if (error) throw error

      const primaryHref = payload.url || getMediaHref(media)
      if (payload.is_primary && primaryHref) {
        await setPrimaryImage(media.id, primaryHref)
      }
    },
    onSuccess: () => {
      invalidateMedia()
      toast.success('Media updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const toggleActive = useMutation({
    mutationFn: async (media: ProductMedia) => {
      const { error } = await supabase.from('product_media').update({ is_active: media.is_active === false }).eq('id', media.id)
      if (error) throw error
    },
    onSuccess: invalidateMedia,
    onError: (error: Error) => toast.error(error.message),
  })

  const makePrimary = useMutation({
    mutationFn: async (media: ProductMedia) => {
      const href = getMediaHref(media)
      if (!href) throw new Error('This image needs a URL or uploaded file before it can become primary')
      await setPrimaryImage(media.id, href)
    },
    onSuccess: () => {
      invalidateMedia()
      toast.success('Primary image updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMedia = useMutation({
    mutationFn: async (media: ProductMedia) => {
      if (media.storage_path) {
        await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove([media.storage_path])
      }

      const { error } = await supabase.from('product_media').delete().eq('id', media.id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateMedia()
      toast.success('Media deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateEdit = (mediaId: string, patch: Partial<MediaEdit>) => {
    setEdits(current => ({ ...current, [mediaId]: { ...current[mediaId], ...patch } }))
  }

  return (
    <>
      <SEO title="Admin - Product Media" noIndex />
      <div className={styles.page}>
        <section className={styles.header}>
          <div>
            <span>Product Media Manager</span>
            <h1>Build richer product pages without code.</h1>
            <p>
              Upload gallery images, videos, manuals, blueprint PDFs, STL/MJF attachments, and supporting documents. Hidden media stays out of the public store.
            </p>
          </div>
        </section>

        <section className={styles.productPicker}>
          <label>
            <span>Find Product</span>
            <input
              value={productSearch}
              onChange={event => setProductSearch(event.target.value)}
              placeholder="Search by product, brand, or slug"
            />
          </label>
          <label>
            <span>Product</span>
            <select value={productId} onChange={event => handleProductChange(event.target.value)}>
              {productOptions.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          {selectedProduct && (
            <div className={styles.productSummary}>
              <img src={selectedProduct.image_url} alt={selectedProduct.name} />
              <div>
                <strong>{selectedProduct.name}</strong>
                <small>{selectedProduct.brand || selectedProduct.marketplace_brand?.name || 'Wingxtra'} | {selectedProduct.fulfillment_type.toUpperCase()}</small>
                <div className={styles.productLinks}>
                  <Link to={`/admin/products/${selectedProduct.id}/edit`}>Edit product</Link>
                  <Link to={`/product/${selectedProduct.slug}`} target="_blank" rel="noreferrer">View page</Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <div>
              <span>Add Media</span>
              <h2>Attach a file or paste a hosted URL.</h2>
            </div>
            <div className={styles.modeSwitch}>
              <button type="button" className={uploadMode === 'file' ? styles.modeActive : ''} onClick={() => setUploadMode('file')}>
                <FileUp size={15} /> Upload
              </button>
              <button type="button" className={uploadMode === 'url' ? styles.modeActive : ''} onClick={() => setUploadMode('url')}>
                <LinkIcon size={15} /> URL
              </button>
            </div>
          </div>

          <form className={styles.form} onSubmit={event => { event.preventDefault(); addMedia.mutate() }}>
            <label className={styles.field}>
              <span>Type</span>
              <select value={draft.media_type} onChange={event => setDraft(current => ({ ...current, media_type: event.target.value, is_primary: event.target.value === 'image' ? current.is_primary : false }))}>
                {MEDIA_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <small>{MEDIA_TYPES.find(type => type.value === draft.media_type)?.helper}</small>
            </label>
            <Input label="Title" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} required />
            <Input label="Sort Order" type="number" value={draft.sort_order} onChange={event => setDraft(current => ({ ...current, sort_order: event.target.value }))} />
            {uploadMode === 'file' ? (
              <label className={styles.fileDrop}>
                <FileUp size={20} />
                <span>{file ? file.name : 'Choose image, PDF, video, STL, or support file'}</span>
                <input type="file" accept={getAcceptForType(draft.media_type)} onChange={event => setFile(event.target.files?.[0] || null)} />
              </label>
            ) : (
              <Input label="Hosted URL" value={draft.url} onChange={event => setDraft(current => ({ ...current, url: event.target.value }))} placeholder="https://..." />
            )}
            <label className={styles.fieldWide}>
              <span>Description</span>
              <textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} rows={3} />
            </label>
            <div className={styles.toggles}>
              <label><input type="checkbox" checked={draft.is_active} onChange={event => setDraft(current => ({ ...current, is_active: event.target.checked }))} /> Active on product page</label>
              <label><input type="checkbox" checked={draft.is_primary} disabled={draft.media_type !== 'image'} onChange={event => setDraft(current => ({ ...current, is_primary: event.target.checked }))} /> Use as primary image</label>
            </div>
            <Button loading={addMedia.isPending} disabled={!productId}>
              <Save size={16} /> Add Media
            </Button>
          </form>
        </section>

        <section className={styles.mediaSection}>
          <div className={styles.sectionTitleRow}>
            <div>
              <span>Attached Media</span>
              <h2>{selectedProduct?.name || 'Choose a product'}</h2>
            </div>
            <p>
              {productMedia.length} asset{productMedia.length === 1 ? '' : 's'} attached | {mediaStats.images} image{mediaStats.images === 1 ? '' : 's'}, {mediaStats.videos} video{mediaStats.videos === 1 ? '' : 's'}, {mediaStats.files} file{mediaStats.files === 1 ? '' : 's'}
              {mediaStats.hidden > 0 ? `, ${mediaStats.hidden} hidden` : ''}
            </p>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>Loading product media...</div>
          ) : productMedia.length === 0 ? (
            <div className={styles.emptyState}>No media yet. Add the first gallery image, video, manual, or file pack above.</div>
          ) : (
            <div className={styles.mediaGrid}>
              {productMedia.map(media => {
                const edit = edits[media.id] || toEdit(media)
                const href = getMediaHref(media)
                const canPreviewImage = media.media_type === 'image' && href
                const canPreviewVideo = media.media_type === 'video' && href
                const videoEmbedUrl = canPreviewVideo ? getVideoEmbedUrl(href) : ''

                return (
                  <article key={media.id} className={`${styles.mediaCard} ${media.is_active === false ? styles.mediaCardHidden : ''}`}>
                    <div className={styles.previewBox}>
                      {canPreviewImage ? (
                        <img src={href} alt={media.title || 'Product media'} />
                      ) : canPreviewVideo && isDirectVideoUrl(href) ? (
                        <video src={href} controls />
                      ) : canPreviewVideo && videoEmbedUrl ? (
                        <iframe
                          src={videoEmbedUrl}
                          title={media.title || 'Product video'}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <div className={styles.filePreview}>{mediaIcon(media.media_type)}<span>{mediaTypeLabel(media.media_type)}</span></div>
                      )}
                      <div className={styles.previewBadges}>
                        <span>{mediaTypeLabel(media.media_type)}</span>
                        {media.is_primary && <span><Star size={12} /> Primary</span>}
                        {media.is_active === false && <span>Hidden</span>}
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.inlineGrid}>
                        <label><span>Type</span><select value={edit.media_type} onChange={event => updateEdit(media.id, { media_type: event.target.value })}>{MEDIA_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                        <label><span>Order</span><input type="number" value={edit.sort_order} onChange={event => updateEdit(media.id, { sort_order: event.target.value })} /></label>
                      </div>
                      <label className={styles.compactField}><span>Title</span><input value={edit.title} onChange={event => updateEdit(media.id, { title: event.target.value })} /></label>
                      <label className={styles.compactField}><span>URL</span><input value={edit.url} onChange={event => updateEdit(media.id, { url: event.target.value })} placeholder={media.storage_path ? 'Uploaded file URL is generated automatically' : 'https://...'} /></label>
                      <label className={styles.compactField}><span>Description</span><textarea rows={3} value={edit.description} onChange={event => updateEdit(media.id, { description: event.target.value })} /></label>
                      <div className={styles.cardToggles}>
                        <label><input type="checkbox" checked={edit.is_active} onChange={event => updateEdit(media.id, { is_active: event.target.checked })} /> Active</label>
                        <label><input type="checkbox" checked={edit.is_primary} disabled={edit.media_type !== 'image'} onChange={event => updateEdit(media.id, { is_primary: event.target.checked })} /> Primary image</label>
                      </div>
                      <div className={styles.cardActions}>
                        <Button type="button" variant="secondary" size="sm" onClick={() => saveEdit.mutate(media)} loading={saveEdit.isPending}>Save</Button>
                        {media.media_type === 'image' && <Button type="button" variant="outline" size="sm" onClick={() => makePrimary.mutate(media)} loading={makePrimary.isPending}><Star size={14} /> Primary</Button>}
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggleActive.mutate(media)} loading={toggleActive.isPending}>{media.is_active === false ? <Eye size={14} /> : <EyeOff size={14} />}{media.is_active === false ? 'Show' : 'Hide'}</Button>
                        {href && <a href={href} className={styles.openLink} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open</a>}
                        <Button type="button" variant="danger" size="sm" onClick={() => deleteMedia.mutate(media)} loading={deleteMedia.isPending}><Trash2 size={14} /> Delete</Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
