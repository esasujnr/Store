import { Fragment, type CSSProperties, type TouchEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown, PackageCheck, ShieldCheck, Wrench } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import Button from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import { useSiteContent } from '@/hooks/useSiteContent'
import { isNewArrival } from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { DEFAULT_HOME_SECTION_ORDER, getDefaultSiteContent, type HomeSectionKey } from '@/lib/siteContent'
import { isProductOnSale } from '@/lib/utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: contentData } = useSiteContent('home_page', previewMode)
  const { data: products } = useProducts()
  const content = contentData ?? getDefaultSiteContent('home_page')
  const catalog = products?.length ? products : fallbackProducts
  const [slide, setSlide] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

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

  useEffect(() => {
    if (heroSlides.length < 2) return
    const interval = window.setInterval(() => {
      setSlide(current => (current + 1) % heroSlides.length)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [heroSlides.length])

  useEffect(() => {
    setSlide(current => (heroSlides.length ? current % heroSlides.length : 0))
  }, [heroSlides.length])

  const featured = useMemo(() => {
    const maxItems = Math.max(1, Number.parseInt(content.featuredProducts.maxItems || '6', 10) || 6)
    const activeCatalog = catalog.filter(product => product.is_active !== false)

    if (content.featuredProducts.mode === 'manual' && content.featuredProducts.productSlugs.length > 0) {
      const bySlug = new Map(activeCatalog.map(product => [product.slug, product]))
      const selected = content.featuredProducts.productSlugs
        .map(slug => bySlug.get(slug))
        .filter((product): product is (typeof activeCatalog)[number] => Boolean(product))
      if (selected.length > 0) return selected.slice(0, maxItems)
    }

    const filtered =
      content.featuredProducts.mode === 'new_arrivals'
        ? activeCatalog.filter(isNewArrival)
        : content.featuredProducts.mode === 'sale'
          ? activeCatalog.filter(isProductOnSale)
          : activeCatalog

    return (filtered.length ? filtered : activeCatalog).slice(0, maxItems)
  }, [catalog, content.featuredProducts])

  const active = heroSlides[slide] || heroSlides[0]
  const collectionCards = content.collections.items.filter(item => item.title && item.href)
  const visibility = content.visibility
  const homeSectionOrder = useMemo(() => {
    const validKeys = new Set<HomeSectionKey>(DEFAULT_HOME_SECTION_ORDER)
    const ordered = content.sectionOrder.filter((key): key is HomeSectionKey => validKeys.has(key))
    const merged = [...ordered, ...DEFAULT_HOME_SECTION_ORDER.filter(key => !ordered.includes(key))]
    return merged.filter(key => visibility[key])
  }, [content.sectionOrder, visibility])
  const homeStyle = {
    '--home-hero-min-height': content.design.heroMinHeight,
    '--home-hero-title-scale': content.design.heroTitleScale,
    '--home-hero-panel-width': content.design.heroPanelWidth,
    '--home-hero-overlay': content.design.heroOverlay,
    '--home-section-spacing': content.design.sectionSpacing,
  } as CSSProperties
  const panelPosition = content.design.heroPanelPosition.charAt(0).toUpperCase() + content.design.heroPanelPosition.slice(1)
  const heroCanvasClass = `${styles.heroCanvas} ${styles[`panel${panelPosition}`]}`

  function goPrev() {
    setSlide(current => (current + heroSlides.length - 1) % heroSlides.length)
  }

  function goNext() {
    setSlide(current => (current + 1) % heroSlides.length)
  }

  function handleHeroTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0]
    if (!touch) return
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleHeroTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch || heroSlides.length < 2) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const isIntentionalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2
    if (!isIntentionalSwipe) return

    if (deltaX < 0) goNext()
    else goPrev()
  }

  const renderHomeSection = (sectionKey: HomeSectionKey) => {
    switch (sectionKey) {
      case 'collections':
        return (
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
                  <Link key={`${item.title}-${index}`} to={item.href} className={styles.collectionCard}>
                    {item.image && (
                      <span className={styles.collectionImage}>
                        <img src={item.image} alt="" loading="lazy" />
                      </span>
                    )}
                    <span className={styles.collectionNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )

      case 'featuredProducts':
        return (
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
        )

      case 'storeFoundations':
        return (
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
        )

      case 'storySections':
        return (
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
        )

      case 'deliveryTypes':
        return (
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
        )

      case 'processStory':
        return (
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
        )

      case 'testimonials':
        return (
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
        )

      case 'community':
        return (
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
        )

      case 'faq':
        return (
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
        )

      case 'newsletter':
        return (
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
        )

      default:
        return null
    }
  }

  return (
    <>
      <SEO title={content.seo.title} description={content.seo.description} url="/" />

      <section
        className={styles.heroShell}
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
        style={{
          ...homeStyle,
          backgroundImage: `linear-gradient(90deg, rgba(3, 8, 4, var(--home-hero-overlay)), rgba(3, 8, 4, 0.26) 48%, rgba(3, 8, 4, 0.86)), url(${active.image})`,
        }}
      >
        <button className={`${styles.heroArrow} ${styles.heroArrowLeft}`} onClick={goPrev} aria-label="Previous slide">
          <ArrowLeft size={30} strokeWidth={1.35} aria-hidden="true" />
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

        <button className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={goNext} aria-label="Next slide">
          <ArrowRight size={30} strokeWidth={1.35} aria-hidden="true" />
        </button>
      </section>

      {homeSectionOrder.map(sectionKey => (
        <Fragment key={sectionKey}>{renderHomeSection(sectionKey)}</Fragment>
      ))}
    </>
  )
}

