import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { useAdminSiteContent } from '@/hooks/useSiteContent'
import { deepMergeContent, getDefaultSiteContent, type GlobalStoreContent, type NavCardContent } from '@/lib/siteContent'
import { supabase } from '@/lib/supabase'
import styles from './AdminCollections.module.css'

const NAV_MEDIA_BUCKET = 'product-media'

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function replaceItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
}

function removeItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item)
  return next
}

const blankCard = (): NavCardContent => ({
  id: `custom-${Date.now()}`,
  isVisible: true,
  label: 'New navigation card',
  description: 'Describe this collection or store destination.',
  href: '/shop',
  image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80',
})

export default function AdminCollections() {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminSiteContent()
  const [content, setContent] = useState<GlobalStoreContent>(getDefaultSiteContent('global_store'))
  const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null)

  useEffect(() => {
    if (data?.global_store.content) {
      setContent(deepMergeContent(getDefaultSiteContent('global_store'), data.global_store.content))
    }
  }, [data])

  const saveNavigation = useMutation({
    mutationFn: async () => {
      const payload = {
        key: 'global_store',
        title: 'Global Store Content',
        content,
        published_content: content,
        is_published: true,
      }
      const { error } = await supabase.from('site_content').upsert(payload as never, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-site-content'] })
      qc.invalidateQueries({ queryKey: ['site-content', 'global_store'] })
      toast.success('Navigation updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save navigation'),
  })

  const updateNavbar = (navbar: GlobalStoreContent['navbar']) => setContent(current => ({ ...current, navbar }))
  const updateCard = (index: number, card: NavCardContent) => updateNavbar({ ...content.navbar, productCards: replaceItem(content.navbar.productCards, index, card) })

  async function uploadCardImage(index: number, file?: File) {
    if (!file) return
    try {
      setUploadingCardIndex(index)
      const safeName = sanitizeFileName(file.name)
      const storagePath = `navigation/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from(NAV_MEDIA_BUCKET).upload(storagePath, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      })
      if (error) throw error
      const publicUrl = supabase.storage.from(NAV_MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl
      updateCard(index, { ...content.navbar.productCards[index], image: publicUrl })
      toast.success('Navigation image uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not upload navigation image')
    } finally {
      setUploadingCardIndex(null)
    }
  }

  return (
    <>
      <SEO title="Admin Navigation" noIndex />
      <div className={styles.page}>
        <section className={styles.header}>
          <div>
            <span>Navigation</span>
            <h1>Control the premium dropdown cards.</h1>
            <p>Edit, hide, remove, and reorder the Products mega-menu cards here. These changes publish to the storefront navigation after saving.</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/" target="_blank" rel="noreferrer" className={styles.previewLink}><ExternalLink size={15} /> View store</Link>
            <Button onClick={() => saveNavigation.mutate()} loading={saveNavigation.isPending}><Save size={16} /> Save Navigation</Button>
          </div>
        </section>

        <section className={styles.controls}>
          <div className={styles.controlGrid}>
            <label>
              <span>Products label</span>
              <input value={content.navbar.productsLabel} onChange={event => updateNavbar({ ...content.navbar, productsLabel: event.target.value })} />
            </label>
            <label>
              <span>Mega eyebrow</span>
              <input value={content.navbar.megaEyebrow} onChange={event => updateNavbar({ ...content.navbar, megaEyebrow: event.target.value })} />
            </label>
          </div>
          <label>
            <span>Mega title</span>
            <input value={content.navbar.megaTitle} onChange={event => updateNavbar({ ...content.navbar, megaTitle: event.target.value })} />
          </label>
        </section>

        <section className={styles.editorPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Dropdown Cards</span>
              <h2>{content.navbar.productCards.length} destinations</h2>
            </div>
            <button type="button" className={styles.addBtn} onClick={() => updateNavbar({ ...content.navbar, productCards: [...content.navbar.productCards, blankCard()] })}>
              <Plus size={15} /> Add destination
            </button>
          </div>

          {isLoading ? (
            <p className={styles.empty}>Loading navigation...</p>
          ) : (
            <div className={styles.grid}>
              {content.navbar.productCards.map((card, index) => (
                <article key={`${card.id}-${index}`} className={`${styles.card} ${card.isVisible ? '' : styles.hiddenCard}`}>
                  <div className={styles.cardPreview}>
                    {card.image && <img src={card.image} alt="" />}
                    <span>{card.isVisible ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <strong>{card.label || `Card ${index + 1}`}</strong>
                      <div className={styles.cardActions}>
                        <button type="button" onClick={() => updateNavbar({ ...content.navbar, productCards: moveItem(content.navbar.productCards, index, -1) })} disabled={index === 0}><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => updateNavbar({ ...content.navbar, productCards: moveItem(content.navbar.productCards, index, 1) })} disabled={index === content.navbar.productCards.length - 1}><ArrowDown size={14} /></button>
                        <button type="button" className={styles.deleteBtn} onClick={() => updateNavbar({ ...content.navbar, productCards: removeItem(content.navbar.productCards, index) })}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <label className={styles.toggleLine}>
                      <input type="checkbox" checked={card.isVisible} onChange={event => updateCard(index, { ...card, isVisible: event.target.checked })} />
                      Show this card in Products dropdown
                    </label>
                    <label><span>Label</span><input value={card.label} onChange={event => updateCard(index, { ...card, label: event.target.value })} /></label>
                    <label><span>Link</span><input value={card.href} onChange={event => updateCard(index, { ...card, href: event.target.value })} /></label>
                    <label><span>Image URL</span><input value={card.image} onChange={event => updateCard(index, { ...card, image: event.target.value })} /></label>
                    <label className={styles.uploadLine}>
                      <ImagePlus size={16} />
                      <span>{uploadingCardIndex === index ? 'Uploading image...' : 'Upload navigation image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCardIndex === index}
                        onChange={event => {
                          uploadCardImage(index, event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    <label><span>Description</span><textarea rows={3} value={card.description} onChange={event => updateCard(index, { ...card, description: event.target.value })} /></label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
