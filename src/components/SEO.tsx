import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getDefaultSiteContent } from '@/lib/siteContent'

interface BreadcrumbItem {
  name: string
  url: string
}

interface ProductSchema {
  name: string
  description: string
  price: number
  currency?: string
  image?: string
  sku?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
}

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  breadcrumbs?: BreadcrumbItem[]
  product?: ProductSchema
  noIndex?: boolean
}

const SITE_URL = (import.meta as { env: Record<string, string | undefined> }).env.VITE_SITE_URL || 'https://shop.wingxtra.com'

export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  breadcrumbs,
  product,
  noIndex = false,
}: SEOProps) {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: globalContent } = useSiteContent('global_store', previewMode)
  const globalDefaults = globalContent ?? getDefaultSiteContent('global_store')
  const siteName = globalDefaults.seo.siteName
  const fallbackDescription = globalDefaults.seo.defaultDescription
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const resolvedDescription = description || fallbackDescription
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const ogImage = image || globalDefaults.seo.defaultImage

  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: `${SITE_URL}${item.url}`,
        })),
      }
    : null

  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image || ogImage,
        sku: product.sku,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'GHS',
          availability: `https://schema.org/${product.availability || 'InStock'}`,
          url: canonicalUrl,
        },
      }
    : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  )
}
