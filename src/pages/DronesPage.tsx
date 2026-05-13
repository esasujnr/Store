import { useMemo, useState } from 'react'
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

const STORY_BLOCKS = [
  {
    title: 'Designed to be printed',
    body:
      'Every aircraft collection needs a clear build story: what the platform is for, how it is produced, and which parts are digital files, printed hardware, or shipped assemblies.',
  },
  {
    title: 'Inspired by natural efficiency',
    body:
      'The buying flow should help customers understand weight, structure, load paths, and repair logic before they choose a file pack or a physical aircraft component.',
  },
  {
    title: 'Platform-first product pages',
    body:
      'Customers should understand the aircraft first, then the files, parts, electronics, and mission systems that belong to it. That keeps the store simple without making it shallow.',
  },
]

export default function DronesPage() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: siteContent } = useSiteContent('drones_page', previewMode)
  const { data: products } = useProducts()
  const { formatFromBase } = useCurrency()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const content = siteContent ?? getDefaultSiteContent('drones_page')

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

  const activeSlide = slides[currentSlide] ?? slides[0]
  const featuredProduct = droneProducts[0]
  const comparisonProducts = droneProducts.slice(0, 3)

  function goPrev() {
    setCurrentSlide(value => (value === 0 ? slides.length - 1 : value - 1))
  }

  function goNext() {
    setCurrentSlide(value => (value + 1) % slides.length)
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
        <section className={styles.hero}>
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

          {slides.length > 1 && (
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

        <section className={styles.quickNav}>
          <div className="container">
            <div className={styles.quickNavInner}>
              <Link to="/drones" className={styles.quickNavItem}>Aircraft</Link>
              <Link to="/collection/additive_manufacturing" className={styles.quickNavItem}>Blueprint Files</Link>
              <Link to="/collection/airframes_kits" className={styles.quickNavItem}>Printed Parts</Link>
              <Link to="/collection/propulsion_systems" className={styles.quickNavItem}>Shopping List</Link>
            </div>
          </div>
        </section>

        <section className={styles.videoSection}>
          <div className={styles.videoBand}>
            <div className={styles.videoFrame}>
              {showVideo ? (
                <iframe
                  className={styles.videoEmbed}
                  src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1&playsinline=1&autoplay=1"
                  title="Wingxtra drone presentation"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" className={styles.videoPreviewButton} onClick={() => setShowVideo(true)}>
                  <img
                    src={activeSlide?.image || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1600&q=80'}
                    alt="Play Wingxtra drone presentation"
                    className={styles.videoPreviewImage}
                  />
                  <span className={styles.videoPlayButton}>
                    <PlayCircle size={24} />
                    Play video
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.storySection}>
          <div className="container">
            <div className={styles.storyHeader}>
              <h2>Designed as a real aircraft collection</h2>
            </div>
            <div className={styles.storyGrid}>
              {STORY_BLOCKS.map(block => (
                <article key={block.title} className={styles.storyCard}>
                  <h3>{block.title}</h3>
                  <p>{block.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {featuredProduct && (
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
                  <span className={styles.eyebrow}>Recommended</span>
                  <h2>{featuredProduct.name}</h2>
                  <p>
                    This aircraft gives customers a focused starting point before they compare files,
                    printed parts, propulsion, flight control, and mission accessories.
                  </p>
                  <Link to={`/product/${featuredProduct.slug}`} className={styles.secondaryCta}>
                    Open details
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={styles.catalogSection}>
          <div className="container">
            <div className={styles.catalogHeader}>
              <h2>Current aircraft lineup</h2>
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

        <section className={styles.blueprintSection}>
          <div className="container">
            <div className={styles.blueprintLayout}>
              <div className={styles.blueprintCopy}>
                <span className={styles.eyebrow}>Blueprint Files</span>
                <h2>Files, videos, and structured detail blocks belong in the same flow.</h2>
                <p>
                  Aircraft products need supporting files, build guidance, video context, and compatible
                  hardware presented in the same buying flow so customers do not get lost between pages.
                </p>
              </div>
              <div className={styles.blueprintCard}>
                <div className={styles.blueprintIcon}><PlayCircle size={22} /></div>
                <h3>Presentation-ready content blocks</h3>
                <p>Use this section later for product videos, print notes, assembly guidance, and blueprint explanations.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
