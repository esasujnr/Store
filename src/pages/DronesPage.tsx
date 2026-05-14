import { type TouchEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'
import SEO from '@/components/SEO'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useProducts } from '@/hooks/useProducts'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { getProductBrand } from '@/lib/catalog'
import { getGalleryImages, getProductSpecs, getProductSummarySpecs, getSpecText } from '@/lib/productContent'
import { getDefaultSiteContent } from '@/lib/siteContent'
import { getFulfillmentLabel, getProductPrice } from '@/lib/utils'
import styles from './DronesPage.module.css'

type Slide = {
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: string
}

function getVideoEmbedUrl(rawUrl: string, autoplay = false) {
  const source = rawUrl.trim() || 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ'
  let embedUrl = source

  try {
    const url = new URL(source)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      embedUrl = `https://www.youtube-nocookie.com/embed/${url.pathname.replace('/', '')}`
    } else if (host.includes('youtube.com')) {
      const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop()
      if (videoId) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`
    }
  } catch {
    return source
  }

  const joiner = embedUrl.includes('?') ? '&' : '?'
  return `${embedUrl}${joiner}rel=0&modestbranding=1&playsinline=1${autoplay ? '&autoplay=1' : ''}`
}

export default function DronesPage() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: siteContent } = useSiteContent('drones_page', previewMode)
  const { data: products } = useProducts()
  const { formatFromBase } = useCurrency()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const heroRef = useRef<HTMLElement | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const autoPausedUntil = useRef(0)
  const [heroInView, setHeroInView] = useState(true)
  const content = siteContent ?? getDefaultSiteContent('drones_page')
  const maxCatalogItems = Math.max(1, Number.parseInt(content.catalog.maxItems, 10) || 3)

  const droneProducts = useMemo(
    () => (products?.length ? products : fallbackProducts)
      .filter(product => product.is_drone_product)
      .sort((a, b) => {
        const aWingxtra = getProductBrand(a).toLowerCase() === 'wingxtra' || a.name.toLowerCase().includes('wingxtra')
        const bWingxtra = getProductBrand(b).toLowerCase() === 'wingxtra' || b.name.toLowerCase().includes('wingxtra')
        return Number(bWingxtra) - Number(aWingxtra)
      }),
    [products]
  )

  const slides = useMemo<Slide[]>(
    () =>
      droneProducts.slice(0, 3).map((product, index) => ({
        eyebrow: index === 0 ? 'Featured Aircraft' : 'Collection Highlight',
        title: product.name,
        subtitle:
          getSpecText(getProductSpecs(product.specs), ['ideal_for', 'who_it_is_for'], product.description) ||
          product.description,
        ctaLabel: 'Read More',
        ctaHref: `/product/${product.slug}`,
        image:
          getGalleryImages(product.image_url, getProductSpecs(product.specs))[0] ||
          'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1600&q=80',
      })),
    [droneProducts]
  )

  const fallbackSlide: Slide = {
    eyebrow: content.hero.eyebrow,
    title: content.hero.title,
    subtitle: content.hero.description,
    ctaLabel: content.hero.featuredLinkLabel,
    ctaHref: '/shop?family=wingxtra_aircraft',
    image: content.video.posterFallback,
  }
  const heroSlides = slides.length ? slides : [fallbackSlide]
  const activeSlide = heroSlides[currentSlide % heroSlides.length] ?? fallbackSlide
  const featuredProduct = droneProducts[0]
  const comparisonProducts = droneProducts.slice(0, maxCatalogItems)

  function pauseHeroAuto(duration = 10000) {
    autoPausedUntil.current = Date.now() + duration
  }

  function goPrev() {
    pauseHeroAuto()
    setCurrentSlide(value => (value === 0 ? heroSlides.length - 1 : value - 1))
  }

  function goNext() {
    pauseHeroAuto()
    setCurrentSlide(value => (value + 1) % heroSlides.length)
  }

  useEffect(() => {
    if (heroSlides.length < 2 || !heroInView) return
    const interval = window.setInterval(() => {
      if (document.hidden || Date.now() < autoPausedUntil.current) return
      setCurrentSlide(value => (value + 1) % heroSlides.length)
    }, 7000)
    return () => window.clearInterval(interval)
  }, [heroInView, heroSlides.length])

  useEffect(() => {
    setCurrentSlide(value => (heroSlides.length ? value % heroSlides.length : 0))
  }, [heroSlides.length])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 },
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  function handleHeroTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0]
    if (!touch) return
    pauseHeroAuto(12000)
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

    pauseHeroAuto(12000)
    if (deltaX < 0) setCurrentSlide(value => (value + 1) % heroSlides.length)
    else setCurrentSlide(value => (value === 0 ? heroSlides.length - 1 : value - 1))
  }

  return (
    <>
      <SEO
        title={content.seo.title}
        description={content.seo.description}
        url="/drones"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Drones', url: '/drones' },
        ]}
      />

      <div className={styles.page}>
        {content.visibility.hero && (
        <section ref={heroRef} className={styles.hero} onTouchStart={handleHeroTouchStart} onTouchEnd={handleHeroTouchEnd}>
          {activeSlide && (
            <>
              <img src={activeSlide.image} alt={activeSlide.title} className={styles.heroImage} />
              <div className={styles.heroShade} />
              <div className={styles.heroContent}>
                <span className={styles.eyebrow}>{activeSlide.eyebrow}</span>
                <h1>{activeSlide.title}</h1>
                <p>{activeSlide.subtitle}</p>
                <Link to={activeSlide.ctaHref} className={styles.primaryCta}>
                  {activeSlide.ctaLabel}
                </Link>
              </div>
            </>
          )}

          {heroSlides.length > 1 && (
            <>
              <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={goPrev} aria-label="Previous slide">
                <ChevronLeft size={24} />
              </button>
              <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext} aria-label="Next slide">
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </section>
        )}

        {content.visibility.quickNav && (
        <section className={styles.quickNav}>
          <div className="container">
            <div className={styles.quickNavInner}>
              {content.quickNav.map(link => (
                <Link key={`${link.href}-${link.label}`} to={link.href} className={styles.quickNavItem}>{link.label}</Link>
              ))}
            </div>
          </div>
        </section>
        )}

        {content.visibility.video && (
        <section className={styles.videoSection}>
          <div className={styles.videoBand}>
            <div className={styles.videoFrame}>
              {showVideo ? (
                <iframe
                  className={styles.videoEmbed}
                  src={getVideoEmbedUrl(content.video.url, true)}
                  title={content.video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" className={styles.videoPreviewButton} onClick={() => setShowVideo(true)}>
                  <img
                    src={activeSlide?.image || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1600&q=80'}
                    alt={content.video.title}
                    className={styles.videoPreviewImage}
                  />
                  <span className={styles.videoPlayButton}>
                    <PlayCircle size={24} />
                    {content.video.playLabel}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
        )}

        {content.visibility.story && (
        <section className={styles.storySection}>
          <div className="container">
            <div className={styles.storyHeader}>
              <h2>{content.story.title}</h2>
            </div>
            <div className={styles.storyGrid}>
              {content.story.blocks.map(block => (
                <article key={block.title} className={styles.storyCard}>
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        )}

        {content.visibility.featuredProduct && featuredProduct && (
          <section className={styles.featureSection}>
            <div className="container">
              <div className={styles.featureLayout}>
                <div className={styles.featureMedia}>
                  <img
                    src={getGalleryImages(featuredProduct.image_url, getProductSpecs(featuredProduct.specs))[0]}
                    alt={featuredProduct.name}
                  />
                </div>
                <div className={styles.featureCopy}>
                  <span className={styles.eyebrow}>{content.featured.eyebrow}</span>
                  <h2>{featuredProduct.name || content.featured.titleFallback}</h2>
                  <p>{content.featured.description}</p>
                  <Link to={`/product/${featuredProduct.slug}`} className={styles.secondaryCta}>
                    {content.featured.linkLabel}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {content.visibility.catalog && (
        <section className={styles.catalogSection}>
          <div className="container">
            <div className={styles.catalogHeader}>
              <h2>{content.catalog.title}</h2>
            </div>
            <div className={styles.catalogGrid}>
              {comparisonProducts.map(product => {
                const specs = getProductSpecs(product.specs)
                const summary = getProductSummarySpecs(specs, 3)
                return (
                  <Link key={product.id} to={`/product/${product.slug}`} className={styles.catalogCard}>
                    <img
                      src={getGalleryImages(product.image_url, specs)[0]}
                      alt={product.name}
                      className={styles.catalogImage}
                    />
                    <div className={styles.catalogBody}>
                      <span className={styles.catalogMeta}>{getFulfillmentLabel(product.fulfillment_type)}</span>
                      <h3>{product.name}</h3>
                      <p>{getSpecText(specs, ['ideal_for', 'who_it_is_for'], product.description)}</p>
                      <div className={styles.specStrip}>
                        {summary.map(item => (
                          <span key={item.key} className={styles.specPill}>
                            <strong>{item.value}</strong> {item.label}
                          </span>
                        ))}
                      </div>
                      <div className={styles.catalogFooter}>
                        <span>{formatFromBase(getProductPrice(product))}</span>
                        <span>Read more</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
        )}

        {content.visibility.blueprint && (
        <section className={styles.blueprintSection}>
          <div className="container">
            <div className={styles.blueprintLayout}>
              <div className={styles.blueprintCopy}>
                <span className={styles.eyebrow}>{content.blueprint.eyebrow}</span>
                <h2>{content.blueprint.title}</h2>
                <p>{content.blueprint.description}</p>
              </div>
              <div className={styles.blueprintCard}>
                <div className={styles.blueprintIcon}><PlayCircle size={22} /></div>
                <h3>{content.blueprint.cardTitle}</h3>
                <p>{content.blueprint.cardDescription}</p>
              </div>
            </div>
          </div>
        </section>
        )}
      </div>
    </>
  )
}
