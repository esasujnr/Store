import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Download,
  Layers3,
  Minus,
  Package,
  PlayCircle,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Square,
  SquareCheck as CheckSquare,
  Star,
  Truck,
  Wrench,
} from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useBundleItems, useProduct, useProductMedia, useProductReviews } from '@/hooks/useProducts'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  getAdditiveLabel,
  getDeliveryLabel,
  getFamilyLabel,
  getOriginLabel,
  getProductAdditiveType,
  getProductBrand,
  getProductDeliveryType,
  getProductFamily,
  isNewArrival,
} from '@/lib/catalog'
import { fallbackProducts } from '@/lib/fallbackCatalog'
import { getDefaultSiteContent } from '@/lib/siteContent'
import { supabase } from '@/lib/supabase'
import { formatDate, getFulfillmentLabel, getInventoryStatus, getProductPrice, isDigital, isProductOnSale } from '@/lib/utils'
import type { Product, ProductMedia, Review } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './ProductPage.module.css'

type SpecRecord = Record<string, unknown>

type FactCard = {
  label: string
  value: string
}

type TemplateGuide = {
  eyebrow: string
  title: string
  description: string
  items: string[]
}

const RICH_SPEC_KEYS = new Set([
  'gallery',
  'included',
  'requirements',
  'ideal_for',
  'skill_level',
  'build_time',
  'license',
  'support',
  'support_policy',
  'shipping_window',
  'shipping_notes',
  'lead_time',
  'print_settings',
  'recommended_materials',
  'recommended_filament',
  'file_formats',
  'download_contents',
  'compatibility_notes',
  'who_its_for',
  'who_it_is_for',
  'who_it_is_not_for',
  'who_its_not_for',
  'notes',
  'purchase_notes',
  'care_notes',
  'finish',
  'production_method',
  'leadtime',
  'overview',
  'long_description',
  'design_summary',
  'product_story_title',
  'product_story',
  'blueprint_title',
  'video_url',
  'youtube_url',
  'video_embed_url',
  'video_title',
  'video_description',
  'manufacturing_notes',
])

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, match => match.toUpperCase())
}

function splitTextList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean)
  }

  return String(value)
    .split(/\r?\n|\||;/)
    .map(item => item.trim())
    .filter(Boolean)
}

function getSpecValue(specs: SpecRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in specs && specs[key] != null && specs[key] !== '') {
      return specs[key]
    }
  }
  return undefined
}

function getSpecText(specs: SpecRecord, keys: string[], fallback = ''): string {
  const value = getSpecValue(specs, keys)
  if (value == null || value === '') return fallback
  return String(value)
}

function getParagraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean)
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

function isDirectVideoUrl(rawUrl: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(rawUrl.trim())
}

function getMediaHref(media: ProductMedia) {
  if (media.url) return media.url
  if (media.storage_path) {
    return supabase.storage.from('product-media').getPublicUrl(media.storage_path).data.publicUrl
  }
  return '#'
}

function getSpecList(specs: SpecRecord, keys: string[]): string[] {
  return splitTextList(getSpecValue(specs, keys))
}

function getGalleryImages(product: Product, specs: SpecRecord) {
  const images = [product.image_url, ...splitTextList(specs.gallery)].filter(Boolean)
  return [...new Set(images)]
}

function getIncludedItems(product: Product, specs: SpecRecord) {
  const included = getSpecList(specs, ['included', 'download_contents'])
  if (included.length) return included

  if (product.fulfillment_type === 'fdm') {
    return ['Primary STL files', 'Print-ready variants for supported parts', 'Quick-start build notes for local printing']
  }

  if (product.fulfillment_type === 'mjf') {
    return ['Finished production parts', 'Post-processed MJF nylon output', 'Packed physical shipment ready for integration']
  }

  return ['Composite structural part', 'Finished hardware component', 'Packed physical shipment for workshop assembly']
}

function getRequirements(product: Product, specs: SpecRecord) {
  const requirements = getSpecList(specs, ['requirements', 'required_parts', 'electronics_required'])
  if (requirements.length) return requirements

  if (product.fulfillment_type === 'fdm') {
    return ['Access to an FDM printer', 'Basic assembly hardware and adhesives where applicable', 'Matching electronics if this file pack is part of a complete airframe build']
  }

  return ['Compatible airframe or mounting point', 'Standard workshop tools for assembly', 'Referenced electronics and hardware for the final build']
}

function getPurchaseNotes(product: Product, specs: SpecRecord) {
  const notes = getSpecList(specs, ['purchase_notes', 'notes'])
  if (notes.length) return notes

  if (product.fulfillment_type === 'fdm') {
    return ['Files are delivered digitally after confirmed payment.', 'No shipping is required for digital products.', 'Best suited to buyers who want to print, test, and iterate locally.']
  }

  return ['Physical products ship after order confirmation.', 'Stock and production readiness are shown on this page.', 'Best suited to buyers who want build-ready hardware instead of self-printing.']
}

function getSupportItems(product: Product, specs: SpecRecord) {
  const supportPolicy = getSpecText(specs, ['support_policy', 'support'])
  const license = getSpecText(specs, ['license'])
  const shippingWindow = getSpecText(specs, ['shipping_window', 'lead_time', 'leadtime'])

  const items: string[] = []

  if (product.fulfillment_type === 'fdm') {
    items.push(license || 'Personal-use digital purchase for local printing and assembly.')
    items.push(supportPolicy || 'Includes download access and product-page guidance for supported builds.')
  } else {
    items.push(shippingWindow || 'Physical orders are packed and dispatched according to current stock and production readiness.')
    items.push(supportPolicy || 'Includes product-page guidance and order support for the supplied hardware.')
  }

  return items
}

function getManufacturingNotes(product: Product, specs: SpecRecord) {
  const manufacturingNotes = getSpecList(specs, ['manufacturing_notes'])
  const printSettings = getSpecList(specs, ['print_settings'])
  const recommendedMaterials = getSpecList(specs, ['recommended_materials', 'recommended_filament'])
  const shippingNotes = getSpecList(specs, ['shipping_notes'])

  if (manufacturingNotes.length) return manufacturingNotes

  if (product.fulfillment_type === 'fdm') {
    return [
      ...printSettings,
      ...(recommendedMaterials.length ? [`Recommended materials: ${recommendedMaterials.join(', ')}`] : []),
    ]
  }

  return [
    getSpecText(specs, ['production_method'], product.fulfillment_type === 'mjf' ? 'Produced using MJF nylon for repeatable strength and dimensional consistency.' : 'Composite layup selected for lightweight structure and workshop-ready integration.'),
    getSpecText(specs, ['finish'], product.fulfillment_type === 'mjf' ? 'Production finish tuned for durable prototype and flight-ready applications.' : 'Structural finish selected for lightweight, rigid builds.'),
    ...shippingNotes,
  ].filter(Boolean)
}

function getFactCards(product: Product, specs: SpecRecord): FactCard[] {
  const fulfillment = getFulfillmentLabel(product.fulfillment_type)
  const skillLevel = getSpecText(specs, ['skill_level'], product.fulfillment_type === 'fdm' ? 'Intermediate' : 'Workshop-ready')
  const buildTime = getSpecText(specs, ['build_time'], product.fulfillment_type === 'fdm' ? 'Print and assemble' : 'Integrate and ship')
  const deliveryWindow = getSpecText(specs, ['shipping_window', 'lead_time', 'leadtime'], 'Dispatch based on stock and production readiness')
  const idealFor = getSpecText(specs, ['ideal_for', 'who_it_is_for'], product.is_drone_product ? 'Airframe builds' : 'Builder upgrades')

  const cards: FactCard[] = [
    { label: 'Fulfillment', value: fulfillment },
    { label: 'Skill level', value: skillLevel },
    { label: 'Best for', value: idealFor },
  ]

  if (product.fulfillment_type === 'fdm') {
    cards.splice(2, 0, { label: 'Build time', value: buildTime })
  } else {
    cards.splice(2, 0, { label: 'Delivery window', value: deliveryWindow })
  }

  return cards
}

function getAudienceNotes(product: Product, specs: SpecRecord) {
  const forBuilders = getSpecText(specs, ['who_it_is_for', 'who_its_for', 'ideal_for'], product.is_drone_product ? 'Builders who want a clearer path from airframe selection to a complete drone system.' : 'Builders expanding an existing airframe or component stack.')
  const notFor = getSpecText(specs, ['who_it_is_not_for', 'who_its_not_for'], product.fulfillment_type === 'fdm' ? 'Not ideal if you want a ready-made shipped product without local printing.' : 'Not ideal if you want digital files only or a zero-assembly workflow.')
  return { forBuilders, notFor }
}

function getTechnicalSpecs(specs: SpecRecord) {
  return Object.entries(specs)
    .filter(([, value]) => value != null && value !== '')
    .filter(([key, value]) => !RICH_SPEC_KEYS.has(key) && !Array.isArray(value) && typeof value !== 'object')
    .map(([key, value]) => ({ label: toTitleCase(key), value: String(value) }))
}

function getTemplateGuide(product: Product, specs: SpecRecord): TemplateGuide {
  const family = getProductFamily(product)
  const deliveryLabel = getDeliveryLabel(getProductDeliveryType(product), product.fulfillment_type)
  const compatibility = product.compatibility_notes || getSpecText(specs, ['compatibility_notes'])
  const shippingWindow = getSpecText(specs, ['shipping_window', 'lead_time', 'leadtime'])
  const fileFormats = getSpecText(specs, ['file_formats', 'format'])

  if (family === 'additive_manufacturing') {
    return {
      eyebrow: 'Additive manufacturing path',
      title: 'Confirm whether you are buying files, FDM-ready designs, or finished MJF parts.',
      description: 'Additive products need clear delivery expectations because some are instant digital downloads while MJF parts are physical manufactured items.',
      items: [
        `Delivery: ${deliveryLabel}.`,
        product.fulfillment_type === 'fdm' ? `Digital package: ${fileFormats || 'STL files and print guidance'}.` : 'Physical printed parts are produced or checked before dispatch.',
        compatibility || 'Check printer size, material, mounting points, and revision notes before purchase.',
      ],
    }
  }

  if (family === 'avionics_flight_control') {
    return {
      eyebrow: 'Electronics fitment check',
      title: 'Match flight control hardware to firmware, aircraft type, and power architecture.',
      description: 'Avionics purchases should make the buyer confident about control signals, telemetry, GPS, sensors, and the surrounding wiring plan.',
      items: [
        'Confirm supported firmware and airframe type before checkout.',
        compatibility || 'Check GPS, telemetry, CAN/UART, PWM, and power module compatibility.',
        shippingWindow ? `Dispatch: ${shippingWindow}.` : 'Review what is included in the box and what needs to be purchased separately.',
      ],
    }
  }

  if (family === 'propulsion_systems') {
    return {
      eyebrow: 'Powertrain match',
      title: 'Treat motor, ESC, propeller, servo, and battery choices as one system.',
      description: 'Propulsion products need a clean compatibility path so customers avoid mismatched current, voltage, shaft, and propeller combinations.',
      items: [
        compatibility || 'Confirm KV, voltage, current draw, propeller size, and mounting pattern.',
        'Check whether the product is best for fixed-wing cruise, VTOL lift, or multirotor payload work.',
        shippingWindow ? `Dispatch: ${shippingWindow}.` : 'Use recommended bundles when the aircraft page provides them.',
      ],
    }
  }

  if (family === 'recovery_safety') {
    return {
      eyebrow: 'Safety sizing',
      title: 'Size recovery products by all-up weight, trigger method, and mounting location.',
      description: 'Safety products are not cosmetic accessories; they need to be chosen around the complete aircraft, operating envelope, and test plan.',
      items: [
        compatibility || 'Confirm maximum aircraft weight, trigger input, and mounting clearance.',
        'Inspect and test recovery hardware before flight demos or customer handover.',
        shippingWindow ? `Dispatch: ${shippingWindow}.` : 'Pair safety hardware with careful setup documentation.',
      ],
    }
  }

  if (family === 'winches_mission_systems' || family === 'payload_imaging_telemetry') {
    return {
      eyebrow: 'Mission payload path',
      title: 'Check payload mass, power, control, and mounting before adding mission equipment.',
      description: 'Mission hardware should be selected around what the aircraft is meant to do, not just whether the product fits in the cart.',
      items: [
        compatibility || 'Confirm payload bay clearance, power draw, signal control, and ground-station requirements.',
        'Review lead time and whether the product is stocked, sourced, or made to order.',
        shippingWindow ? `Dispatch: ${shippingWindow}.` : 'Use the aircraft page to confirm the wider system fit.',
      ],
    }
  }

  if (product.is_drone_product || ['wingxtra_aircraft', 'fixed_wing_uav', 'vtol_uav', 'multirotor_uav', 'airframes_kits'].includes(family)) {
    return {
      eyebrow: 'Aircraft buying path',
      title: 'Start with mission, airframe type, material, and the electronics path.',
      description: 'Aircraft and airframe products need a simple route from platform selection to the recommended components that complete the build.',
      items: [
        compatibility || 'Confirm payload, material, wingspan or frame class, and expected skill level.',
        `Fulfillment: ${deliveryLabel}.`,
        shippingWindow ? `Dispatch: ${shippingWindow}.` : 'Use recommended parts and requirements before checkout.',
      ],
    }
  }

  return {
    eyebrow: 'Buyer confidence',
    title: 'Check brand, delivery type, compatibility, and support before checkout.',
    description: 'Every curated product should make clear why it belongs in the Wingxtra marketplace and how it fits into a real UAV build.',
    items: [
      `Brand: ${getProductBrand(product)}.`,
      `Delivery: ${deliveryLabel}.`,
      compatibility || 'Review compatibility notes, warranty notes, and product specs before ordering.',
    ],
  }
}

function renderStars(rating: number, className?: string) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={`${className || 'star'}-${index}`} size={16} className={`${styles.star} ${index < rating ? styles.starActive : ''} ${className || ''}`} />
  ))
}

export default function ProductPage() {
  const location = useLocation()
  const { slug } = useParams<{ slug: string }>()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: templateContent } = useSiteContent('product_page_template', previewMode)
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: product, isLoading } = useProduct(slug!)
  const fallbackProduct = fallbackProducts.find(item => item.slug === slug)
  const displayProduct = product ?? fallbackProduct
  const showLoading = isLoading && !displayProduct
  const { data: bundleItems } = useBundleItems(displayProduct?.id ?? '')
  const { data: reviews = [] } = useProductReviews(displayProduct?.id ?? '')
  const { data: productMedia = [] } = useProductMedia(product?.id, false)
  const { addItem, isInCart } = useCart()
  const { formatFromBase, convertFromBase, currency } = useCurrency()
  const template = templateContent ?? getDefaultSiteContent('product_page_template')
  const templateVisibility = template.visibility
  const templateLabels = template.labels
  const [qty, setQty] = useState(1)
  const [selectedElectronics, setSelectedElectronics] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState('')
  const [showVideo, setShowVideo] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })

  const { data: ownReview } = useQuery({
    queryKey: ['own-review', displayProduct?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', displayProduct!.id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) throw error
      return data as Review | null
    },
    enabled: !!displayProduct?.id && !!user?.id,
  })

  useEffect(() => {
    if (ownReview) {
      setReviewForm({
        rating: ownReview.rating,
        title: ownReview.title || '',
        body: ownReview.body || '',
      })
    }
  }, [ownReview])

  useEffect(() => {
    if (displayProduct?.image_url) {
      setSelectedImage(displayProduct.image_url)
    }
  }, [displayProduct?.id, displayProduct?.image_url])

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !displayProduct) return

      const payload = {
        product_id: displayProduct.id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        body: reviewForm.body.trim(),
        is_approved: true,
      }

      if (ownReview) {
        const { error } = await supabase.from('reviews').update(payload).eq('id', ownReview.id)
        if (error) throw error
        return
      }

      const { error } = await supabase.from('reviews').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', displayProduct?.id] })
      qc.invalidateQueries({ queryKey: ['own-review', displayProduct?.id, user?.id] })
      toast.success(ownReview ? 'Review updated' : 'Review added')
    },
    onError: err => {
      console.error(err)
      toast.error('Could not save your review')
    },
  })

  const specs = useMemo<SpecRecord>(() => (displayProduct?.specs || {}) as SpecRecord, [displayProduct])
  const mediaImages = useMemo(
    () => productMedia.filter(media => media.media_type === 'image' && media.url).map(media => media.url as string),
    [productMedia]
  )
  const mediaVideo = useMemo(
    () => productMedia.find(media => media.media_type === 'video' && media.url),
    [productMedia]
  )
  const mediaFiles = useMemo(
    () => productMedia.filter(media => ['manual', 'blueprint', 'file', 'stl', 'mjf_file'].includes(media.media_type) && (media.url || media.storage_path)),
    [productMedia]
  )
  const galleryImages = useMemo(() => {
    if (!displayProduct) return []
    return [...new Set([...getGalleryImages(displayProduct as Product, specs), ...mediaImages])]
  }, [displayProduct, mediaImages, specs])
  const includedItems = useMemo(() => (displayProduct ? getIncludedItems(displayProduct as Product, specs) : []), [displayProduct, specs])
  const requirements = useMemo(() => (displayProduct ? getRequirements(displayProduct as Product, specs) : []), [displayProduct, specs])
  const purchaseNotes = useMemo(() => (displayProduct ? getPurchaseNotes(displayProduct as Product, specs) : []), [displayProduct, specs])
  const supportItems = useMemo(() => (displayProduct ? getSupportItems(displayProduct as Product, specs) : []), [displayProduct, specs])
  const manufacturingNotes = useMemo(() => (displayProduct ? getManufacturingNotes(displayProduct as Product, specs) : []), [displayProduct, specs])
  const factCards = useMemo(() => (displayProduct ? getFactCards(displayProduct as Product, specs) : []), [displayProduct, specs])
  const audienceNotes = useMemo(() => (displayProduct ? getAudienceNotes(displayProduct as Product, specs) : { forBuilders: '', notFor: '' }), [displayProduct, specs])
  const technicalSpecs = useMemo(() => getTechnicalSpecs(specs), [specs])
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  if (showLoading) return <LoadingSpinner fullPage />
  if (!displayProduct) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <Link to="/shop">Back to Shop</Link>
      </div>
    )
  }

  const digital = isDigital(displayProduct.fulfillment_type)
  const inCart = isInCart(displayProduct.id)
  const inventoryStatus = getInventoryStatus(displayProduct as Product, qty)
  const outOfStock = !inventoryStatus.canPurchase
  const stockBoundQuantity = inventoryStatus.tracked && inventoryStatus.policy === 'deny'
  const effectivePrice = getProductPrice(displayProduct)
  const onSale = isProductOnSale(displayProduct)
  const heroImage =
    selectedImage ||
    galleryImages[0] ||
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1400&q=80'
  const fileFormats = getSpecText(specs, ['file_formats', 'format'])
  const shippingWindow = getSpecText(specs, ['shipping_window', 'lead_time', 'leadtime'])
  const showTechnicalSpecs = technicalSpecs.length > 0
  const productBrand = getProductBrand(displayProduct)
  const productFamily = getProductFamily(displayProduct)
  const productDelivery = getProductDeliveryType(displayProduct)
  const productAdditiveType = getProductAdditiveType(displayProduct)
  const productAdditiveLabel = getAdditiveLabel(productAdditiveType)
  const productOriginLabel = getOriginLabel(displayProduct.product_origin)
  const trustSuffix = templateLabels.trustSuffix.trim()
  const trustConnector = templateLabels.trustConnector.trim() || '|'
  const productTrustLine = [productOriginLabel, trustSuffix, displayProduct.warranty_notes]
    .filter(Boolean)
    .join(` ${trustConnector} `)
  const blueprintFacts = [
    digital ? `File formats: ${fileFormats || 'STL and build notes'}` : `Fulfillment: ${getFulfillmentLabel(displayProduct.fulfillment_type)}`,
    digital ? 'Blueprint-style file packs are delivered after confirmed payment.' : `Shipping window: ${shippingWindow || 'Based on stock and production readiness'}.`,
    displayProduct.is_drone_product ? 'Compatible electronics can be added from this page.' : 'Component details stay tied to the wider Wingxtra platform.',
  ]
  const productTemplateGuide = getTemplateGuide(displayProduct as Product, specs)
  const productOverviewText = getSpecText(
    specs,
    ['overview', 'long_description', 'design_summary'],
    displayProduct.description ||
      'A Wingxtra marketplace product prepared for builders who want a clearer path from product choice to a complete UAV build.',
  )
  const productStoryTitle = getSpecText(
    specs,
    ['product_story_title'],
    'Designed like a real aircraft component, sold like a real product.',
  )
  const productStoryText = getSpecText(
    specs,
    ['product_story'],
    'This page is structured to answer the questions serious builders ask before checkout: what arrives, how it fits into the platform, and what path makes the most sense for printing, assembly, or shipped hardware.\n\nWingxtra products should feel closer to an aerospace catalog than a generic store. That means clearer build intent, cleaner compatibility cues, and a stronger visual bridge between blueprint logic and finished hardware.',
  )
  const blueprintTitle = getSpecText(specs, ['blueprint_title'], 'Build context before checkout')
  const productVideoTitle = mediaVideo?.title || getSpecText(specs, ['video_title'], `${displayProduct.name} build video`)
  const productVideoDescription = getSpecText(
    specs,
    ['video_description'],
    'Video belongs inside the product story, not somewhere off-site. This section shows how printable parts, drone structures, and workshop-ready components can be explained visually without breaking the buying flow.',
  )
  const productVideoUrl = mediaVideo?.url || getSpecText(specs, ['video_url', 'youtube_url', 'video_embed_url'])
  const productVideoIsDirect = isDirectVideoUrl(productVideoUrl)
  const productVideoEmbedUrl = getVideoEmbedUrl(productVideoUrl, showVideo)

  function handleAddToCart() {
    addItem(displayProduct as Product, qty)
    if (bundleItems) {
      bundleItems
        .filter(item => selectedElectronics.has(item.electronic_product_id))
        .forEach(item => {
          if (item.electronic_product) addItem(item.electronic_product as Product, 1)
        })
    }
    const extras = selectedElectronics.size
    toast.success(`Added to cart${extras > 0 ? ` (+${extras} electronics)` : ''}`)
  }

  function toggleElectronic(id: string) {
    setSelectedElectronics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (displayProduct.is_drone_product) {
    const droneGallery = galleryImages.length
      ? galleryImages
      : [
          displayProduct.image_url,
          'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1400&q=80',
        ]
    const recommendedParts = (bundleItems ?? []).slice(0, 4)
    const overviewText = productOverviewText
    const specRows = showTechnicalSpecs
      ? technicalSpecs
      : factCards.map(item => ({ label: item.label, value: item.value }))
    const deliveryLabel = getDeliveryLabel(productDelivery, displayProduct.fulfillment_type)
    const fileSummary = digital
      ? fileFormats || 'STL files, build notes, and supporting print information'
      : 'Build-ready hardware supplied as a physical product'

    return (
      <>
        <SEO
          title={template.seo.titleTemplate.replace('{product}', displayProduct.name)}
          description={template.seo.descriptionTemplate
            .replace('{product}', displayProduct.name)
            .replace('{summary}', displayProduct.description || getFulfillmentLabel(displayProduct.fulfillment_type))}
          image={displayProduct.image_url}
          url={`/product/${displayProduct.slug}`}
          type="product"
        />

        <div className={styles.aircraftPage}>
          <section className={styles.aircraftHero}>
            <div className={styles.aircraftHeroMedia}>
              <img src={heroImage} alt={displayProduct.name} className={styles.aircraftHeroImage} />
            </div>

            <div className={styles.aircraftHeroPanel}>
              <nav className={styles.aircraftBreadcrumb}>
                <Link to="/">Home</Link>
                <ChevronRight size={14} />
                <Link to="/drones">Drones</Link>
                <ChevronRight size={14} />
                <span>{displayProduct.name}</span>
              </nav>

              <span className={styles.aircraftEyebrow}>{deliveryLabel}</span>
              <h1>{displayProduct.name}</h1>
              <p className={styles.aircraftSubtitle}>{overviewText}</p>
              <div className={styles.marketplaceMeta}>
                <span>{productBrand}</span>
                <span>{getFamilyLabel(productFamily)}</span>
                {productAdditiveLabel && <span>{productAdditiveLabel}</span>}
                {isNewArrival(displayProduct) && <span>New arrival</span>}
              </div>
              {templateVisibility.trustLine && <p className={styles.trustLine}>{productTrustLine}</p>}

              <div className={styles.aircraftHeroFacts}>
                {factCards.slice(0, 4).map(item => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.aircraftBuyBar}>
                <div>
                  <span>{onSale ? 'Launch price' : 'Price'}</span>
                  <strong>{formatFromBase(effectivePrice)}</strong>
                </div>
                <Button size="lg" onClick={handleAddToCart} disabled={outOfStock}>
                  <ShoppingCart size={18} />
                  {outOfStock ? templateLabels.outOfStockLabel : inCart ? templateLabels.addAgainLabel : templateLabels.addToCartLabel}
                </Button>
              </div>

              <div className={styles.aircraftThumbRow}>
                {droneGallery.slice(0, 4).map(image => (
                  <button
                    key={image}
                    type="button"
                    className={`${styles.aircraftThumbButton} ${heroImage === image ? styles.aircraftThumbButtonActive : ''}`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Show ${displayProduct.name} image`}
                  >
                    <img src={image} alt={`${displayProduct.name} preview`} className={styles.aircraftThumbImage} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <nav className={styles.aircraftSubnav} aria-label="Product sections">
            <a href="#overview">Overview</a>
            <a href="#video">Video</a>
            <a href="#files">Files</a>
            <a href="#specs">Specs</a>
            <a href="#shopping-list">Parts</a>
          </nav>

          {templateVisibility.templateGuide && (
          <section className={styles.templateGuideSection}>
            <div className="container">
              <div className={styles.templateGuideLayout}>
                <div className={styles.templateGuideCopy}>
                  <span className={styles.aircraftEyebrow}>{productTemplateGuide.eyebrow}</span>
                  <h2>{productTemplateGuide.title}</h2>
                  <p>{productTemplateGuide.description}</p>
                </div>
                <div className={styles.templateGuideCards}>
                  {productTemplateGuide.items.map((item, index) => (
                    <article key={item} className={styles.templateGuideCard}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          {templateVisibility.detailCards && (
          <section id="overview" className={styles.aircraftBand}>
            <div className="container">
              <div className={styles.aircraftSectionHeader}>
                <span className={styles.aircraftEyebrow}>{templateLabels.overviewEyebrow}</span>
                <h2>Built to understand before you buy.</h2>
                <p>{audienceNotes.forBuilders}</p>
              </div>

              <div className={styles.aircraftOverviewGrid}>
                <article>
                  <h3>What this product is</h3>
                  <p>{overviewText}</p>
                </article>
                <article>
                  <h3>What you get</h3>
                  <ul>
                    {includedItems.slice(0, 5).map(item => (
                      <li key={item}>
                        <BadgeCheck size={18} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>
          )}

          {templateVisibility.video && (
          <section id="video" className={styles.aircraftVideoSection}>
            <div className="container">
              <div className={styles.aircraftSectionHeader}>
                <span className={styles.aircraftEyebrow}>{templateLabels.videoEyebrow}</span>
                <h2>{productVideoTitle}</h2>
                <p>{productVideoDescription}</p>
              </div>
              <div className={styles.aircraftVideoFrame}>
                {showVideo && productVideoIsDirect ? (
                  <video
                    className={styles.aircraftVideoEmbed}
                    src={productVideoUrl}
                    controls
                    playsInline
                    poster={heroImage}
                  />
                ) : showVideo ? (
                  <iframe
                    className={styles.aircraftVideoEmbed}
                    src={productVideoEmbedUrl}
                    title={productVideoTitle}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <button type="button" className={styles.productVideoPreviewButton} onClick={() => setShowVideo(true)}>
                    <img src={heroImage} alt={`Play ${displayProduct.name} build video`} className={styles.productVideoPreviewImage} />
                    <span className={styles.productVideoPlayButton}>
                      <PlayCircle size={24} />
                      Play video
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>
          )}

          {templateVisibility.dossier && (
          <section id="files" className={styles.aircraftBand}>
            <div className="container">
              <div className={styles.aircraftFileGrid}>
                <article>
                  <Download size={28} />
                  <h2>{templateLabels.filesEyebrow}</h2>
                  <p>{fileSummary}</p>
                </article>
                <div>
                  {requirements.slice(0, 5).map(item => (
                    <p key={item}>{item}</p>
                  ))}
                  {purchaseNotes.slice(0, 3).map(item => (
                    <p key={item}>{item}</p>
                  ))}
                  {mediaFiles.length > 0 && (
                    <div className={styles.managedFileList}>
                      {mediaFiles.map(media => (
                        <a
                          key={media.id}
                          href={getMediaHref(media)}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.managedFileLink}
                        >
                          <Download size={15} />
                          <span>{media.title || media.media_type}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}

          {templateVisibility.technicalSpecs && (
          <section id="specs" className={styles.aircraftSpecSection}>
            <div className="container">
              <div className={styles.aircraftSectionHeader}>
                <span className={styles.aircraftEyebrow}>{templateLabels.technicalDataEyebrow}</span>
                <h2>Specifications</h2>
              </div>
              <div className={styles.aircraftSpecTable}>
                {specRows.map(item => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {templateVisibility.bundles && (
          <section id="shopping-list" className={styles.aircraftRecommendedSection}>
            <div className="container">
              <div className={styles.aircraftSectionHeader}>
                <span className={styles.aircraftEyebrow}>{templateLabels.shoppingListEyebrow}</span>
                <h2>Recommended parts</h2>
                <p>Keep the buyer moving from aircraft choice to the parts needed for a complete build.</p>
              </div>
              {recommendedParts.length ? (
                <div className={styles.aircraftRecommendedGrid}>
                  {recommendedParts.map(item => {
                    const recommended = item.electronic_product as Product | null
                    if (!recommended) return null
                    return (
                      <Link key={item.id} to={`/product/${recommended.slug}`} className={styles.aircraftRecommendedCard}>
                        <img src={recommended.image_url} alt={recommended.name} />
                        <div>
                          <span>{recommended.category?.name || 'Component'}</span>
                          <h3>{recommended.name}</h3>
                          <p>{formatFromBase(getProductPrice(recommended))}</p>
                        </div>
                        <ArrowRight size={18} />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.aircraftEmptyParts}>
                  {purchaseNotes.map(item => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title={template.seo.titleTemplate.replace('{product}', displayProduct.name)}
        description={template.seo.descriptionTemplate
          .replace('{product}', displayProduct.name)
          .replace('{summary}', displayProduct.description || getFulfillmentLabel(displayProduct.fulfillment_type))}
        image={displayProduct.image_url}
        url={`/product/${displayProduct.slug}`}
        type="product"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          ...(displayProduct.is_drone_product ? [{ name: 'Drones', url: '/drones' }] : [{ name: 'Shop', url: '/shop' }]),
          ...(displayProduct.category ? [{ name: displayProduct.category.name, url: `/shop/${displayProduct.category.slug}` }] : []),
          { name: displayProduct.name, url: `/product/${displayProduct.slug}` },
        ]}
        product={{
          name: displayProduct.name,
          description: displayProduct.description,
          price: convertFromBase(effectivePrice),
          currency,
          image: displayProduct.image_url,
          sku: displayProduct.id,
          availability: outOfStock ? 'OutOfStock' : 'InStock',
        }}
      />

      <div className={styles.page}>
        <div className="container">
          <nav className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to={displayProduct.is_drone_product ? '/drones' : '/shop'}>
              {displayProduct.is_drone_product ? 'Drones' : 'Shop'}
            </Link>
            {displayProduct.category && (
              <>
                <ChevronRight size={14} />
                <Link to={`/shop/${displayProduct.category.slug}`}>{displayProduct.category.name}</Link>
              </>
            )}
            <ChevronRight size={14} />
            <span>{displayProduct.name}</span>
          </nav>

          <div className={styles.heroGrid}>
            <section className={styles.galleryPanel}>
              <div className={styles.heroImageWrap}>
                <img
                  src={heroImage}
                  alt={displayProduct.name}
                  className={styles.heroImage}
                  onError={event => {
                    event.currentTarget.src =
                      'https://images.pexels.com/photos/442587/pexels-photo-442587.jpeg?auto=compress&cs=tinysrgb&w=1200'
                  }}
                />
              </div>
              {galleryImages.length > 1 && (
                <div className={styles.thumbRow}>
                  {galleryImages.map(image => (
                    <button
                      key={image}
                      type="button"
                      className={`${styles.thumbButton} ${heroImage === image ? styles.thumbButtonActive : ''}`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`${displayProduct.name} preview`}
                        className={styles.thumbImage}
                        onError={event => {
                          event.currentTarget.src =
                            'https://images.pexels.com/photos/442587/pexels-photo-442587.jpeg?auto=compress&cs=tinysrgb&w=400'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
              {templateVisibility.assuranceBar && (
                <div className={styles.assuranceBar}>
                  <div><ShieldCheck size={16} /> {templateLabels.assuranceOne}</div>
                  <div><BadgeCheck size={16} /> {templateLabels.assuranceTwo}</div>
                  <div><Layers3 size={16} /> {templateLabels.assuranceThree}</div>
                </div>
              )}
            </section>

            <section className={styles.summaryPanel}>
              <div className={styles.summaryTop}>
                {displayProduct.category && (
                  <Link to={`/shop/${displayProduct.category.slug}`} className={styles.categoryTag}>
                    {displayProduct.category.name}
                  </Link>
                )}
                <span className={styles.typeBadge}>{productBrand}</span>
                <span className={styles.typeBadge}>{getFamilyLabel(productFamily)}</span>
                <span className={styles.typeBadge}>{getDeliveryLabel(productDelivery, displayProduct.fulfillment_type)}</span>
                {productAdditiveLabel && <span className={styles.typeBadge}>{productAdditiveLabel}</span>}
                {onSale && <span className={styles.saleBadge}>{displayProduct.sale_label || 'On Sale'}</span>}
                {isNewArrival(displayProduct) && <span className={styles.saleBadge}>New Arrival</span>}
              </div>

              <h1 className={styles.title}>{displayProduct.name}</h1>
              <p className={styles.description}>{displayProduct.description}</p>
              {templateVisibility.trustLine && <p className={styles.trustLine}>{productTrustLine}</p>}

              <div className={styles.priceStack}>
                <p className={styles.price}>{formatFromBase(effectivePrice)}</p>
                {onSale && <p className={styles.priceOriginal}>{formatFromBase(displayProduct.price)}</p>}
              </div>

              <div className={styles.reviewSummary}>
                <div className={styles.starsRow}>{renderStars(Math.round(averageRating))}</div>
                <span>{reviews.length ? `${averageRating.toFixed(1)} from ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}</span>
              </div>

              <div className={styles.factGrid}>
                {factCards.map(item => (
                  <div key={item.label} className={styles.factCard}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              {templateVisibility.beforeYouBuy && (
              <div className={styles.beforeYouBuy}>
                <div className={styles.beforeYouBuyHeader}>
                  <CircleHelp size={16} />
                  <span>{template.headings.beforeYouBuyTitle}</span>
                </div>
                <ul>
                  <li>{audienceNotes.forBuilders}</li>
                  <li>{audienceNotes.notFor}</li>
                  {displayProduct.compatibility_notes && <li>{displayProduct.compatibility_notes}</li>}
                  <li>{digital ? `Files included: ${fileFormats || 'STL and support documents'}.` : `Shipping window: ${shippingWindow || 'Based on stock and production readiness'}.`}</li>
                </ul>
              </div>
              )}

              {!digital && (
                <div className={styles.stockRow}>
                  <span className={`${styles.stockDot} ${outOfStock ? styles.stockDotOut : styles.stockDotIn}`} />
                  <span>{inventoryStatus.label}</span>
                </div>
              )}

              {!digital && !outOfStock && (
                <div className={styles.qtyRow}>
                  <span>Quantity</span>
                  <div className={styles.qtyControl}>
                    <button className={styles.qtyBtn} onClick={() => setQty(value => Math.max(1, value - 1))} disabled={qty <= 1}>
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyVal}>{qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQty(value => stockBoundQuantity ? Math.min(displayProduct.stock_count, value + 1) : value + 1)}
                      disabled={stockBoundQuantity && qty >= displayProduct.stock_count}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              <Button size="lg" fullWidth onClick={handleAddToCart} disabled={outOfStock || (inCart && !selectedElectronics.size)}>
                <ShoppingCart size={18} />
                {outOfStock ? templateLabels.outOfStockLabel : inCart ? templateLabels.addAgainLabel : templateLabels.addToCartLabel}
              </Button>

              <div className={styles.deliveryPanel}>
                {digital ? (
                  <p className={styles.deliveryNote}>
                    <Download size={14} /> Digital files are released after confirmed payment using a secure time-limited download link.
                  </p>
                ) : (
                  <p className={styles.deliveryNote}>
                    <Truck size={14} /> Physical products are packed and shipped separately from digital file orders.
                  </p>
                )}
                <p className={styles.deliveryMicrocopy}>{digital ? 'Ideal for builders who want local printing freedom and fast iteration.' : 'Built for buyers who want workshop-ready hardware without self-printing.'}</p>
              </div>
            </section>
          </div>

          {templateVisibility.templateGuide && (
          <section className={styles.templateGuideSection}>
            <div className={styles.templateGuideLayout}>
              <div className={styles.templateGuideCopy}>
                <span className={styles.dossierEyebrow}>{productTemplateGuide.eyebrow}</span>
                <h2>{productTemplateGuide.title}</h2>
                <p>{productTemplateGuide.description}</p>
              </div>
              <div className={styles.templateGuideCards}>
                {productTemplateGuide.items.map((item, index) => (
                  <article key={item} className={styles.templateGuideCard}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
          )}

          {templateVisibility.dossier && (
          <section className={styles.dossierSection}>
            <article className={styles.dossierStory}>
              <span className={styles.dossierEyebrow}>{templateLabels.productStoryEyebrow}</span>
              <h2>{productStoryTitle}</h2>
              {getParagraphs(productStoryText).map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>

            <article className={styles.dossierBlueprint}>
              <span className={styles.dossierEyebrow}>{templateLabels.blueprintEyebrow}</span>
              <h2>{blueprintTitle}</h2>
              <ul className={styles.dossierList}>
                {blueprintFacts.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {mediaFiles.length > 0 && (
                <div className={styles.managedFileList}>
                  {mediaFiles.map(media => (
                    <a
                      key={media.id}
                      href={getMediaHref(media)}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.managedFileLink}
                    >
                      <Download size={15} />
                      <span>{media.title || media.media_type}</span>
                    </a>
                  ))}
                </div>
              )}
            </article>
          </section>
          )}

          {templateVisibility.video && (
          <section className={styles.productVideoSection}>
            <div className={styles.productVideoIntro}>
              <span className={styles.dossierEyebrow}>{templateLabels.videoEyebrow}</span>
              <h2>{productVideoTitle}</h2>
              <p>{productVideoDescription}</p>
            </div>
            <div className={styles.productVideoFrame}>
              {showVideo && productVideoIsDirect ? (
                <video
                  className={styles.productVideoEmbed}
                  src={productVideoUrl}
                  controls
                  playsInline
                  poster={heroImage}
                />
              ) : showVideo ? (
                <iframe
                  className={styles.productVideoEmbed}
                  src={productVideoEmbedUrl}
                  title={productVideoTitle}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" className={styles.productVideoPreviewButton} onClick={() => setShowVideo(true)}>
                  <img src={heroImage} alt={`Play ${displayProduct.name} build video`} className={styles.productVideoPreviewImage} />
                  <span className={styles.productVideoPlayButton}>
                    <PlayCircle size={24} />
                    Play video
                  </span>
                </button>
              )}
            </div>
          </section>
          )}

          {templateVisibility.detailCards && (
          <section className={styles.contentGrid}>
            <article className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <Layers3 size={18} />
                <div>
                  <h2>{template.headings.includedTitle}</h2>
                  <p>{template.headings.includedDescription}</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {includedItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <Wrench size={18} />
                <div>
                  <h2>{template.headings.requirementsTitle}</h2>
                  <p>{template.headings.requirementsDescription}</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {requirements.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <Ruler size={18} />
                <div>
                  <h2>{digital ? template.headings.manufacturingTitleDigital : template.headings.manufacturingTitlePhysical}</h2>
                  <p>{digital ? template.headings.manufacturingDescriptionDigital : template.headings.manufacturingDescriptionPhysical}</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {manufacturingNotes.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <ShieldCheck size={18} />
                <div>
                  <h2>{template.headings.supportTitle}</h2>
                  <p>{template.headings.supportDescription}</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {supportItems.concat(purchaseNotes).map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>
          )}

          {templateVisibility.technicalSpecs && showTechnicalSpecs && (
            <section className={styles.specSection}>
              <div className={styles.specHeader}>
                <div>
                  <h2>{template.headings.technicalTitle}</h2>
                  <p>{template.headings.technicalDescription}</p>
                </div>
              </div>
              <dl className={styles.specGrid}>
                {technicalSpecs.map(item => (
                  <div key={item.label} className={styles.specCard}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {templateVisibility.reviews && (
          <section className={styles.reviewSection}>
            <div className={styles.reviewSectionHeader}>
              <div>
                <h2>{template.headings.reviewsTitle}</h2>
                <p>{template.headings.reviewsDescription}</p>
              </div>
              <div className={styles.reviewScoreCard}>
                <strong>{reviews.length ? averageRating.toFixed(1) : '--'}</strong>
                <div className={styles.starsRow}>{renderStars(Math.round(averageRating))}</div>
                <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div className={styles.reviewLayout}>
              <div className={styles.reviewList}>
                {reviews.length ? reviews.map(review => (
                  <article key={review.id} className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <div>
                        <h3>{review.title || 'Verified customer review'}</h3>
                        <p>{review.profile?.full_name || 'Wingxtra customer'} | {formatDate(review.created_at)}</p>
                      </div>
                      <div className={styles.starsRow}>{renderStars(review.rating, styles.reviewStar)}</div>
                    </div>
                    <p className={styles.reviewBody}>{review.body || 'Great product and buying experience.'}</p>
                  </article>
                )) : (
                  <div className={styles.emptyReviews}>{templateLabels.emptyReviews}</div>
                )}
              </div>

              <div className={styles.reviewFormCard}>
                <h3>{ownReview ? templateLabels.reviewFormTitleUpdate : templateLabels.reviewFormTitleCreate}</h3>
                {user ? (
                  <>
                    <div className={styles.ratingPicker}>
                      {Array.from({ length: 5 }, (_, index) => {
                        const ratingValue = index + 1
                        return (
                          <button
                            key={ratingValue}
                            type="button"
                            className={styles.ratingButton}
                            onClick={() => setReviewForm(current => ({ ...current, rating: ratingValue }))}
                            aria-label={`Rate ${ratingValue} stars`}
                          >
                            <Star size={18} className={`${styles.star} ${ratingValue <= reviewForm.rating ? styles.starActive : ''}`} />
                          </button>
                        )
                      })}
                    </div>
                    <input
                      className={styles.reviewInput}
                      placeholder="Review title"
                      value={reviewForm.title}
                      onChange={event => setReviewForm(current => ({ ...current, title: event.target.value }))}
                    />
                    <textarea
                      className={styles.reviewTextarea}
                      rows={5}
                      placeholder="Tell other customers what stood out about this product."
                      value={reviewForm.body}
                      onChange={event => setReviewForm(current => ({ ...current, body: event.target.value }))}
                    />
                    <Button type="button" onClick={() => submitReview.mutate()} loading={submitReview.isPending}>
                      {ownReview ? templateLabels.reviewSubmitUpdate : templateLabels.reviewSubmitCreate}
                    </Button>
                  </>
                ) : (
                  <p className={styles.reviewLoginNote}>{templateLabels.signInReviewMessage}</p>
                )}
              </div>
            </div>
          </section>
          )}

          {templateVisibility.bundles && bundleItems && bundleItems.length > 0 && (
            <section className={styles.bundleSection}>
              <div className={styles.bundleHeader}>
                <div>
                  <h2>{template.headings.bundlesTitle}</h2>
                  <p>{template.headings.bundlesDescription}</p>
                </div>
                {displayProduct.is_drone_product && (
                  <Link to="/drones" className={styles.backLink}>
                    Back to drone collection <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div className={styles.bundleGrid}>
                {bundleItems.map(item => {
                  const electronicProduct = item.electronic_product as Product
                  if (!electronicProduct) return null
                  const checked = selectedElectronics.has(item.electronic_product_id)
                  return (
                    <button
                      key={item.id}
                      className={`${styles.bundleCard} ${checked ? styles.bundleCardSelected : ''}`}
                      onClick={() => toggleElectronic(item.electronic_product_id)}
                    >
                      <div className={styles.bundleCheck}>
                        {checked ? <CheckSquare size={18} color="var(--color-accent-400)" /> : <Square size={18} />}
                      </div>
                      <img
                        src={electronicProduct.image_url || 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200'}
                        alt={electronicProduct.name}
                        className={styles.bundleImg}
                      />
                      <div className={styles.bundleInfo}>
                        <span className={styles.bundleCategory}>{electronicProduct.category?.name}</span>
                        <span className={styles.bundleName}>{electronicProduct.name}</span>
                        <span className={styles.bundlePrice}>{formatFromBase(getProductPrice(electronicProduct))}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
