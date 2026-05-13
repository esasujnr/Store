import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, PackageCheck, ShieldCheck, Wrench } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import Button from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import { useSiteContent } from '@/hooks/useSiteContent'
import { PRODUCT_FAMILY_OPTIONS } from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { getDefaultSiteContent } from '@/lib/siteContent'
import styles from './HomePage.module.css'

export default function HomePage() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: contentData } = useSiteContent('home_page', previewMode)
  const { data: products } = useProducts()
  const content = contentData ?? getDefaultSiteContent('home_page')
  const catalog = products?.length ? products : fallbackProducts
  const featured = catalog.slice(0, 6)
  const [slide, setSlide] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const heroSlides = useMemo(() => [
    {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      body: content.hero.body,
      image: content.hero.feature.image,
      primary: content.hero.primaryCta,
      secondary: content.hero.secondaryCta,
      featureTag: content.hero.feature.tag,
      featureTitle: content.hero.feature.title,
      featureBody: content.hero.feature.body,
      featureHref: content.hero.feature.link.href,
      featureLabel: content.hero.feature.link.label,
    },
    {
      eyebrow: 'Curated UAV marketplace',
      title: 'Curated UAV systems, parts, and mission hardware.',
      body: 'Wingxtra aircraft and selected partner products sit inside one clear buying experience for builders and operators.',
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80',
      primary: { label: 'Open Catalog', href: '/shop' },
      secondary: { label: 'View Collections', href: '/collection/new-arrivals' },
      featureTag: 'Marketplace expansion',
      featureTitle: 'A cleaner way to shop UAV platforms, components, and technologies.',
      featureBody: 'The store now supports Wingxtra aircraft plus third-party products without losing the premium aerospace structure.',
      featureHref: '/shop',
      featureLabel: 'Browse marketplace',
    },
    {
      eyebrow: 'Additive manufacturing',
      title: 'Digital files, MJF parts, and shipped hardware made clear.',
      body: 'Customers can quickly tell whether they are buying a download, a made-to-order part, or a physical shipment.',
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1800&q=80',
      primary: { label: 'Explore Files', href: '/collection/additive_manufacturing' },
      secondary: { label: 'Shop Parts', href: '/shop' },
      featureTag: 'Fulfillment clarity',
      featureTitle: 'Files and physical products are separated before checkout.',
      featureBody: 'Digital downloads, MJF parts, and composite hardware are shown as real products with specific expectations.',
      featureHref: '/collection/additive_manufacturing',
      featureLabel: 'Open additive collection',
    },
  ], [content])

  const active = heroSlides[slide]
  const collectionCards = PRODUCT_FAMILY_OPTIONS.slice(0, 6)

  return (
    <>
      <SEO title={content.seo.title} description={content.seo.description} url="/" />

      <section className={styles.heroShell} style={{ backgroundImage: `linear-gradient(90deg, rgba(3, 8, 4, 0.72), rgba(3, 8, 4, 0.26) 48%, rgba(3, 8, 4, 0.86)), url(${active.image})` }}>
        <button className={`${styles.heroArrow} ${styles.heroArrowLeft}`} onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)} aria-label="Previous slide">
          <span aria-hidden="true">←</span>
        </button>

        <div className={styles.heroCanvas}>
          <article className={styles.heroPanel}>
            <span className={styles.eyebrow}>{active.eyebrow}</span>
            <h1>{active.title}</h1>
            <p>{active.body}</p>
            <div className={styles.heroActions}>
              <Link to={active.primary.href}><Button size="lg">{active.primary.label}</Button></Link>
              <Link to={active.secondary.href}><Button size="lg" variant="secondary">{active.secondary.label}</Button></Link>
            </div>
            <div className={styles.heroStats}>
              {content.hero.highlights.map(item => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.heroDots}>
              {heroSlides.map((_, index) => (
                <button key={index} className={index === slide ? styles.dotActive : ''} onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} />
              ))}
            </div>
          </article>
        </div>

        <button className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={() => setSlide((slide + 1) % heroSlides.length)} aria-label="Next slide">
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className={styles.collections}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>{content.collections.eyebrow}</span>
              <h2>{content.collections.title}</h2>
            </div>
            <Link to="/shop">Open full catalog <ArrowRight size={16} /></Link>
          </div>
          <div className={styles.collectionGrid}>
            {collectionCards.map((item, index) => (
              <Link key={item.value} to={item.href || `/collection/${item.value}`} className={styles.collectionCard}>
                <span className={styles.collectionNumber}>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featured}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>{content.featuredProducts.eyebrow}</span>
              <h2>{content.featuredProducts.title}</h2>
            </div>
            <Link to="/shop">{content.featuredProducts.linkLabel} <ArrowRight size={16} /></Link>
          </div>
          <div className={styles.productGrid}>{featured.map(product => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className={styles.foundationBand}>
        <div className="container">
          <div className={styles.foundationGrid}>
            <article><ShieldCheck size={22} /><strong>Secure checkout</strong><span>Payments and order records are verified before fulfillment.</span></article>
            <article><PackageCheck size={22} /><strong>Clear fulfillment</strong><span>Digital, MJF, composite, and stocked products stay visibly separate.</span></article>
            <article><Wrench size={22} /><strong>Repair logic</strong><span>Files, replacement parts, and compatible hardware are easier to locate.</span></article>
          </div>
        </div>
      </section>

      <section className={styles.storyStack}>
        {content.storySections.map(section => (
          <div key={section.title} className={`${styles.story} ${styles[section.align]}`}>
            <div className={styles.storyText}>
              <span className={styles.eyebrow}>{section.eyebrow}</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map(p => <p key={p}>{p}</p>)}
              <Link to={section.cta.href}>{section.cta.label} <ArrowRight size={16} /></Link>
            </div>
            <img src={section.image} alt={section.imageAlt} />
          </div>
        ))}
      </section>

      <section className={styles.faq}>
        <div className="container">
          <span className={styles.eyebrow}>{content.faq.eyebrow}</span>
          <h2>{content.faq.title}</h2>
          <p>{content.faq.description}</p>
          <div className={styles.faqGrid}>
            {content.faq.items.map((item, index) => (
              <button key={item.question} className={styles.faqItem} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span><strong>{item.question}</strong><ChevronDown size={18} /></span>
                {openFaq === index && <p>{item.answer}</p>}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
