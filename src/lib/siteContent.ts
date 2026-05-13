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

export type HomePageContent = {
  seo: {
    title: string
    description: string
  }
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
  hero: {
    eyebrow: string
    title: string
    description: string
    stats: HighlightContent[]
    featuredTag: string
    featuredLinkLabel: string
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
  hero: {
    eyebrow: string
    title: string
    description: string
    highlights: string[]
    stats: HighlightContent[]
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
    dronesLabel: string
    shopLabel: string
    productsLabel: string
    megaEyebrow: string
    megaTitle: string
    megaViewAllLabel: string
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

export const defaultSiteContent: SiteContentMap = {
  home_page: {
    seo: {
      title: 'Wingxtra Store - 3D Printed Drones, Airframes, and Drone Parts',
      description: 'Shop Wingxtra drone platforms, digital STL files, MJF printed parts, and composite hardware in a premium product-focused storefront.',
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
      dronesLabel: 'Drones',
      shopLabel: 'Shop',
      productsLabel: 'Products',
      megaEyebrow: 'Collections',
      megaTitle: 'Browse the store the way customers actually shop',
      megaViewAllLabel: 'View all products',
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
