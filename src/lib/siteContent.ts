export type ContentKey = 'home_page' | 'drones_page' | 'shop_page' | 'global_store' | 'product_page_template'

export type LinkContent = {
  label: string
  href: string
}

export type HighlightContent = {
  value: string
  label: string
}

export type CollectionItemContent = {
  title: string
  description: string
  href: string
  image: string
}

export type NavCardContent = {
  id: string
  isVisible: boolean
  label: string
  description: string
  href: string
  image: string
}

export type PointContent = {
  title: string
  description: string
}

export type TestimonialContent = {
  quote: string
  name: string
  role: string
}

export type FaqContent = {
  question: string
  answer: string
}

export type StorySectionContent = {
  eyebrow: string
  title: string
  paragraphs: string[]
  cta: LinkContent
  image: string
  imageAlt: string
  align: 'imageBottom' | 'imageLeft' | 'imageRight'
  bullets?: string[]
}

export type HeroSlideContent = {
  isVisible: boolean
  eyebrow: string
  title: string
  body: string
  image: string
  primaryCta: LinkContent
  secondaryCta: LinkContent
  featureTag: string
  featureTitle: string
  featureBody: string
  featureHref: string
  featureLabel: string
}

export type HomeVisibilitySettings = {
  collections: boolean
  featuredProducts: boolean
  storeFoundations: boolean
  storySections: boolean
  deliveryTypes: boolean
  processStory: boolean
  testimonials: boolean
  community: boolean
  faq: boolean
  newsletter: boolean
}

export type HomeSectionKey = keyof HomeVisibilitySettings

export type HomeDesignSettings = {
  heroMinHeight: string
  heroTitleScale: string
  heroPanelWidth: string
  heroPanelPosition: 'left' | 'center' | 'right'
  heroOverlay: string
  showHeroStats: boolean
  sectionSpacing: string
}

export type FeaturedProductMode = 'latest' | 'manual' | 'new_arrivals' | 'sale'
export type BrandDropdownMode = 'automatic' | 'manual'

export type HomePageContent = {
  seo: {
    title: string
    description: string
  }
  visibility: HomeVisibilitySettings
  sectionOrder: HomeSectionKey[]
  design: HomeDesignSettings
  hero: {
    eyebrow: string
    title: string
    body: string
    primaryCta: LinkContent
    secondaryCta: LinkContent
    highlights: HighlightContent[]
    feature: {
      tag: string
      title: string
      body: string
      link: LinkContent
      image: string
      imageAlt: string
    }
    slides: HeroSlideContent[]
  }
  collections: {
    eyebrow: string
    title: string
    items: CollectionItemContent[]
  }
  droneLineup: {
    eyebrow: string
    title: string
    linkLabel: string
  }
  categories: {
    eyebrow: string
    title: string
    description: string
  }
  storeFoundations: {
    eyebrow: string
    title: string
    items: PointContent[]
  }
  storySections: StorySectionContent[]
  deliveryTypes: {
    eyebrow: string
    title: string
    description: string
    items: Array<PointContent & { href: string; linkLabel: string }>
  }
  processStory: {
    eyebrow: string
    title: string
    description: string
    points: PointContent[]
  }
  featuredProducts: {
    eyebrow: string
    title: string
    linkLabel: string
    mode: FeaturedProductMode
    productSlugs: string[]
    maxItems: string
  }
  testimonials: {
    eyebrow: string
    title: string
    description: string
    items: TestimonialContent[]
  }
  community: {
    eyebrow: string
    title: string
    description: string
    image: string
    imageAlt: string
    primaryCta: LinkContent
    secondaryCta: LinkContent
    points: PointContent[]
  }
  faq: {
    eyebrow: string
    title: string
    description: string
    items: FaqContent[]
  }
  newsletter: {
    eyebrow: string
    title: string
    description: string
    placeholder: string
    buttonLabel: string
  }
}

export type DronesPageContent = {
  seo: {
    title: string
    description: string
  }
  visibility: {
    hero: boolean
    quickNav: boolean
    video: boolean
    story: boolean
    featuredProduct: boolean
    catalog: boolean
    blueprint: boolean
  }
  hero: {
    eyebrow: string
    title: string
    description: string
    stats: HighlightContent[]
    featuredTag: string
    featuredLinkLabel: string
  }
  quickNav: LinkContent[]
  video: {
    title: string
    url: string
    playLabel: string
    posterFallback: string
  }
  story: {
    title: string
    blocks: PointContent[]
  }
  featured: {
    eyebrow: string
    titleFallback: string
    description: string
    linkLabel: string
  }
  catalog: {
    title: string
    maxItems: string
  }
  blueprint: {
    eyebrow: string
    title: string
    description: string
    cardTitle: string
    cardDescription: string
  }
  filterIntro: {
    eyebrow: string
    description: string
  }
  buyingPoints: PointContent[]
  overview: {
    eyebrow: string
    title: string
  }
}

export type ShopPageContent = {
  seo: {
    title: string
    description: string
  }
  visibility: {
    hero: boolean
    filters: boolean
    resultSummary: boolean
    collectionTiles: boolean
    productGrid: boolean
    featureRail: boolean
  }
  hero: {
    eyebrow: string
    title: string
    description: string
    highlights: string[]
    stats: HighlightContent[]
  }
  controls: {
    searchPlaceholder: string
    resultLabel: string
    clearFiltersLabel: string
    emptyState: string
    quickLinks: LinkContent[]
  }
  featureRail: Array<PointContent & { href: string; linkLabel: string }>
}

export type GlobalStoreContent = {
  seo: {
    siteName: string
    defaultDescription: string
    defaultImage: string
  }
  navbar: {
    shopLabel: string
    newArrivalsLabel: string
    productsLabel: string
    brandsLabel: string
    showShop: boolean
    showNewArrivals: boolean
    showProducts: boolean
    showBrands: boolean
    megaEyebrow: string
    megaTitle: string
    megaViewAllLabel: string
    brandsEyebrow: string
    brandsTitle: string
    brandsViewAllLabel: string
    maxBrandCards: string
    brandMode: BrandDropdownMode
    featuredBrandSlugs: string[]
    productCards: NavCardContent[]
  }
  theme: {
    backgroundColor: string
    surfaceColor: string
    accentColor: string
    accentSoftColor: string
    textColor: string
    mutedTextColor: string
    heroOverlayColor: string
    cardRadius: string
  }
  footer: {
    tagline: string
    shopHeading: string
    accountHeading: string
    supportHeading: string
    supportEmail: string
    documentationLabel: string
    copyrightText: string
    badges: string[]
  }
}

export type ProductPageTemplateContent = {
  seo: {
    titleTemplate: string
    descriptionTemplate: string
  }
  visibility: {
    trustLine: boolean
    assuranceBar: boolean
    beforeYouBuy: boolean
    templateGuide: boolean
    dossier: boolean
    video: boolean
    detailCards: boolean
    technicalSpecs: boolean
    reviews: boolean
    bundles: boolean
  }
  labels: {
    trustConnector: string
    trustSuffix: string
    assuranceOne: string
    assuranceTwo: string
    assuranceThree: string
    videoEyebrow: string
    productStoryEyebrow: string
    blueprintEyebrow: string
    overviewEyebrow: string
    filesEyebrow: string
    technicalDataEyebrow: string
    shoppingListEyebrow: string
    addAgainLabel: string
    addToCartLabel: string
    outOfStockLabel: string
    signInReviewMessage: string
    emptyReviews: string
    reviewFormTitleCreate: string
    reviewFormTitleUpdate: string
    reviewSubmitCreate: string
    reviewSubmitUpdate: string
  }
  headings: {
    includedTitle: string
    includedDescription: string
    requirementsTitle: string
    requirementsDescription: string
    manufacturingTitleDigital: string
    manufacturingDescriptionDigital: string
    manufacturingTitlePhysical: string
    manufacturingDescriptionPhysical: string
    supportTitle: string
    supportDescription: string
    technicalTitle: string
    technicalDescription: string
    reviewsTitle: string
    reviewsDescription: string
    bundlesTitle: string
    bundlesDescription: string
    beforeYouBuyTitle: string
  }
}

export type SiteContentMap = {
  home_page: HomePageContent
  drones_page: DronesPageContent
  shop_page: ShopPageContent
  global_store: GlobalStoreContent
  product_page_template: ProductPageTemplateContent
}

export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  collections: 'Collections',
  featuredProducts: 'Featured Products',
  storeFoundations: 'Store Foundations',
  storySections: 'Story Sections',
  deliveryTypes: 'Delivery Types',
  processStory: 'Process Story',
  testimonials: 'Testimonials',
  community: 'Community',
  faq: 'FAQ',
  newsletter: 'Newsletter',
}

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionKey[] = [
  'collections',
  'featuredProducts',
  'storeFoundations',
  'storySections',
  'deliveryTypes',
  'processStory',
  'testimonials',
  'community',
  'faq',
  'newsletter',
]

export const DEFAULT_NAV_PRODUCT_CARDS: NavCardContent[] = [
  {
    id: 'all_products',
    isVisible: true,
    label: 'All Products',
    description: 'Open the complete UAV marketplace catalog.',
    href: '/shop',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'wingxtra_aircraft',
    isVisible: true,
    label: 'Wingxtra Aircraft',
    description: 'Wingxtra-designed UAV platforms and aircraft systems.',
    href: '/drones',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'fixed_wing_uavs',
    isVisible: true,
    label: 'Fixed-Wing UAVs',
    description: 'Fixed-wing aircraft, trainers, mapping platforms, and FPV airframes.',
    href: '/collection/fixed_wing_uavs',
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'vtol_uavs',
    isVisible: true,
    label: 'VTOL UAVs',
    description: 'Hybrid takeoff aircraft, VTOL frames, and transition platforms.',
    href: '/collection/vtol_uavs',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'multirotor_uavs',
    isVisible: true,
    label: 'Multirotor UAVs',
    description: 'Quadcopters, hexacopters, frames, and multirotor accessories.',
    href: '/collection/multirotor_uavs',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'airframes_kits',
    isVisible: true,
    label: 'Airframes & Kits',
    description: 'EPO, composite, MJF, and kit-format airframes.',
    href: '/collection/airframes_kits',
    image: 'https://images.unsplash.com/photo-1533069027836-fa937181a8ce?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'additive_manufacturing',
    isVisible: true,
    label: 'Additive Manufacturing',
    description: 'STL files, FDM printable packs, MJF parts, and printed accessories.',
    href: '/collection/additive_manufacturing',
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'avionics_flight_control',
    isVisible: true,
    label: 'Avionics & Flight Control',
    description: 'Flight controllers, receivers, autopilot stacks, ESCs, and servos.',
    href: '/collection/avionics_flight_control',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'propulsion_systems',
    isVisible: true,
    label: 'Propulsion Systems',
    description: 'Brushless motors, propellers, ESCs, and propulsion hardware.',
    href: '/collection/propulsion_systems',
    image: 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'payload_imaging_telemetry',
    isVisible: true,
    label: 'Payload, Imaging & Telemetry',
    description: 'Cameras, mapping payloads, telemetry radios, and survey electronics.',
    href: '/collection/payload_imaging_telemetry',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'recovery_safety',
    isVisible: true,
    label: 'Recovery & Safety',
    description: 'Parachutes, recovery systems, launch aids, and safety equipment.',
    href: '/collection/recovery_safety',
    image: 'https://images.unsplash.com/photo-1533309907656-7b1c2ee56ddf?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'winches_mission_systems',
    isVisible: true,
    label: 'Winches & Mission Systems',
    description: 'Winches, release systems, payload drop modules, and mission accessories.',
    href: '/collection/winches_mission_systems',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
  },
]

export const defaultSiteContent: SiteContentMap = {
  home_page: {
    seo: {
      title: 'Wingxtra Store - 3D Printed Drones, Airframes, and Drone Parts',
      description: 'Shop Wingxtra drone platforms, digital STL files, MJF printed parts, and composite hardware in a premium product-focused storefront.',
    },
    visibility: {
      collections: true,
      featuredProducts: true,
      storeFoundations: true,
      storySections: true,
      deliveryTypes: true,
      processStory: true,
      testimonials: true,
      community: true,
      faq: true,
      newsletter: true,
    },
    sectionOrder: DEFAULT_HOME_SECTION_ORDER,
    design: {
      heroMinHeight: '720px',
      heroTitleScale: '1',
      heroPanelWidth: '640px',
      heroPanelPosition: 'left',
      heroOverlay: '0.72',
      showHeroStats: true,
      sectionSpacing: '1',
    },
    hero: {
      eyebrow: 'Wingxtra Store',
      title: '3D printed drones, airframes, and flight parts in one serious store.',
      body: 'Buy digital STL files, MJF printed hardware, and composite drone parts through a cleaner catalog built for real products, real repairs, and real builds.',
      primaryCta: { label: 'Shop Drones', href: '/drones' },
      secondaryCta: { label: 'Shop Components', href: '/shop' },
      highlights: [
        { value: '3', label: 'Fulfillment paths' },
        { value: 'Real', label: 'Product-led pages' },
        { value: 'Fast', label: 'Repair and replacement flow' },
      ],
      feature: {
        tag: 'Featured drone collection',
        title: 'Dedicated drone pages with specs, descriptions, and compatible parts.',
        body: 'The store separates drone products from the broader component catalog so buyers can understand the platform first, then build around it with confidence.',
        link: { label: 'View drone collection', href: '/drones' },
        image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Wingxtra drone product',
      },
      slides: [
        {
          isVisible: true,
          eyebrow: 'Wingxtra Store',
          title: '3D printed drones, airframes, and uav components.',
          body: 'Buy digital STL files, MJF printed hardware, and composite drone parts through a cleaner catalog built for real products, real repairs, and real builds.',
          image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1800&q=82',
          primaryCta: { label: 'Shop Drones', href: '/drones' },
          secondaryCta: { label: 'Shop Components', href: '/shop' },
          featureTag: 'Featured drone collection',
          featureTitle: 'Dedicated drone pages with specs, descriptions, and compatible parts.',
          featureBody: 'The store separates drone products from the broader component catalog so buyers can understand the platform first, then build around it with confidence.',
          featureHref: '/drones',
          featureLabel: 'View drone collection',
        },
        {
          isVisible: true,
          eyebrow: 'Curated UAV marketplace',
          title: 'Curated UAV systems, parts, and mission hardware.',
          body: 'Wingxtra aircraft and selected partner products sit inside one clear buying experience for builders and operators.',
          image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=82',
          primaryCta: { label: 'Open Catalog', href: '/shop' },
          secondaryCta: { label: 'View Collections', href: '/collection/new-arrivals' },
          featureTag: 'Marketplace expansion',
          featureTitle: 'A cleaner way to shop UAV platforms, components, and technologies.',
          featureBody: 'The store supports Wingxtra aircraft plus third-party products without losing the premium aerospace structure.',
          featureHref: '/shop',
          featureLabel: 'Browse marketplace',
        },
        {
          isVisible: true,
          eyebrow: 'Additive manufacturing',
          title: 'Digital files, MJF parts, and shipped hardware made clear.',
          body: 'Customers can quickly tell whether they are buying a download, a made-to-order part, or a physical shipment.',
          image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1800&q=82',
          primaryCta: { label: 'Explore Files', href: '/collection/additive_manufacturing' },
          secondaryCta: { label: 'Shop Parts', href: '/shop' },
          featureTag: 'Fulfillment clarity',
          featureTitle: 'Files and physical products are separated before checkout.',
          featureBody: 'Digital downloads, MJF parts, and composite hardware are shown as real products with specific expectations.',
          featureHref: '/collection/additive_manufacturing',
          featureLabel: 'Open additive collection',
        },
      ],
    },
    collections: {
      eyebrow: 'Collections',
      title: 'Start with the right collection',
      items: [
        {
          title: 'Drone Platforms',
          description: 'Complete airframes, VTOL concepts, and core frame kits presented as proper store products.',
          href: '/drones',
          image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Digital STL Files',
          description: 'Instant-download files for home printing, replacements, and fast design iteration.',
          href: '/shop?type=fdm',
          image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'MJF & Composite Parts',
          description: 'Shipped structural parts for builders who want production-quality hardware on hand.',
          href: '/shop?type=mjf',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    },
    droneLineup: {
      eyebrow: 'Drone Lineup',
      title: 'Start with the airframe, then build around it',
      linkLabel: 'View all drones',
    },
    categories: {
      eyebrow: 'Categories',
      title: 'Shop by category',
      description: 'Every major component group for your build, with cleaner entry points into the full catalog.',
    },
    storeFoundations: {
      eyebrow: 'Store Foundations',
      title: 'Everything around the transaction is designed to stay clear and trustworthy.',
      items: [
        { title: 'Secure Payments', description: 'Powered by Paystack with webhook verification.' },
        { title: 'Instant Downloads', description: 'STL files are delivered through secure expiring links.' },
        { title: 'Fast Shipping', description: 'Physical products stay clearly separated and tracked.' },
        { title: 'Expert Designed', description: 'Parts tuned for fixed-wing, FPV, and modular drone builds.' },
      ],
    },
    storySections: [
      {
        eyebrow: 'Design Thinking',
        title: 'Learning from Nature',
        paragraphs: [
          'Biomimicry is not decoration here. It is a design approach for making lighter, stronger, and more efficient drone structures that still suit practical manufacturing.',
          'This store should help buyers discover those airframes quickly, understand the build intent, and move straight into the products that match their printer or fulfillment preference.',
        ],
        cta: { label: 'Explore Designs', href: '/drones' },
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Design workshop environment',
        align: 'imageBottom',
        bullets: [],
      },
      {
        eyebrow: 'Store Context',
        title: 'Engineering Projects',
        paragraphs: [
          'A small drone still lives under the same physics as larger aircraft. That is why the best products explain the platform, the load path, and the intended use instead of hiding behind generic store copy.',
          'From stress-aware geometry to modular sections that are easier to repair, the store should communicate engineering value without becoming a lecture.',
        ],
        cta: { label: 'View Drone Range', href: '/drones' },
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Warehouse and engineering logistics',
        align: 'imageRight',
        bullets: [],
      },
      {
        eyebrow: 'Repair Logic',
        title: 'You Crash It. You Print It Again.',
        paragraphs: [
          'Repairability is one of the strongest selling points of a printable drone ecosystem. When a frame section or printed accessory fails, you should not feel forced into replacing an entire system.',
          'Digital replacement files, modular product structures, and clear compatible-part recommendations make recovery faster and cheaper.',
        ],
        cta: { label: 'Browse Printable Files', href: '/shop?type=fdm' },
        image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Builder repairing electronics and hardware',
        align: 'imageLeft',
        bullets: ['Print replacement parts', 'Modular design', 'Repair-friendly product flow'],
      },
    ],
    deliveryTypes: {
      eyebrow: 'Delivery Types',
      title: 'Understand what you are buying before checkout',
      description: 'Digital files and physical products are presented differently so the store stays clear, premium, and trustworthy.',
      items: [
        { title: 'FDM Digital Files', description: 'Buy printable file packs for local production, repair cycles, and quick testing.', href: '/shop?type=fdm', linkLabel: 'Browse FDM Digital Files' },
        { title: 'MJF Printed Parts', description: 'Order tougher nylon parts when you want a finished physical component shipped to you.', href: '/shop?type=mjf', linkLabel: 'Browse MJF Printed Parts' },
        { title: 'Composite Hardware', description: 'Choose lightweight structural parts when stiffness, weight, and finish matter most.', href: '/shop?type=composite', linkLabel: 'Browse Composite Hardware' },
      ],
    },
    processStory: {
      eyebrow: 'The Wingxtra Process',
      title: 'From design intent to repeatable builds',
      description: 'The store should help people move from discovery to confident purchase by making the product logic obvious: which files are printable, which parts are shipped, and which supporting components belong together.',
      points: [
        { title: 'Product-first buying experience', description: 'Cleaner collections and sharper cards help buyers get to the right drone or component faster.' },
        { title: 'Compatible parts surfaced clearly', description: 'Drone pages connect naturally to the motors, ESCs, and accessories they are likely to need.' },
        { title: 'Built for repeat iteration', description: 'Printable products, replacement logic, and physical upgrades all support real development cycles.' },
      ],
    },
    featuredProducts: {
      eyebrow: 'Featured Products',
      title: 'Popular parts and file packs',
      linkLabel: 'Open full catalog',
      mode: 'latest',
      productSlugs: [],
      maxItems: '6',
    },
    testimonials: {
      eyebrow: 'What Our Community Says',
      title: 'Proof that the store speaks to real builders',
      description: 'These are the kinds of outcomes the storefront should support: clarity, confidence, and faster decision-making.',
      items: [
        { quote: 'The product pages make sense. I can compare the drone, see what is included, and add the matching parts in one flow.', name: 'Kwame B.', role: 'Prototype Builder' },
        { quote: 'The digital files feel like real products, not random downloads. It is clear what I print myself and what gets shipped.', name: 'Sarah M.', role: 'Engineering Student' },
        { quote: 'What sold me was the modular approach. Crash damage feels manageable when replacement parts are easy to identify and buy.', name: 'Michael A.', role: 'FPV Hobbyist' },
      ],
    },
    community: {
      eyebrow: 'Community',
      title: 'Join our growing community',
      description: 'Connect with fellow builders, share your progress, and get practical advice from people who are also iterating through printable and modular airframe projects.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Wingxtra builder community',
      primaryCta: { label: 'Start Building', href: '/drones' },
      secondaryCta: { label: 'Browse Products', href: '/shop' },
      points: [
        { title: 'Expert Guides', description: 'Step-by-step build notes and practical setup advice for getting from files to flight.' },
        { title: 'Community Support', description: 'Learn from other builders and avoid the expensive mistakes that slow early projects down.' },
        { title: 'Fan Videos', description: 'See real builds, test flights, repair approaches, and layout ideas before you buy.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      title: 'Frequently asked questions',
      description: 'Everything a buyer should quickly understand before choosing files, printed parts, or a full drone platform.',
      items: [
        { question: 'Do I need an expensive 3D printer?', answer: 'No. FDM file products are positioned for capable hobby printers, while MJF and composite options cover buyers who want finished physical parts instead.' },
        { question: 'How long does it take to build a drone?', answer: 'That depends on the platform, but most smaller printable builds move from printing to assembly across a weekend, especially when the electronics list is already matched for you.' },
        { question: 'Are all products digital downloads?', answer: 'No. FDM items are digital, while MJF and composite products are shipped physically. Every product card and detail page makes that distinction clearly.' },
        { question: 'Can I replace damaged parts without rebuying everything?', answer: 'That is one of the strongest reasons to build this way. Printable products and modular part selection make repair cycles much more practical.' },
      ],
    },
    newsletter: {
      eyebrow: 'Stay Updated',
      title: 'Get notified about launches, product drops, and printable releases.',
      description: 'Use your email app to request updates on new drones, store additions, and limited production runs.',
      placeholder: 'Enter your email',
      buttonLabel: 'Subscribe',
    },
  },
  drones_page: {
    seo: {
      title: 'Drone Collection',
      description: 'Browse Wingxtra drone products in a dedicated collection page with clearer descriptions, specs, buying context, and fulfillment differences.',
    },
    visibility: {
      hero: true,
      quickNav: true,
      video: true,
      story: true,
      featuredProduct: true,
      catalog: true,
      blueprint: true,
    },
    hero: {
      eyebrow: 'Drone Collection',
      title: 'Choose the platform first. Build the rest around it.',
      description: 'This collection is designed to feel like a proper airframe catalog. Compare digital files, shipped nylon structures, and composite-led platforms with enough context to decide before you ever open the product page.',
      stats: [
        { value: '3', label: 'fulfillment paths' },
        { value: 'Builder-first', label: 'comparison flow' },
      ],
      featuredTag: 'Featured platform',
      featuredLinkLabel: 'Open product page',
    },
    quickNav: [
      { label: 'Aircraft', href: '/drones' },
      { label: 'Blueprint Files', href: '/collection/additive_manufacturing' },
      { label: 'Printed Parts', href: '/collection/airframes_kits' },
      { label: 'Shopping List', href: '/collection/propulsion_systems' },
    ],
    video: {
      title: 'Wingxtra drone presentation',
      url: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
      playLabel: 'Play video',
      posterFallback: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1600&q=80',
    },
    story: {
      title: 'Designed as a real aircraft collection',
      blocks: [
        {
          title: 'Designed to be printed',
          description:
            'Every aircraft collection needs a clear build story: what the platform is for, how it is produced, and which parts are digital files, printed hardware, or shipped assemblies.',
        },
        {
          title: 'Inspired by natural efficiency',
          description:
            'The buying flow should help customers understand weight, structure, load paths, and repair logic before they choose a file pack or a physical aircraft component.',
        },
        {
          title: 'Platform-first product pages',
          description:
            'Customers should understand the aircraft first, then the files, parts, electronics, and mission systems that belong to it. That keeps the store simple without making it shallow.',
        },
      ],
    },
    featured: {
      eyebrow: 'Recommended',
      titleFallback: 'Featured aircraft platform',
      description:
        'This aircraft gives customers a focused starting point before they compare files, printed parts, propulsion, flight control, and mission accessories.',
      linkLabel: 'Open details',
    },
    catalog: {
      title: 'Current aircraft lineup',
      maxItems: '3',
    },
    blueprint: {
      eyebrow: 'Blueprint Files',
      title: 'Files, videos, and structured detail blocks belong in the same flow.',
      description:
        'Aircraft products need supporting files, build guidance, video context, and compatible hardware presented in the same buying flow so customers do not get lost between pages.',
      cardTitle: 'Presentation-ready content blocks',
      cardDescription: 'Use this section later for product videos, print notes, assembly guidance, and blueprint explanations.',
    },
    filterIntro: {
      eyebrow: 'Filter the range',
      description: 'Switch between printable files, shipped MJF builds, and composite hardware-led drone products.',
    },
    buyingPoints: [
      { title: 'Choose by fulfillment path', description: 'Start with the format that matches how you want to build: print it yourself or receive finished hardware.' },
      { title: 'Compare the airframe first', description: 'Each platform card surfaces the most useful specs so buyers can compare before jumping into components.' },
      { title: 'Build from compatible parts', description: 'Drone product pages continue into the right electronics and structural add-ons instead of ending at the frame.' },
    ],
    overview: {
      eyebrow: 'Collection overview',
      title: 'Compare the current drone range at a glance',
    },
  },
  shop_page: {
    seo: {
      title: 'Shop All Products',
      description: 'Browse the full Wingxtra catalog, compare physical and digital fulfillment paths, and move into the right drone or component family faster.',
    },
    visibility: {
      hero: true,
      filters: true,
      resultSummary: true,
      collectionTiles: true,
      productGrid: true,
      featureRail: true,
    },
    hero: {
      eyebrow: 'Store Catalog',
      title: 'Shop Wingxtra by product path',
      description: 'Browse the full Wingxtra catalog, compare physical and digital fulfillment paths, and move into the right drone or component family faster.',
      highlights: [
        'Digital and shipped products separated clearly',
        'Searchable by build intent, format, and specs',
        'Cleaner path from airframe to compatible parts',
      ],
      stats: [
        { value: 'products shown', label: '' },
        { value: 'featured drones', label: '' },
        { value: 'sale items', label: '' },
      ],
    },
    controls: {
      searchPlaceholder: 'Search products, brands, mission systems...',
      resultLabel: 'products shown',
      clearFiltersLabel: 'Clear filters',
      emptyState: 'No products match these filters yet. Clear filters or add products in admin.',
      quickLinks: [
        { label: 'New arrivals', href: '/collection/new-arrivals' },
        { label: 'Additive manufacturing', href: '/collection/additive_manufacturing' },
        { label: 'Wingxtra aircraft', href: '/drones' },
      ],
    },
    featureRail: [
      { title: 'Printable airframe files', description: 'Digital products for builders who want faster iteration, easier repair cycles, and local production freedom.', href: '/shop?type=fdm', linkLabel: 'Open collection' },
      { title: 'Shipped production parts', description: 'MJF and composite products for buyers who want finished structural hardware instead of self-printing.', href: '/shop?availability=physical_only', linkLabel: 'Open collection' },
      { title: 'Promotions and launch pricing', description: 'Products on sale, limited offers, and entry points for trying the catalog with lower risk.', href: '/shop?scope=sale', linkLabel: 'Open collection' },
    ],
  },
  global_store: {
    seo: {
      siteName: 'Wingxtra Store',
      defaultDescription: 'Premium drones, FDM 3D-printable files, MJF components, and carbon fiber composites. Designed for performance, built for precision.',
      defaultImage: 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg',
    },
    navbar: {
      shopLabel: 'Shop',
      newArrivalsLabel: 'New Arrivals',
      productsLabel: 'Products',
      brandsLabel: 'Brands',
      showShop: true,
      showNewArrivals: true,
      showProducts: true,
      showBrands: true,
      megaEyebrow: 'Collections',
      megaTitle: 'Browse by UAV mission, platform, and technology',
      megaViewAllLabel: 'View all products',
      brandsEyebrow: 'Brand partners',
      brandsTitle: 'Preview curated UAV brands',
      brandsViewAllLabel: 'View all brands',
      maxBrandCards: '8',
      brandMode: 'automatic',
      featuredBrandSlugs: [],
      productCards: DEFAULT_NAV_PRODUCT_CARDS,
    },
    theme: {
      backgroundColor: '#020603',
      surfaceColor: '#0d1510',
      accentColor: '#25d66f',
      accentSoftColor: '#8ef5b2',
      textColor: '#ffffff',
      mutedTextColor: 'rgba(239, 249, 242, 0.7)',
      heroOverlayColor: 'rgba(3, 8, 4, 0.72)',
      cardRadius: '0px',
    },
    footer: {
      tagline: 'Precision-engineered drone components and 3D printed parts for builders who demand performance.',
      shopHeading: 'Shop',
      accountHeading: 'Account',
      supportHeading: 'Support',
      supportEmail: 'support@wingxtra.com',
      documentationLabel: 'Documentation',
      copyrightText: 'Wingxtra Store. All rights reserved.',
      badges: ['FDM', 'MJF', 'Carbon Fiber'],
    },
  },
  product_page_template: {
    seo: {
      titleTemplate: '{product}',
      descriptionTemplate: 'Buy {product} - {summary}',
    },
    visibility: {
      trustLine: true,
      assuranceBar: true,
      beforeYouBuy: true,
      templateGuide: true,
      dossier: true,
      video: true,
      detailCards: true,
      technicalSpecs: true,
      reviews: true,
      bundles: true,
    },
    labels: {
      trustConnector: '|',
      trustSuffix: 'Curated and supplied by Wingxtra',
      assuranceOne: 'Secure checkout',
      assuranceTwo: 'Builder-first guidance',
      assuranceThree: 'Compatible system parts',
      videoEyebrow: 'Build video',
      productStoryEyebrow: 'Product story',
      blueprintEyebrow: 'Blueprint files',
      overviewEyebrow: 'Overview',
      filesEyebrow: 'Files and fulfillment',
      technicalDataEyebrow: 'Technical data',
      shoppingListEyebrow: 'Shopping list',
      addAgainLabel: 'Add Again',
      addToCartLabel: 'Add to Cart',
      outOfStockLabel: 'Out of stock',
      signInReviewMessage: 'Sign in to leave a review for this product.',
      emptyReviews: 'No reviews yet. Be the first to leave one.',
      reviewFormTitleCreate: 'Write a review',
      reviewFormTitleUpdate: 'Update your review',
      reviewSubmitCreate: 'Submit Review',
      reviewSubmitUpdate: 'Update Review',
    },
    headings: {
      includedTitle: 'Included in this purchase',
      includedDescription: 'Clear deliverables help buyers understand exactly what arrives after checkout.',
      requirementsTitle: 'Build requirements',
      requirementsDescription: 'Everything the buyer should know before starting the build or adding this part to an existing system.',
      manufacturingTitleDigital: 'Print and manufacturing notes',
      manufacturingDescriptionDigital: 'Recommended setup and material guidance for builders printing locally.',
      manufacturingTitlePhysical: 'Production and workshop notes',
      manufacturingDescriptionPhysical: 'Context on how this part is produced and what to expect when it arrives.',
      supportTitle: 'Delivery, support, and policy',
      supportDescription: 'Reassurance that mirrors how serious product stores answer buyer objections before checkout.',
      technicalTitle: 'Technical specifications',
      technicalDescription: 'Structured details for buyers comparing dimensions, materials, platform fit, and performance notes.',
      reviewsTitle: 'Customer reviews',
      reviewsDescription: 'Useful build feedback, purchase confidence, and social proof as the catalog grows.',
      bundlesTitle: 'Compatible electronics',
      bundlesDescription: 'Add matching components to the same order.',
      beforeYouBuyTitle: 'Before you buy',
    },
  },
}

export function deepMergeContent<T>(defaults: T, overrides: unknown): T {
  if (!overrides || typeof overrides !== 'object') return structuredClone(defaults)
  if (Array.isArray(defaults)) {
    return (Array.isArray(overrides) ? overrides : defaults) as T
  }

  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) }
  for (const [key, defaultValue] of Object.entries(defaults as Record<string, unknown>)) {
    const overrideValue = (overrides as Record<string, unknown>)[key]
    if (Array.isArray(defaultValue)) {
      result[key] = Array.isArray(overrideValue) ? overrideValue : defaultValue
    } else if (defaultValue && typeof defaultValue === 'object') {
      result[key] = deepMergeContent(defaultValue, overrideValue)
    } else {
      result[key] = overrideValue ?? defaultValue
    }
  }
  return result as T
}

export function getDefaultSiteContent<K extends ContentKey>(key: K): SiteContentMap[K] {
  return structuredClone(defaultSiteContent[key])
}
