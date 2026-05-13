import { type CSSProperties, useMemo, useState } from 'react'
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

  const heroSlides = useMemo(() => {
    const legacySlide = {
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
    }

    const editableSlides = content.hero.slides
      .filter(item => item.isVisible)
      .map(item => ({
        eyebrow: item.eyebrow,
        title: item.title,
        body: item.body,
        image: item.image,
        primary: item.primaryCta,
        secondary: item.secondaryCta,
        featureTag: item.featureTag,
        featureTitle: item.featureTitle,
        featureBody: item.featureBody,
        featureHref: item.featureHref,
        featureLabel: item.featureLabel,
      }))

    return editableSlides.length ? editableSlides : [legacySlide]
  }, [content])

  const active = heroSlides[slide] || heroSlides[0]
  const collectionCards = PRODUCT_FAMILY_OPTIONS.slice(0, 6)
  const visibility = content.visibility
  const homeStyle = {
    '--home-hero-min-height': content.design.heroMinHeight,
    '--home-hero-title-scale': content.design.heroTitleScale,
    '--home-hero-panel-width': content.design.heroPanelWidth,
    '--home-hero-overlay': content.design.heroOverlay,
    '--home-section-spacing': content.design.sectionSpacing,
  } as CSSProperties
  const panelPosition = content.design.heroPanelPosition.charAt(0).toUpperCase() + content.design.heroPanelPosition.slice(1)
  const heroCanvasClass = `${styles.heroCanvas} ${styles[`panel${panelPosition}`]}`

  return (
    <>
      <SEO title={content.seo.title} description={content.seo.description} url="/" />

      <section
        className={styles.heroShell}
        style={{
          ...homeStyle,
          backgroundImage: `linear-gradient(90deg, rgba(3, 8, 4, var(--home-hero-overlay)), rgba(3, 8, 4, 0.26) 48%, rgba(3, 8, 4, 0.86)), url(${active.image})`,
        }}
      >
        <button className={`${styles.heroArrow} ${styles.heroArrowLeft}`} onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)} aria-label="Previous slide">
          <span aria-hidden="true">?</span>
        </button>

        <div className={heroCanvasClass}>
          <article className={styles.heroPanel}>
            <span className={styles.eyebrow}>{active.eyebrow}</span>
            <h1>{active.title}</h1>
            <p>{active.body}</p>
            <div className={styles.heroActions}>
              <Link to={active.primary.href}><Button size="lg">{active.primary.label}</Button></Link>
              <Link to={active.secondary.href}><Button size="lg" variant="secondary">{active.secondary.label}</Button></Link>
            </div>
            {content.design.showHeroStats && (
              <div className={styles.heroStats}>
                {content.hero.highlights.map(item => (
                  <div key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.heroDots}>
              {heroSlides.map((_, index) => (
                <button key={index} className={index === slide ? styles.dotActive : ''} onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} />
              ))}
            </div>
          </article>
        </div>

        <button className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={() => setSlide((slide + 1) % heroSlides.length)} aria-label="Next slide">
          <span aria-hidden="true">?</span>
        </button>
      </section>

      {visibility.collections && (
        <section className={styles.collections} style={homeStyle}>
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
      )}

      {visibility.featuredProducts && (
        <section className={styles.featured} style={homeStyle}>
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
      )}

      {visibility.storeFoundations && (
        <section className={styles.foundationBand}>
          <div className="container">
            <div className={styles.foundationIntro}>
              <span className={styles.eyebrow}>{content.storeFoundations.eyebrow}</span>
              <h2>{content.storeFoundations.title}</h2>
            </div>
            <div className={styles.foundationGrid}>
              {content.storeFoundations.items.map((item, index) => {
                const Icon = index % 3 === 0 ? ShieldCheck : index % 3 === 1 ? PackageCheck : Wrench
                return <article key={item.title}><Icon size={22} /><strong>{item.title}</strong><span>{item.description}</span></article>
              })}
            </div>
          </div>
        </section>
      )}

      {visibility.storySections && (
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
      )}

      {visibility.deliveryTypes && (
        <section className={styles.deliveryTypes}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.eyebrow}>{content.deliveryTypes.eyebrow}</span>
                <h2>{content.deliveryTypes.title}</h2>
                <p>{content.deliveryTypes.description}</p>
              </div>
            </div>
            <div className={styles.featureRailGrid}>
              {content.deliveryTypes.items.map(item => (
                <Link key={item.title} to={item.href} className={styles.featureRailCard}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <span>{item.linkLabel} <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {visibility.processStory && (
        <section className={styles.processStory}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.eyebrow}>{content.processStory.eyebrow}</span>
                <h2>{content.processStory.title}</h2>
                <p>{content.processStory.description}</p>
              </div>
            </div>
            <div className={styles.processGrid}>
              {content.processStory.points.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {visibility.testimonials && (
        <section className={styles.testimonials}>
          <div className="container">
            <span className={styles.eyebrow}>{content.testimonials.eyebrow}</span>
            <h2>{content.testimonials.title}</h2>
            <p>{content.testimonials.description}</p>
            <div className={styles.testimonialGrid}>
              {content.testimonials.items.map(item => (
                <article key={`${item.name}-${item.quote}`}>
                  <strong>"{item.quote}"</strong>
                  <span>{item.name}</span>
                  <small>{item.role}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {visibility.community && (
        <section className={styles.community}>
          <div className="container">
            <div className={styles.communityGrid}>
              <div>
                <span className={styles.eyebrow}>{content.community.eyebrow}</span>
                <h2>{content.community.title}</h2>
                <p>{content.community.description}</p>
                <div className={styles.heroActions}>
                  <Link to={content.community.primaryCta.href}><Button>{content.community.primaryCta.label}</Button></Link>
                  <Link to={content.community.secondaryCta.href}><Button variant="secondary">{content.community.secondaryCta.label}</Button></Link>
                </div>
                <div className={styles.communityPoints}>
                  {content.community.points.map(item => <article key={item.title}><strong>{item.title}</strong><span>{item.description}</span></article>)}
                </div>
              </div>
              <img src={content.community.image} alt={content.community.imageAlt} />
            </div>
          </div>
        </section>
      )}

      {visibility.faq && (
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
      )}

      {visibility.newsletter && (
        <section className={styles.newsletter}>
          <div className="container">
            <div className={styles.newsletterCard}>
              <span className={styles.eyebrow}>{content.newsletter.eyebrow}</span>
              <h2>{content.newsletter.title}</h2>
              <p>{content.newsletter.description}</p>
              <form onSubmit={event => event.preventDefault()} className={styles.newsletterForm}>
                <input type="email" placeholder={content.newsletter.placeholder} aria-label={content.newsletter.placeholder} />
                <Button>{content.newsletter.buttonLabel}</Button>
              </form>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
