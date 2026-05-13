import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Eye, FileText, Globe2, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { useAdminSiteContent } from '@/hooks/useSiteContent'
import {
  getDefaultSiteContent,
  type CollectionItemContent,
  type ContentKey,
  type DronesPageContent,
  type FaqContent,
  type GlobalStoreContent,
  type HeroSlideContent,
  type HighlightContent,
  type HomePageContent,
  type LinkContent,
  type PointContent,
  type ProductPageTemplateContent,
  type ShopPageContent,
  type StorySectionContent,
  type TestimonialContent,
} from '@/lib/siteContent'
import { supabase } from '@/lib/supabase'
import styles from './AdminContent.module.css'

const PAGE_META: Record<ContentKey, { label: string; title: string; href: string; description: string }> = {
  home_page: {
    label: 'Homepage',
    title: 'Home Page Content',
    href: '/',
    description: 'Control the hero, collections, story sections, FAQs, newsletter, and community messaging on the store homepage.',
  },
  drones_page: {
    label: 'Drones',
    title: 'Drone Collection Content',
    href: '/drones',
    description: 'Manage the dedicated drone collection copy, buying guidance, and comparison page framing.',
  },
  shop_page: {
    label: 'Shop',
    title: 'Shop Catalog Content',
    href: '/shop',
    description: 'Control the catalog hero and featured commerce rail that shapes the broader product browsing experience.',
  },
  global_store: {
    label: 'Global',
    title: 'Global Store Content',
    href: '/',
    description: 'Manage the navbar, footer, and default SEO settings that affect the whole storefront.',
  },
  product_page_template: {
    label: 'Product Template',
    title: 'Product Page Template',
    href: '/product/wingxtra-scout-vtol-core-kit',
    description: 'Control the reusable headings, support copy, and SEO template that appear across product detail pages.',
  },
}

function cloneList<T>(items: T[]) {
  return items.map(item => structuredClone(item))
}

function replaceItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
}

function removeItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input className={styles.input} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea
        className={styles.textarea}
        value={value}
        rows={rows}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (checked: boolean) => void; description?: string }) {
  return (
    <label className={styles.toggleField}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.colorRow}>
        <input type="color" value={value.startsWith('#') ? value : '#25d66f'} onChange={event => onChange(event.target.value)} />
        <input className={styles.input} value={value} onChange={event => onChange(event.target.value)} />
      </div>
    </label>
  )
}

function LinkFields({ label, value, onChange }: { label: string; value: LinkContent; onChange: (next: LinkContent) => void }) {
  return (
    <div className={styles.editorCard}>
      <div className={styles.editorHeader}>
        <h4>{label}</h4>
      </div>
      <div className={styles.twoColumn}>
        <Field label="Label" value={value.label} onChange={next => onChange({ ...value, label: next })} />
        <Field label="Link" value={value.href} onChange={next => onChange({ ...value, href: next })} />
      </div>
    </div>
  )
}

function HighlightsEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: HighlightContent[]
  onChange: (next: HighlightContent[]) => void
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>{label}</h3>
          <p>Change the small stats or highlight chips shown inside the hero.</p>
        </div>
        <button
          type="button"
          className={styles.subtleBtn}
          onClick={() => onChange([...items, { value: 'New', label: 'Highlight' }])}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Highlight {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.twoColumn}>
              <Field label="Value" value={item.value} onChange={next => onChange(replaceItem(items, index, { ...item, value: next }))} />
              <Field label="Label" value={item.label} onChange={next => onChange(replaceItem(items, index, { ...item, label: next }))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroSlidesEditor({ items, onChange }: { items: HeroSlideContent[]; onChange: (next: HeroSlideContent[]) => void }) {
  const addSlide = () =>
    onChange([
      ...items,
      {
        isVisible: true,
        eyebrow: 'New slide',
        title: 'New homepage hero slide',
        body: 'Describe this homepage message.',
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=82',
        primaryCta: { label: 'Primary action', href: '/shop' },
        secondaryCta: { label: 'Secondary action', href: '/drones' },
        featureTag: 'Store feature',
        featureTitle: 'Supporting product message',
        featureBody: 'Use this to explain what the slide is promoting.',
        featureHref: '/shop',
        featureLabel: 'Open collection',
      },
    ])

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>Homepage hero slides</h3>
          <p>Add, hide, or edit the slider messages without touching code.</p>
        </div>
        <button type="button" className={styles.subtleBtn} onClick={addSlide}>
          <Plus size={14} /> Add Slide
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Hero Slide {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <ToggleField label="Show this slide" checked={item.isVisible} onChange={next => onChange(replaceItem(items, index, { ...item, isVisible: next }))} />
            <div className={styles.twoColumn}>
              <Field label="Eyebrow" value={item.eyebrow} onChange={next => onChange(replaceItem(items, index, { ...item, eyebrow: next }))} />
              <Field label="Title" value={item.title} onChange={next => onChange(replaceItem(items, index, { ...item, title: next }))} />
            </div>
            <TextareaField label="Body" rows={3} value={item.body} onChange={next => onChange(replaceItem(items, index, { ...item, body: next }))} />
            <Field label="Background image URL" value={item.image} onChange={next => onChange(replaceItem(items, index, { ...item, image: next }))} />
            <div className={styles.twoColumn}>
              <Field label="Primary button label" value={item.primaryCta.label} onChange={next => onChange(replaceItem(items, index, { ...item, primaryCta: { ...item.primaryCta, label: next } }))} />
              <Field label="Primary button link" value={item.primaryCta.href} onChange={next => onChange(replaceItem(items, index, { ...item, primaryCta: { ...item.primaryCta, href: next } }))} />
            </div>
            <div className={styles.twoColumn}>
              <Field label="Secondary button label" value={item.secondaryCta.label} onChange={next => onChange(replaceItem(items, index, { ...item, secondaryCta: { ...item.secondaryCta, label: next } }))} />
              <Field label="Secondary button link" value={item.secondaryCta.href} onChange={next => onChange(replaceItem(items, index, { ...item, secondaryCta: { ...item.secondaryCta, href: next } }))} />
            </div>
            <div className={styles.twoColumn}>
              <Field label="Feature tag" value={item.featureTag} onChange={next => onChange(replaceItem(items, index, { ...item, featureTag: next }))} />
              <Field label="Feature link label" value={item.featureLabel} onChange={next => onChange(replaceItem(items, index, { ...item, featureLabel: next }))} />
            </div>
            <Field label="Feature title" value={item.featureTitle} onChange={next => onChange(replaceItem(items, index, { ...item, featureTitle: next }))} />
            <TextareaField label="Feature body" rows={3} value={item.featureBody} onChange={next => onChange(replaceItem(items, index, { ...item, featureBody: next }))} />
            <Field label="Feature link" value={item.featureHref} onChange={next => onChange(replaceItem(items, index, { ...item, featureHref: next }))} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PointsEditor({
  label,
  description,
  items,
  onChange,
}: {
  label: string
  description: string
  items: PointContent[]
  onChange: (next: PointContent[]) => void
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>{label}</h3>
          <p>{description}</p>
        </div>
        <button type="button" className={styles.subtleBtn} onClick={() => onChange([...items, { title: 'New point', description: '' }])}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Item {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <Field label="Title" value={item.title} onChange={next => onChange(replaceItem(items, index, { ...item, title: next }))} />
            <TextareaField
              label="Description"
              value={item.description}
              rows={3}
              onChange={next => onChange(replaceItem(items, index, { ...item, description: next }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function CollectionsEditor({ items, onChange }: { items: CollectionItemContent[]; onChange: (next: CollectionItemContent[]) => void }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>Collections</h3>
          <p>Control the main homepage entry points into the drone, digital, and physical product flows.</p>
        </div>
        <button
          type="button"
          className={styles.subtleBtn}
          onClick={() =>
            onChange([
              ...items,
              { title: 'New Collection', description: '', href: '/shop', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
            ])
          }
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Collection {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.twoColumn}>
              <Field label="Title" value={item.title} onChange={next => onChange(replaceItem(items, index, { ...item, title: next }))} />
              <Field label="Link" value={item.href} onChange={next => onChange(replaceItem(items, index, { ...item, href: next }))} />
            </div>
            <Field label="Image URL" value={item.image} onChange={next => onChange(replaceItem(items, index, { ...item, image: next }))} />
            <TextareaField
              label="Description"
              rows={3}
              value={item.description}
              onChange={next => onChange(replaceItem(items, index, { ...item, description: next }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function StorySectionsEditor({ items, onChange }: { items: StorySectionContent[]; onChange: (next: StorySectionContent[]) => void }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>Editorial story sections</h3>
          <p>Edit the deeper narrative blocks that sit between the major commerce sections on the homepage.</p>
        </div>
        <button
          type="button"
          className={styles.subtleBtn}
          onClick={() =>
            onChange([
              ...items,
              {
                eyebrow: 'New Section',
                title: 'New story title',
                paragraphs: [''],
                cta: { label: 'Open link', href: '/shop' },
                image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
                imageAlt: 'Story image',
                align: 'imageRight',
                bullets: [],
              },
            ])
          }
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Story Section {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.twoColumn}>
              <Field label="Eyebrow" value={item.eyebrow} onChange={next => onChange(replaceItem(items, index, { ...item, eyebrow: next }))} />
              <Field label="Title" value={item.title} onChange={next => onChange(replaceItem(items, index, { ...item, title: next }))} />
            </div>
            <div className={styles.twoColumn}>
              <Field label="Image URL" value={item.image} onChange={next => onChange(replaceItem(items, index, { ...item, image: next }))} />
              <Field label="Image alt" value={item.imageAlt} onChange={next => onChange(replaceItem(items, index, { ...item, imageAlt: next }))} />
            </div>
            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Layout</span>
                <select
                  className={styles.select}
                  value={item.align}
                  onChange={event => onChange(replaceItem(items, index, { ...item, align: event.target.value as StorySectionContent['align'] }))}
                >
                  <option value="imageBottom">Image bottom</option>
                  <option value="imageLeft">Image left</option>
                  <option value="imageRight">Image right</option>
                </select>
              </label>
              <Field label="CTA label" value={item.cta.label} onChange={next => onChange(replaceItem(items, index, { ...item, cta: { ...item.cta, label: next } }))} />
            </div>
            <Field label="CTA link" value={item.cta.href} onChange={next => onChange(replaceItem(items, index, { ...item, cta: { ...item.cta, href: next } }))} />
            <TextareaField
              label="Paragraphs (one paragraph per line)"
              rows={6}
              value={item.paragraphs.join('\n')}
              onChange={next =>
                onChange(
                  replaceItem(items, index, {
                    ...item,
                    paragraphs: next
                      .split('\n')
                      .map(line => line.trim())
                      .filter(Boolean),
                  })
                )
              }
            />
            <TextareaField
              label="Bullets (one bullet per line)"
              rows={4}
              value={(item.bullets || []).join('\n')}
              onChange={next =>
                onChange(
                  replaceItem(items, index, {
                    ...item,
                    bullets: next
                      .split('\n')
                      .map(line => line.trim())
                      .filter(Boolean),
                  })
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsEditor({ items, onChange }: { items: TestimonialContent[]; onChange: (next: TestimonialContent[]) => void }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>Testimonials</h3>
          <p>Update the social proof shown on the homepage.</p>
        </div>
        <button type="button" className={styles.subtleBtn} onClick={() => onChange([...items, { quote: '', name: 'New reviewer', role: 'Builder' }])}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>Testimonial {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <TextareaField label="Quote" rows={4} value={item.quote} onChange={next => onChange(replaceItem(items, index, { ...item, quote: next }))} />
            <div className={styles.twoColumn}>
              <Field label="Name" value={item.name} onChange={next => onChange(replaceItem(items, index, { ...item, name: next }))} />
              <Field label="Role" value={item.role} onChange={next => onChange(replaceItem(items, index, { ...item, role: next }))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FaqEditor({ items, onChange }: { items: FaqContent[]; onChange: (next: FaqContent[]) => void }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3>Frequently asked questions</h3>
          <p>Keep the fast buyer education section editable without touching code.</p>
        </div>
        <button type="button" className={styles.subtleBtn} onClick={() => onChange([...items, { question: 'New question', answer: '' }])}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className={styles.stack}>
        {items.map((item, index) => (
          <div key={`${item.question}-${index}`} className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <h4>FAQ {index + 1}</h4>
              <button type="button" className={styles.iconBtn} onClick={() => onChange(removeItem(items, index))}>
                <Trash2 size={14} />
              </button>
            </div>
            <Field label="Question" value={item.question} onChange={next => onChange(replaceItem(items, index, { ...item, question: next }))} />
            <TextareaField label="Answer" rows={4} value={item.answer} onChange={next => onChange(replaceItem(items, index, { ...item, answer: next }))} />
          </div>
        ))}
      </div>
    </div>
  )
}

function HomeContentEditor({ content, onChange }: { content: HomePageContent; onChange: (next: HomePageContent) => void }) {
  const deliveryItems = content.deliveryTypes.items
  return (
    <div className={styles.stack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Homepage SEO</h3><p>Control the page title and meta description used for search and sharing.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="SEO title" value={content.seo.title} onChange={next => onChange({ ...content, seo: { ...content.seo, title: next } })} />
          <TextareaField label="SEO description" rows={3} value={content.seo.description} onChange={next => onChange({ ...content, seo: { ...content.seo, description: next } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div>
            <h3>Homepage section visibility</h3>
            <p>Hide unfinished homepage sections while you stock real products, media, and copy.</p>
          </div>
        </div>
        <div className={styles.toggleGrid}>
          {Object.entries(content.visibility).map(([key, value]) => (
            <ToggleField
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())}
              checked={value}
              onChange={next => onChange({ ...content, visibility: { ...content.visibility, [key]: next } })}
            />
          ))}
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div>
            <h3>Homepage visual controls</h3>
            <p>Control hero height, hero text scale, panel width, and section breathing room without CSS edits.</p>
          </div>
        </div>
        <div className={styles.twoColumn}>
          <Field label="Hero minimum height" value={content.design.heroMinHeight} onChange={next => onChange({ ...content, design: { ...content.design, heroMinHeight: next } })} />
          <Field label="Hero title scale" value={content.design.heroTitleScale} onChange={next => onChange({ ...content, design: { ...content.design, heroTitleScale: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Hero panel width" value={content.design.heroPanelWidth} onChange={next => onChange({ ...content, design: { ...content.design, heroPanelWidth: next } })} />
          <Field label="Hero overlay strength" value={content.design.heroOverlay} onChange={next => onChange({ ...content, design: { ...content.design, heroOverlay: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <label className={styles.field}>
            <span>Hero panel position</span>
            <select className={styles.select} value={content.design.heroPanelPosition} onChange={event => onChange({ ...content, design: { ...content.design, heroPanelPosition: event.target.value as HomePageContent['design']['heroPanelPosition'] } })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <Field label="Section spacing scale" value={content.design.sectionSpacing} onChange={next => onChange({ ...content, design: { ...content.design, sectionSpacing: next } })} />
        </div>
        <ToggleField label="Show hero stats" checked={content.design.showHeroStats} onChange={next => onChange({ ...content, design: { ...content.design, showHeroStats: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div>
            <h3>Homepage hero</h3>
            <p>These are the first words, links, and trust cues customers meet on the storefront.</p>
          </div>
        </div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.hero.eyebrow} onChange={next => onChange({ ...content, hero: { ...content.hero, eyebrow: next } })} />
          <Field label="Hero title" value={content.hero.title} onChange={next => onChange({ ...content, hero: { ...content.hero, title: next } })} />
        </div>
        <TextareaField label="Hero body" rows={4} value={content.hero.body} onChange={next => onChange({ ...content, hero: { ...content.hero, body: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Primary CTA label" value={content.hero.primaryCta.label} onChange={next => onChange({ ...content, hero: { ...content.hero, primaryCta: { ...content.hero.primaryCta, label: next } } })} />
          <Field label="Primary CTA link" value={content.hero.primaryCta.href} onChange={next => onChange({ ...content, hero: { ...content.hero, primaryCta: { ...content.hero.primaryCta, href: next } } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Secondary CTA label" value={content.hero.secondaryCta.label} onChange={next => onChange({ ...content, hero: { ...content.hero, secondaryCta: { ...content.hero.secondaryCta, label: next } } })} />
          <Field label="Secondary CTA link" value={content.hero.secondaryCta.href} onChange={next => onChange({ ...content, hero: { ...content.hero, secondaryCta: { ...content.hero.secondaryCta, href: next } } })} />
        </div>
      </div>

      <HighlightsEditor label="Hero Highlights" items={content.hero.highlights} onChange={next => onChange({ ...content, hero: { ...content.hero, highlights: next } })} />

      <HeroSlidesEditor items={content.hero.slides} onChange={next => onChange({ ...content, hero: { ...content.hero, slides: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div>
            <h3>Hero feature card</h3>
            <p>Edit the supporting drone showcase card on the right side of the homepage hero.</p>
          </div>
        </div>
        <Field label="Tag" value={content.hero.feature.tag} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, tag: next } } })} />
        <Field label="Title" value={content.hero.feature.title} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, title: next } } })} />
        <TextareaField label="Body" rows={4} value={content.hero.feature.body} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, body: next } } })} />
        <div className={styles.twoColumn}>
          <Field label="Link label" value={content.hero.feature.link.label} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, link: { ...content.hero.feature.link, label: next } } } })} />
          <Field label="Link href" value={content.hero.feature.link.href} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, link: { ...content.hero.feature.link, href: next } } } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Image URL" value={content.hero.feature.image} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, image: next } } })} />
          <Field label="Image alt" value={content.hero.feature.imageAlt} onChange={next => onChange({ ...content, hero: { ...content.hero, feature: { ...content.hero.feature, imageAlt: next } } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Section labels</h3><p>Control the headings that frame the main homepage content blocks.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Collections eyebrow" value={content.collections.eyebrow} onChange={next => onChange({ ...content, collections: { ...content.collections, eyebrow: next } })} />
          <Field label="Collections title" value={content.collections.title} onChange={next => onChange({ ...content, collections: { ...content.collections, title: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Drone lineup eyebrow" value={content.droneLineup.eyebrow} onChange={next => onChange({ ...content, droneLineup: { ...content.droneLineup, eyebrow: next } })} />
          <Field label="Drone lineup title" value={content.droneLineup.title} onChange={next => onChange({ ...content, droneLineup: { ...content.droneLineup, title: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Drone lineup link label" value={content.droneLineup.linkLabel} onChange={next => onChange({ ...content, droneLineup: { ...content.droneLineup, linkLabel: next } })} />
          <Field label="Categories eyebrow" value={content.categories.eyebrow} onChange={next => onChange({ ...content, categories: { ...content.categories, eyebrow: next } })} />
        </div>
        <Field label="Categories title" value={content.categories.title} onChange={next => onChange({ ...content, categories: { ...content.categories, title: next } })} />
        <TextareaField label="Categories description" rows={3} value={content.categories.description} onChange={next => onChange({ ...content, categories: { ...content.categories, description: next } })} />
      </div>

      <CollectionsEditor items={content.collections.items} onChange={next => onChange({ ...content, collections: { ...content.collections, items: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Store foundations heading</h3><p>These labels sit above the trust and transaction-support cards below the categories grid.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.storeFoundations.eyebrow} onChange={next => onChange({ ...content, storeFoundations: { ...content.storeFoundations, eyebrow: next } })} />
          <Field label="Title" value={content.storeFoundations.title} onChange={next => onChange({ ...content, storeFoundations: { ...content.storeFoundations, title: next } })} />
        </div>
      </div>

      <PointsEditor
        label="Store foundation cards"
        description="Manage the small trust cards for payments, downloads, shipping, and design quality."
        items={content.storeFoundations.items}
        onChange={next => onChange({ ...content, storeFoundations: { ...content.storeFoundations, items: next } })}
      />

      <StorySectionsEditor items={content.storySections} onChange={next => onChange({ ...content, storySections: next })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Delivery types heading</h3><p>Update the intro above the fulfillment-path cards.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.deliveryTypes.eyebrow} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, eyebrow: next } })} />
          <Field label="Title" value={content.deliveryTypes.title} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, title: next } })} />
        </div>
        <TextareaField label="Description" rows={3} value={content.deliveryTypes.description} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, description: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div><h3>Delivery type cards</h3><p>Control the three product-path cards for FDM, MJF, and composite buying options.</p></div>
          <button
            type="button"
            className={styles.subtleBtn}
            onClick={() => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: [...deliveryItems, { title: 'New delivery path', description: '', href: '/shop', linkLabel: 'Browse' }] } })}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div className={styles.stack}>
          {deliveryItems.map((item, index) => (
            <div key={`${item.title}-${index}`} className={styles.editorCard}>
              <div className={styles.editorHeader}>
                <h4>Delivery Card {index + 1}</h4>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: removeItem(deliveryItems, index) } })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className={styles.twoColumn}>
                <Field label="Title" value={item.title} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: replaceItem(deliveryItems, index, { ...item, title: next }) } })} />
                <Field label="Link" value={item.href} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: replaceItem(deliveryItems, index, { ...item, href: next }) } })} />
              </div>
              <Field label="Link label" value={item.linkLabel} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: replaceItem(deliveryItems, index, { ...item, linkLabel: next }) } })} />
              <TextareaField label="Description" rows={3} value={item.description} onChange={next => onChange({ ...content, deliveryTypes: { ...content.deliveryTypes, items: replaceItem(deliveryItems, index, { ...item, description: next }) } })} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Process story</h3><p>Edit the section that explains how the Wingxtra store guides customers from discovery to build confidence.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.processStory.eyebrow} onChange={next => onChange({ ...content, processStory: { ...content.processStory, eyebrow: next } })} />
          <Field label="Title" value={content.processStory.title} onChange={next => onChange({ ...content, processStory: { ...content.processStory, title: next } })} />
        </div>
        <TextareaField label="Description" rows={4} value={content.processStory.description} onChange={next => onChange({ ...content, processStory: { ...content.processStory, description: next } })} />
      </div>

      <PointsEditor
        label="Process story points"
        description="These cards explain the Wingxtra product and shopping approach."
        items={content.processStory.points}
        onChange={next => onChange({ ...content, processStory: { ...content.processStory, points: next } })}
      />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Featured products labels</h3><p>Control the heading above the promoted product rail.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.featuredProducts.eyebrow} onChange={next => onChange({ ...content, featuredProducts: { ...content.featuredProducts, eyebrow: next } })} />
          <Field label="Title" value={content.featuredProducts.title} onChange={next => onChange({ ...content, featuredProducts: { ...content.featuredProducts, title: next } })} />
        </div>
        <Field label="Link label" value={content.featuredProducts.linkLabel} onChange={next => onChange({ ...content, featuredProducts: { ...content.featuredProducts, linkLabel: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Testimonials heading</h3><p>Edit the intro above the testimonial cards.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.testimonials.eyebrow} onChange={next => onChange({ ...content, testimonials: { ...content.testimonials, eyebrow: next } })} />
          <Field label="Title" value={content.testimonials.title} onChange={next => onChange({ ...content, testimonials: { ...content.testimonials, title: next } })} />
        </div>
        <TextareaField label="Description" rows={3} value={content.testimonials.description} onChange={next => onChange({ ...content, testimonials: { ...content.testimonials, description: next } })} />
      </div>

      <TestimonialsEditor items={content.testimonials.items} onChange={next => onChange({ ...content, testimonials: { ...content.testimonials, items: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Community section</h3><p>Control the community pitch, image, and calls to action on the homepage.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.community.eyebrow} onChange={next => onChange({ ...content, community: { ...content.community, eyebrow: next } })} />
          <Field label="Title" value={content.community.title} onChange={next => onChange({ ...content, community: { ...content.community, title: next } })} />
        </div>
        <TextareaField label="Description" rows={4} value={content.community.description} onChange={next => onChange({ ...content, community: { ...content.community, description: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Image URL" value={content.community.image} onChange={next => onChange({ ...content, community: { ...content.community, image: next } })} />
          <Field label="Image alt" value={content.community.imageAlt} onChange={next => onChange({ ...content, community: { ...content.community, imageAlt: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Primary CTA label" value={content.community.primaryCta.label} onChange={next => onChange({ ...content, community: { ...content.community, primaryCta: { ...content.community.primaryCta, label: next } } })} />
          <Field label="Primary CTA link" value={content.community.primaryCta.href} onChange={next => onChange({ ...content, community: { ...content.community, primaryCta: { ...content.community.primaryCta, href: next } } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Secondary CTA label" value={content.community.secondaryCta.label} onChange={next => onChange({ ...content, community: { ...content.community, secondaryCta: { ...content.community.secondaryCta, label: next } } })} />
          <Field label="Secondary CTA link" value={content.community.secondaryCta.href} onChange={next => onChange({ ...content, community: { ...content.community, secondaryCta: { ...content.community.secondaryCta, href: next } } })} />
        </div>
      </div>

      <PointsEditor
        label="Community points"
        description="These smaller items explain what people gain from joining the wider Wingxtra builder ecosystem."
        items={content.community.points}
        onChange={next => onChange({ ...content, community: { ...content.community, points: next } })}
      />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>FAQ heading</h3><p>Edit the intro above the frequently asked questions grid.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.faq.eyebrow} onChange={next => onChange({ ...content, faq: { ...content.faq, eyebrow: next } })} />
          <Field label="Title" value={content.faq.title} onChange={next => onChange({ ...content, faq: { ...content.faq, title: next } })} />
        </div>
        <TextareaField label="Description" rows={3} value={content.faq.description} onChange={next => onChange({ ...content, faq: { ...content.faq, description: next } })} />
      </div>

      <FaqEditor items={content.faq.items} onChange={next => onChange({ ...content, faq: { ...content.faq, items: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Newsletter section</h3><p>These labels control the closing email capture section at the bottom of the homepage.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.newsletter.eyebrow} onChange={next => onChange({ ...content, newsletter: { ...content.newsletter, eyebrow: next } })} />
          <Field label="Title" value={content.newsletter.title} onChange={next => onChange({ ...content, newsletter: { ...content.newsletter, title: next } })} />
        </div>
        <TextareaField label="Description" rows={3} value={content.newsletter.description} onChange={next => onChange({ ...content, newsletter: { ...content.newsletter, description: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Input placeholder" value={content.newsletter.placeholder} onChange={next => onChange({ ...content, newsletter: { ...content.newsletter, placeholder: next } })} />
          <Field label="Button label" value={content.newsletter.buttonLabel} onChange={next => onChange({ ...content, newsletter: { ...content.newsletter, buttonLabel: next } })} />
        </div>
      </div>
    </div>
  )
}

function DronesContentEditor({ content, onChange }: { content: DronesPageContent; onChange: (next: DronesPageContent) => void }) {
  return (
    <div className={styles.stack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Drones page SEO</h3><p>Control the meta copy for the dedicated drone collection page.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="SEO title" value={content.seo.title} onChange={next => onChange({ ...content, seo: { ...content.seo, title: next } })} />
          <TextareaField label="SEO description" rows={3} value={content.seo.description} onChange={next => onChange({ ...content, seo: { ...content.seo, description: next } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Drones page hero</h3><p>Manage the top introduction for the dedicated airframe collection page.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.hero.eyebrow} onChange={next => onChange({ ...content, hero: { ...content.hero, eyebrow: next } })} />
          <Field label="Title" value={content.hero.title} onChange={next => onChange({ ...content, hero: { ...content.hero, title: next } })} />
        </div>
        <TextareaField label="Description" rows={4} value={content.hero.description} onChange={next => onChange({ ...content, hero: { ...content.hero, description: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Featured tag" value={content.hero.featuredTag} onChange={next => onChange({ ...content, hero: { ...content.hero, featuredTag: next } })} />
          <Field label="Featured link label" value={content.hero.featuredLinkLabel} onChange={next => onChange({ ...content, hero: { ...content.hero, featuredLinkLabel: next } })} />
        </div>
      </div>

      <HighlightsEditor label="Hero Stats" items={content.hero.stats} onChange={next => onChange({ ...content, hero: { ...content.hero, stats: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Filter section intro</h3><p>Control the small section introducing the drone filters.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.filterIntro.eyebrow} onChange={next => onChange({ ...content, filterIntro: { ...content.filterIntro, eyebrow: next } })} />
          <TextareaField label="Description" rows={3} value={content.filterIntro.description} onChange={next => onChange({ ...content, filterIntro: { ...content.filterIntro, description: next } })} />
        </div>
      </div>

      <PointsEditor
        label="Buying points"
        description="These cards help buyers understand how to compare and choose the right drone platform."
        items={content.buyingPoints}
        onChange={next => onChange({ ...content, buyingPoints: next })}
      />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Collection overview heading</h3><p>Controls the heading above the main comparison grid.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.overview.eyebrow} onChange={next => onChange({ ...content, overview: { ...content.overview, eyebrow: next } })} />
          <Field label="Title" value={content.overview.title} onChange={next => onChange({ ...content, overview: { ...content.overview, title: next } })} />
        </div>
      </div>
    </div>
  )
}

function ShopContentEditor({ content, onChange }: { content: ShopPageContent; onChange: (next: ShopPageContent) => void }) {
  return (
    <div className={styles.stack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Shop page SEO</h3><p>Control the store-catalog metadata shown in search and sharing previews.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="SEO title" value={content.seo.title} onChange={next => onChange({ ...content, seo: { ...content.seo, title: next } })} />
          <TextareaField label="SEO description" rows={3} value={content.seo.description} onChange={next => onChange({ ...content, seo: { ...content.seo, description: next } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Shop page hero</h3><p>Edit the broad catalog messaging that frames the store before people filter down.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Eyebrow" value={content.hero.eyebrow} onChange={next => onChange({ ...content, hero: { ...content.hero, eyebrow: next } })} />
          <Field label="Title" value={content.hero.title} onChange={next => onChange({ ...content, hero: { ...content.hero, title: next } })} />
        </div>
        <TextareaField label="Description" rows={4} value={content.hero.description} onChange={next => onChange({ ...content, hero: { ...content.hero, description: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div><h3>Hero highlight lines</h3><p>These are the short supporting lines underneath the shop hero.</p></div>
          <button type="button" className={styles.subtleBtn} onClick={() => onChange({ ...content, hero: { ...content.hero, highlights: [...content.hero.highlights, 'New highlight'] } })}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div className={styles.stack}>
          {content.hero.highlights.map((item, index) => (
            <div key={`${item}-${index}`} className={styles.inlineEditorRow}>
              <input
                className={styles.inlineInput}
                value={item}
                onChange={event => onChange({ ...content, hero: { ...content.hero, highlights: replaceItem(content.hero.highlights, index, event.target.value) } })}
              />
              <button type="button" className={styles.iconBtn} onClick={() => onChange({ ...content, hero: { ...content.hero, highlights: removeItem(content.hero.highlights, index) } })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <HighlightsEditor label="Hero Stats" items={content.hero.stats} onChange={next => onChange({ ...content, hero: { ...content.hero, stats: next } })} />

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
          <div><h3>Feature rail</h3><p>These featured cards shape how shoppers discover digital files, shipped products, and promotions.</p></div>
          <button
            type="button"
            className={styles.subtleBtn}
            onClick={() => onChange({ ...content, featureRail: [...content.featureRail, { title: 'New feature', description: '', href: '/shop', linkLabel: 'Open collection' }] })}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div className={styles.stack}>
          {content.featureRail.map((item, index) => (
            <div key={`${item.title}-${index}`} className={styles.editorCard}>
              <div className={styles.editorHeader}>
                <h4>Feature Card {index + 1}</h4>
                <button type="button" className={styles.iconBtn} onClick={() => onChange({ ...content, featureRail: removeItem(content.featureRail, index) })}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className={styles.twoColumn}>
                <Field label="Title" value={item.title} onChange={next => onChange({ ...content, featureRail: replaceItem(content.featureRail, index, { ...item, title: next }) })} />
                <Field label="Link" value={item.href} onChange={next => onChange({ ...content, featureRail: replaceItem(content.featureRail, index, { ...item, href: next }) })} />
              </div>
              <Field label="Link label" value={item.linkLabel} onChange={next => onChange({ ...content, featureRail: replaceItem(content.featureRail, index, { ...item, linkLabel: next }) })} />
              <TextareaField label="Description" rows={3} value={item.description} onChange={next => onChange({ ...content, featureRail: replaceItem(content.featureRail, index, { ...item, description: next }) })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GlobalContentEditor({ content, onChange }: { content: GlobalStoreContent; onChange: (next: GlobalStoreContent) => void }) {
  return (
    <div className={styles.stack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Global SEO defaults</h3><p>These defaults are used across the store when a page or product does not provide its own image or meta copy.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Site name" value={content.seo.siteName} onChange={next => onChange({ ...content, seo: { ...content.seo, siteName: next } })} />
          <Field label="Default image URL" value={content.seo.defaultImage} onChange={next => onChange({ ...content, seo: { ...content.seo, defaultImage: next } })} />
        </div>
        <TextareaField label="Default meta description" rows={4} value={content.seo.defaultDescription} onChange={next => onChange({ ...content, seo: { ...content.seo, defaultDescription: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Navbar content</h3><p>Control the main navigation labels and the large product-menu messaging.</p></div></div>
        <div className={styles.toggleGrid}>
          <ToggleField label="Show Shop nav item" checked={content.navbar.showShop} onChange={next => onChange({ ...content, navbar: { ...content.navbar, showShop: next } })} />
          <ToggleField label="Show New Arrivals nav item" checked={content.navbar.showNewArrivals} onChange={next => onChange({ ...content, navbar: { ...content.navbar, showNewArrivals: next } })} />
          <ToggleField label="Show Products dropdown" checked={content.navbar.showProducts} onChange={next => onChange({ ...content, navbar: { ...content.navbar, showProducts: next } })} />
          <ToggleField label="Show Brands dropdown" checked={content.navbar.showBrands} onChange={next => onChange({ ...content, navbar: { ...content.navbar, showBrands: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Shop label" value={content.navbar.shopLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, shopLabel: next } })} />
          <Field label="New arrivals label" value={content.navbar.newArrivalsLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, newArrivalsLabel: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Products label" value={content.navbar.productsLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, productsLabel: next } })} />
          <Field label="Brands label" value={content.navbar.brandsLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, brandsLabel: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Mega-menu eyebrow" value={content.navbar.megaEyebrow} onChange={next => onChange({ ...content, navbar: { ...content.navbar, megaEyebrow: next } })} />
          <Field label="Brands menu eyebrow" value={content.navbar.brandsEyebrow} onChange={next => onChange({ ...content, navbar: { ...content.navbar, brandsEyebrow: next } })} />
        </div>
        <Field label="Mega-menu title" value={content.navbar.megaTitle} onChange={next => onChange({ ...content, navbar: { ...content.navbar, megaTitle: next } })} />
        <Field label="Brands menu title" value={content.navbar.brandsTitle} onChange={next => onChange({ ...content, navbar: { ...content.navbar, brandsTitle: next } })} />
        <div className={styles.twoColumn}>
          <Field label="View all products label" value={content.navbar.megaViewAllLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, megaViewAllLabel: next } })} />
          <Field label="View all brands label" value={content.navbar.brandsViewAllLabel} onChange={next => onChange({ ...content, navbar: { ...content.navbar, brandsViewAllLabel: next } })} />
        </div>
        <Field label="Maximum brand cards in dropdown" value={content.navbar.maxBrandCards} onChange={next => onChange({ ...content, navbar: { ...content.navbar, maxBrandCards: next } })} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Store theme</h3><p>Change key colors and surface settings globally. Use carefully; this controls the storefront feel.</p></div></div>
        <div className={styles.twoColumn}>
          <ColorField label="Background color" value={content.theme.backgroundColor} onChange={next => onChange({ ...content, theme: { ...content.theme, backgroundColor: next } })} />
          <ColorField label="Surface color" value={content.theme.surfaceColor} onChange={next => onChange({ ...content, theme: { ...content.theme, surfaceColor: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <ColorField label="Accent color" value={content.theme.accentColor} onChange={next => onChange({ ...content, theme: { ...content.theme, accentColor: next } })} />
          <ColorField label="Accent soft color" value={content.theme.accentSoftColor} onChange={next => onChange({ ...content, theme: { ...content.theme, accentSoftColor: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <ColorField label="Text color" value={content.theme.textColor} onChange={next => onChange({ ...content, theme: { ...content.theme, textColor: next } })} />
          <Field label="Muted text color" value={content.theme.mutedTextColor} onChange={next => onChange({ ...content, theme: { ...content.theme, mutedTextColor: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Hero overlay color" value={content.theme.heroOverlayColor} onChange={next => onChange({ ...content, theme: { ...content.theme, heroOverlayColor: next } })} />
          <Field label="Card radius" value={content.theme.cardRadius} onChange={next => onChange({ ...content, theme: { ...content.theme, cardRadius: next } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Footer content</h3><p>Make the footer text, support email, and footer badges editable from admin.</p></div></div>
        <TextareaField label="Tagline" rows={3} value={content.footer.tagline} onChange={next => onChange({ ...content, footer: { ...content.footer, tagline: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Shop heading" value={content.footer.shopHeading} onChange={next => onChange({ ...content, footer: { ...content.footer, shopHeading: next } })} />
          <Field label="Account heading" value={content.footer.accountHeading} onChange={next => onChange({ ...content, footer: { ...content.footer, accountHeading: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Support heading" value={content.footer.supportHeading} onChange={next => onChange({ ...content, footer: { ...content.footer, supportHeading: next } })} />
          <Field label="Support email" value={content.footer.supportEmail} onChange={next => onChange({ ...content, footer: { ...content.footer, supportEmail: next } })} />
        </div>
        <div className={styles.twoColumn}>
          <Field label="Documentation label" value={content.footer.documentationLabel} onChange={next => onChange({ ...content, footer: { ...content.footer, documentationLabel: next } })} />
          <Field label="Copyright text" value={content.footer.copyrightText} onChange={next => onChange({ ...content, footer: { ...content.footer, copyrightText: next } })} />
        </div>
        <TextareaField
          label="Footer badges (one per line)"
          rows={4}
          value={content.footer.badges.join('\n')}
          onChange={next => onChange({ ...content, footer: { ...content.footer, badges: next.split('\n').map(line => line.trim()).filter(Boolean) } })}
        />
      </div>
    </div>
  )
}

function ProductTemplateEditor({ content, onChange }: { content: ProductPageTemplateContent; onChange: (next: ProductPageTemplateContent) => void }) {
  const headings = content.headings
  return (
    <div className={styles.stack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Product SEO template</h3><p>Use placeholders like {'{product}'} and {'{summary}'} to shape product-page metadata.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Title template" value={content.seo.titleTemplate} onChange={next => onChange({ ...content, seo: { ...content.seo, titleTemplate: next } })} />
          <Field label="Description template" value={content.seo.descriptionTemplate} onChange={next => onChange({ ...content, seo: { ...content.seo, descriptionTemplate: next } })} />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}><div><h3>Product page headings</h3><p>These control the reusable section labels and guidance that appear across product pages.</p></div></div>
        <div className={styles.twoColumn}>
          <Field label="Before-you-buy title" value={headings.beforeYouBuyTitle} onChange={next => onChange({ ...content, headings: { ...headings, beforeYouBuyTitle: next } })} />
          <Field label="Included title" value={headings.includedTitle} onChange={next => onChange({ ...content, headings: { ...headings, includedTitle: next } })} />
        </div>
        <TextareaField label="Included description" rows={3} value={headings.includedDescription} onChange={next => onChange({ ...content, headings: { ...headings, includedDescription: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Requirements title" value={headings.requirementsTitle} onChange={next => onChange({ ...content, headings: { ...headings, requirementsTitle: next } })} />
          <Field label="Support title" value={headings.supportTitle} onChange={next => onChange({ ...content, headings: { ...headings, supportTitle: next } })} />
        </div>
        <TextareaField label="Requirements description" rows={3} value={headings.requirementsDescription} onChange={next => onChange({ ...content, headings: { ...headings, requirementsDescription: next } })} />
        <TextareaField label="Support description" rows={3} value={headings.supportDescription} onChange={next => onChange({ ...content, headings: { ...headings, supportDescription: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Digital manufacturing title" value={headings.manufacturingTitleDigital} onChange={next => onChange({ ...content, headings: { ...headings, manufacturingTitleDigital: next } })} />
          <Field label="Physical manufacturing title" value={headings.manufacturingTitlePhysical} onChange={next => onChange({ ...content, headings: { ...headings, manufacturingTitlePhysical: next } })} />
        </div>
        <TextareaField label="Digital manufacturing description" rows={3} value={headings.manufacturingDescriptionDigital} onChange={next => onChange({ ...content, headings: { ...headings, manufacturingDescriptionDigital: next } })} />
        <TextareaField label="Physical manufacturing description" rows={3} value={headings.manufacturingDescriptionPhysical} onChange={next => onChange({ ...content, headings: { ...headings, manufacturingDescriptionPhysical: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Technical specs title" value={headings.technicalTitle} onChange={next => onChange({ ...content, headings: { ...headings, technicalTitle: next } })} />
          <Field label="Reviews title" value={headings.reviewsTitle} onChange={next => onChange({ ...content, headings: { ...headings, reviewsTitle: next } })} />
        </div>
        <TextareaField label="Technical specs description" rows={3} value={headings.technicalDescription} onChange={next => onChange({ ...content, headings: { ...headings, technicalDescription: next } })} />
        <TextareaField label="Reviews description" rows={3} value={headings.reviewsDescription} onChange={next => onChange({ ...content, headings: { ...headings, reviewsDescription: next } })} />
        <div className={styles.twoColumn}>
          <Field label="Bundles title" value={headings.bundlesTitle} onChange={next => onChange({ ...content, headings: { ...headings, bundlesTitle: next } })} />
          <TextareaField label="Bundles description" rows={3} value={headings.bundlesDescription} onChange={next => onChange({ ...content, headings: { ...headings, bundlesDescription: next } })} />
        </div>
      </div>
    </div>
  )
}

export default function AdminContent() {
  const qc = useQueryClient()
  const { data, isLoading } = useAdminSiteContent()
  const [activePage, setActivePage] = useState<ContentKey>('home_page')
  const [homeContent, setHomeContent] = useState<HomePageContent>(getDefaultSiteContent('home_page'))
  const [dronesContent, setDronesContent] = useState<DronesPageContent>(getDefaultSiteContent('drones_page'))
  const [shopContent, setShopContent] = useState<ShopPageContent>(getDefaultSiteContent('shop_page'))
  const [globalContent, setGlobalContent] = useState<GlobalStoreContent>(getDefaultSiteContent('global_store'))
  const [productTemplateContent, setProductTemplateContent] = useState<ProductPageTemplateContent>(getDefaultSiteContent('product_page_template'))
  const [published, setPublished] = useState<Record<ContentKey, boolean>>({
    home_page: true,
    drones_page: true,
    shop_page: true,
    global_store: true,
    product_page_template: true,
  })

  useEffect(() => {
    if (!data) return
    setHomeContent(structuredClone(data.home_page.content))
    setDronesContent(structuredClone(data.drones_page.content))
    setShopContent(structuredClone(data.shop_page.content))
    setGlobalContent(structuredClone(data.global_store.content))
    setProductTemplateContent(structuredClone(data.product_page_template.content))
    setPublished({
      home_page: data.home_page.row?.is_published ?? true,
      drones_page: data.drones_page.row?.is_published ?? true,
      shop_page: data.shop_page.row?.is_published ?? true,
      global_store: data.global_store.row?.is_published ?? true,
      product_page_template: data.product_page_template.row?.is_published ?? true,
    })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      const contentMap = {
        home_page: homeContent,
        drones_page: dronesContent,
        shop_page: shopContent,
        global_store: globalContent,
        product_page_template: productTemplateContent,
      }

      const { data: userData } = await supabase.auth.getUser()
      const payload = {
        key: activePage,
        title: PAGE_META[activePage].title,
        content: contentMap[activePage],
        published_content: publish ? contentMap[activePage] : undefined,
        is_published: publish ? true : published[activePage],
        updated_by: userData.user?.id ?? null,
      }

      const { error } = await supabase.from('site_content').upsert(payload as never, { onConflict: 'key' })
      if (error) throw error
      return { publish }
    },
    onSuccess: ({ publish }) => {
      qc.invalidateQueries({ queryKey: ['admin-site-content'] })
      qc.invalidateQueries({ queryKey: ['site-content', activePage] })
      qc.invalidateQueries({ queryKey: ['site-content', 'global_store'] })
      qc.invalidateQueries({ queryKey: ['site-content', 'product_page_template'] })
      toast.success(`${PAGE_META[activePage].label} ${publish ? 'published' : 'draft saved'}`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const resetCurrentPage = () => {
    if (!data) return
    if (activePage === 'home_page') setHomeContent(structuredClone(data.home_page.content))
    if (activePage === 'drones_page') setDronesContent(structuredClone(data.drones_page.content))
    if (activePage === 'shop_page') setShopContent(structuredClone(data.shop_page.content))
    if (activePage === 'global_store') setGlobalContent(structuredClone(data.global_store.content))
    if (activePage === 'product_page_template') setProductTemplateContent(structuredClone(data.product_page_template.content))
    setPublished(prev => ({
      ...prev,
      [activePage]: data[activePage].row?.is_published ?? true,
    }))
    toast.success(`Reset ${PAGE_META[activePage].label} changes`)
  }

  const editor = useMemo(() => {
    if (activePage === 'home_page') return <HomeContentEditor content={homeContent} onChange={setHomeContent} />
    if (activePage === 'drones_page') return <DronesContentEditor content={dronesContent} onChange={setDronesContent} />
    if (activePage === 'shop_page') return <ShopContentEditor content={shopContent} onChange={setShopContent} />
    if (activePage === 'global_store') return <GlobalContentEditor content={globalContent} onChange={setGlobalContent} />
    return <ProductTemplateEditor content={productTemplateContent} onChange={setProductTemplateContent} />
  }, [activePage, homeContent, dronesContent, shopContent, globalContent, productTemplateContent])

  return (
    <>
      <SEO title="Admin - Content" noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Content Control</span>
            <h1 className={styles.title}>Run the store copy, story, and merchandising layout from admin.</h1>
            <p className={styles.subtitle}>
              This is the first real CMS layer for Wingxtra Store. You can now change the hero, category messaging, story sections,
              FAQs, newsletter copy, and the main drones and shop page framing without coming back through engineering.
            </p>
          </div>
        </section>

        <div className={styles.toolbar}>
          <div className={styles.pageTabs}>
            {(Object.keys(PAGE_META) as ContentKey[]).map(key => (
              <button
                key={key}
                type="button"
                className={`${styles.pageTab} ${activePage === key ? styles.pageTabActive : ''}`}
                onClick={() => setActivePage(key)}
              >
                {key === 'global_store' ? <Globe2 size={15} /> : <FileText size={15} />} {PAGE_META[key].label}
              </button>
            ))}
          </div>

          <div className={styles.toolbarActions}>
            <Link to={PAGE_META[activePage].href} className={styles.previewLink} target="_blank" rel="noreferrer">
              <Eye size={14} /> Published View <ExternalLink size={12} />
            </Link>
            <Link to={`${PAGE_META[activePage].href}?preview=draft`} className={styles.previewLink} target="_blank" rel="noreferrer">
              <Eye size={14} /> Draft Preview <ExternalLink size={12} />
            </Link>
            <button type="button" className={styles.subtleBtn} onClick={resetCurrentPage} disabled={!data}>
              <RotateCcw size={14} /> Reset
            </button>
            <Button onClick={() => saveMutation.mutate({ publish: false })} loading={saveMutation.isPending} disabled={isLoading}>
              <Save size={16} /> Save Draft
            </Button>
            <Button onClick={() => saveMutation.mutate({ publish: true })} loading={saveMutation.isPending} disabled={isLoading}>
              <Send size={16} /> Publish Live
            </Button>
          </div>
        </div>

        <div className={styles.statusCard}>
          <div>
            <strong>{PAGE_META[activePage].label}</strong>
            <p>{PAGE_META[activePage].description}</p>
          </div>
          <label className={styles.publishToggle}>
            <input
              type="checkbox"
              checked={published[activePage]}
              onChange={event => setPublished(prev => ({ ...prev, [activePage]: event.target.checked }))}
            />
            Keep published content enabled on the storefront
          </label>
        </div>

        {isLoading ? <div className={styles.loading}>Loading content editor...</div> : editor}
      </div>
    </>
  )
}
