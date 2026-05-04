import { Link } from 'react-router-dom'
import { ArrowRight, Download, Package, Cpu, Shield, Zap, DollarSign, Wrench, Target, Recycle, Mail, User, BookOpen, Users, Video } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { formatCurrency } from '@/lib/utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { data: products } = useProducts()
  const { data: categories } = useCategories()

  // Fallback products if Supabase not connected
  const fallbackProducts = [
    {
      id: '1',
      name: '5" FPV Drone Frame',
      slug: '5-inch-fpv-drone-frame',
      description: 'High-performance carbon fiber drone frame for FPV racing',
      price: 45.99,
      fulfillment_type: 'composite' as const,
      category_id: 'drone-frames',
      image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=400&q=80',
      stl_file_path: '',
      stock_count: 50,
      is_active: true,
      weight_grams: 150,
      is_drone_product: true,
      is_recommended_electronic: false,
      tags: ['fpv', 'racing', 'carbon'],
      specs: { size: '5 inch', material: 'carbon fiber' } as Record<string, string | number>,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '1', name: 'Drone Frames', slug: 'drone-frames', description: '', created_at: '2024-01-01T00:00:00Z' },
    },
    {
      id: '2',
      name: '2207 Brushless Motor',
      slug: '2207-brushless-motor',
      description: 'High-torque brushless motor for quadcopters',
      price: 29.99,
      fulfillment_type: 'composite' as const,
      category_id: 'motors',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
      stl_file_path: '',
      stock_count: 100,
      is_active: true,
      weight_grams: 45,
      is_drone_product: false,
      is_recommended_electronic: true,
      tags: ['motor', 'brushless', '2207'],
      specs: { kv: 2300, max_current: '30A' } as Record<string, string | number>,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '2', name: 'Motors', slug: 'motors', description: '', created_at: '2024-01-01T00:00:00Z' },
    },
    {
      id: '3',
      name: 'Carbon Fiber Propellers (5x4.5)',
      slug: 'carbon-fiber-propellers',
      description: 'Lightweight carbon fiber propellers for maximum efficiency',
      price: 12.99,
      fulfillment_type: 'composite' as const,
      category_id: 'propellers',
      image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
      stl_file_path: '',
      stock_count: 200,
      is_active: true,
      weight_grams: 25,
      is_drone_product: false,
      is_recommended_electronic: false,
      tags: ['propeller', 'carbon', '5x4.5'],
      specs: { size: '5x4.5', material: 'carbon fiber' } as Record<string, string | number>,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '3', name: 'Propellers', slug: 'propellers', description: '', created_at: '2024-01-01T00:00:00Z' },
    },
    {
      id: '4',
      name: '30A ESC with BEC',
      slug: '30a-esc-with-bec',
      description: '30A Electronic Speed Controller with Battery Eliminator Circuit',
      price: 19.99,
      fulfillment_type: 'composite' as const,
      category_id: 'escs',
      image_url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=400&q=80',
      stl_file_path: '',
      stock_count: 75,
      is_active: true,
      weight_grams: 35,
      is_drone_product: false,
      is_recommended_electronic: true,
      tags: ['esc', '30a', 'bec'],
      specs: { current: '30A', bec: '5V/2A' } as Record<string, string | number>,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '4', name: 'ESCs', slug: 'escs', description: '', created_at: '2024-01-01T00:00:00Z' },
    }
  ]

  const featured = products?.length ? products.slice(0, 4) : fallbackProducts.slice(0, 4)

  return (
    <>
      <SEO
        title="Premium Drone Parts & 3D Printing Store"
        description="Shop FDM digital downloads, MJF 3D printed components, and carbon fiber drone parts. Professional-grade parts for FPV builders and engineers."
        url="/"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img
            src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1600&q=80"
            alt="Drone in flight"
            className={styles.heroBgImg}
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroEyebrow}>
            <span className={styles.dot} />
            Professional Grade Components
          </div>
          <h1 className={styles.heroTitle}>
            Built for<br />
            <span className={styles.heroAccent}>Performance.</span><br />
            Engineered for Precision.
          </h1>
          <p className={styles.heroSubtitle}>
            FDM digital files, MJF 3D printed parts, and carbon fiber composites — designed for the most demanding builds.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/shop" className={styles.ctaPrimary}>
              Shop Now <ArrowRight size={16} />
            </Link>
            <Link to="/shop/drone-frames" className={styles.ctaSecondary}>
              View Drones
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>3</span>
              <span className={styles.statLabel}>Part Types</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>15min</span>
              <span className={styles.statLabel}>Secure Downloads</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>100%</span>
              <span className={styles.statLabel}>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product types */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Three Ways to Build</h2>
            <p>From instant digital downloads to precision-manufactured parts</p>
          </div>
          <div className={styles.typesGrid}>
            <div className={styles.typeCard}>
              <div className={`${styles.typeIcon} ${styles.typeIconGreen}`}>
                <Download size={22} />
              </div>
              <h3>FDM Digital</h3>
              <p>Instant STL file downloads. Print at home or send to your local service. Files are secured with 15-minute expiring signed URLs.</p>
              <Link to="/shop?type=fdm" className={styles.typeLink}>
                Browse FDM Files <ArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.typeCard}>
              <div className={`${styles.typeIcon} ${styles.typeIconBlue}`}>
                <Package size={22} />
              </div>
              <h3>MJF 3D Printed</h3>
              <p>Multi Jet Fusion nylon parts, printed to order. High-detail, strong, and lightweight. Ships within 5–7 business days.</p>
              <Link to="/shop?type=mjf" className={styles.typeLink}>
                Browse MJF Parts <ArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.typeCard}>
              <div className={`${styles.typeIcon} ${styles.typeIconYellow}`}>
                <Zap size={22} />
              </div>
              <h3>Carbon Fiber</h3>
              <p>Woven carbon fiber composite components. Maximum stiffness-to-weight ratio for performance-critical airframe parts.</p>
              <Link to="/shop/carbon-fiber-parts" className={styles.typeLink}>
                Browse Carbon Parts <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2>Featured Products</h2>
                <p>Handpicked precision components</p>
              </div>
              <Link to="/shop" className={styles.viewAll}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className={styles.productsGrid}>
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Shop by Category</h2>
              <p>Every component for your build</p>
            </div>
            <div className={styles.categoriesGrid}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/shop/${cat.slug}`}
                  className={styles.categoryCard}
                >
                  <span className={styles.categoryName}>{cat.name}</span>
                  <ArrowRight size={16} className={styles.categoryArrow} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {[
              { icon: <Shield size={20} />, title: 'Secure Payments', desc: 'Powered by Paystack with webhook verification' },
              { icon: <Download size={20} />, title: 'Instant Downloads', desc: 'STL files via signed URLs expiring in 15 minutes' },
              { icon: <Package size={20} />, title: 'Fast Shipping', desc: 'Tracked shipping for all physical orders' },
              { icon: <Cpu size={20} />, title: 'Expert Designed', desc: 'Parts engineered for FPV and fixed-wing builds' },
            ].map(f => (
              <div key={f.title} className={styles.featureItem}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Process */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.processSection}>
            <div className={styles.processContent}>
              <h2>The VOLANT Process</h2>
              <p>
                From digital design to flight-ready drone, our engineering process ensures every component
                meets the highest standards of performance and reliability.
              </p>
              <div className={styles.processSteps}>
                <div className={styles.processStep}>
                  <div className={styles.stepNumber}>1</div>
                  <h3>Design & Simulation</h3>
                  <p>Advanced CAD modeling with FEA analysis for optimal performance</p>
                </div>
                <div className={styles.processStep}>
                  <div className={styles.stepNumber}>2</div>
                  <h3>Precision Manufacturing</h3>
                  <p>FDM printing, MJF technology, and carbon fiber composites</p>
                </div>
                <div className={styles.processStep}>
                  <div className={styles.stepNumber}>3</div>
                  <h3>Quality Testing</h3>
                  <p>Rigorous testing ensures flight-ready reliability</p>
                </div>
              </div>
            </div>
            <div className={styles.processImage}>
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80"
                alt="Engineering process"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Biomimicry Design */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.biomimicrySection}>
            <div className={styles.biomimicryContent}>
              <h2>Learning from Nature</h2>
              <p>
                We are totally aware about the design freedom that 3D printing technology gives us,
                but this freedom should be used in a clever way otherwise you are not taking advantage
                of this incredible way to manufacture things!
              </p>
              <p>
                We are convinced that biomimicry is a great approach to take advantage of this freedom
                in order to develop low-weight, strong and efficient drones.
              </p>
              <Link to="/shop" className={styles.ctaSecondary}>
                Explore Designs <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.biomimicryImage}>
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"
                alt="Biomimicry inspired design"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Approach */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.engineeringSection}>
            <div className={styles.engineeringImage}>
              <img
                src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80"
                alt="Engineering analysis"
              />
            </div>
            <div className={styles.engineeringContent}>
              <h2>Engineering Projects</h2>
              <p>
                Physics and aerodynamics affect in the same way a commercial aircraft than a small drone.
                That is why we take each component project as an engineering project.
              </p>
              <p>
                Stress analysis to ensure acceptable strength and aerodynamics analysis to ensure
                stability and efficiency are just two of many examples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Benefits */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.costSection}>
            <div className={styles.costContent}>
              <h2>Cost Effective Innovation</h2>
              <p>
                3D printing technology allows us to manufacture complex geometries that would be
                impossible or prohibitively expensive with traditional methods.
              </p>
              <div className={styles.costBenefits}>
                <div className={styles.costBenefit}>
                  <DollarSign size={20} />
                  <span>Lower Production Costs</span>
                </div>
                <div className={styles.costBenefit}>
                  <Zap size={20} />
                  <span>Rapid Prototyping</span>
                </div>
                <div className={styles.costBenefit}>
                  <Wrench size={20} />
                  <span>Custom Modifications</span>
                </div>
              </div>
            </div>
            <div className={styles.costImage}>
              <img
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80"
                alt="Cost effective manufacturing"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Crash and Reprint */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.crashSection}>
            <div className={styles.crashImage}>
              <img
                src="https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=600&q=80"
                alt="Drone crash recovery"
              />
            </div>
            <div className={styles.crashContent}>
              <h2>You Crash It You Print It Again</h2>
              <p>
                Crashing is part of this hobby, but now you have a factory at home! The great advantage
                of a 3D printed drone is that in case you crash it you can print the damaged parts again,
                which saves a lot of money!
              </p>
              <p>
                The electronic elements which are more expensive rarely suffer damage during a crash.
                Critical parts are designed to be detachable allowing you to replace them easily.
              </p>
              <div className={styles.crashBenefits}>
                <div className={styles.crashBenefit}>
                  <Recycle size={20} />
                  <span>Print Replacement Parts</span>
                </div>
                <div className={styles.crashBenefit}>
                  <Target size={20} />
                  <span>Modular Design</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={styles.newsletterSection}>
        <div className="container">
          <div className={styles.newsletterContent}>
            <Mail size={48} className={styles.newsletterIcon} />
            <h2>Stay Updated</h2>
            <p>
              Get notified about new products, exclusive discounts, and the latest in drone technology.
              Join our community of builders and engineers.
            </p>
            <div className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.newsletterInput}
              />
              <button className={styles.newsletterButton}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>What Our Community Says</h2>
            <p>Join thousands of satisfied builders</p>
          </div>
          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                ★★★★★
              </div>
              <p className={styles.testimonialText}>
                "The quality of these 3D printed drones is incredible. I've built three now and each one flies better than the last. The modular design makes repairs so easy!"
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>
                  <User size={24} />
                </div>
                <div>
                  <div className={styles.testimonialName}>Alex Chen</div>
                  <div className={styles.testimonialTitle}>FPV Enthusiast</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                ★★★★★
              </div>
              <p className={styles.testimonialText}>
                "As an engineering student, I love how these drones teach real-world aerodynamics and design principles. The biomimicry approach is brilliant."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>
                  <User size={24} />
                </div>
                <div>
                  <div className={styles.testimonialName}>Sarah Martinez</div>
                  <div className={styles.testimonialTitle}>Engineering Student</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                ★★★★★
              </div>
              <p className={styles.testimonialText}>
                "Started with a basic printer and built my first drone. Now I have a whole fleet! The community support and documentation are outstanding."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>
                  <User size={24} />
                </div>
                <div>
                  <div className={styles.testimonialName}>Mike Johnson</div>
                  <div className={styles.testimonialTitle}>3D Printing Hobbyists</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className={styles.communitySection}>
        <div className="container">
          <div className={styles.communityContent}>
            <div className={styles.communityText}>
              <h2>Join Our Growing Community</h2>
              <p>
                Connect with fellow builders, share your builds, and get expert advice from our community of engineers and hobbyists.
              </p>
              <div className={styles.communityFeatures}>
                <div className={styles.communityFeature}>
                  <BookOpen size={24} className={styles.communityIcon} />
                  <div>
                    <h3>Expert Guides</h3>
                    <p>Step-by-step build guides and tutorials</p>
                  </div>
                </div>
                <div className={styles.communityFeature}>
                  <Users size={24} className={styles.communityIcon} />
                  <div>
                    <h3>Community Support</h3>
                    <p>Get help from experienced builders</p>
                  </div>
                </div>
                <div className={styles.communityFeature}>
                  <Video size={24} className={styles.communityIcon} />
                  <div>
                    <h3>Fan Videos</h3>
                    <p>Inspiration from our community builds</p>
                  </div>
                </div>
              </div>
              <div className={styles.communityActions}>
                <Link to="/shop" className={styles.ctaPrimary}>
                  Start Building <ArrowRight size={16} />
                </Link>
                <a href="#newsletter" className={styles.ctaSecondary}>
                  Join Newsletter
                </a>
              </div>
            </div>
            <div className={styles.communityImage}>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
                alt="Community of drone builders"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about 3D printed drones</p>
          </div>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>Do I need an expensive 3D printer?</h3>
              <p>
                No! Our designs work with budget printers like the Ender 3. We optimize for reliable printing
                on affordable machines while maintaining flight performance.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>How long does it take to build a drone?</h3>
              <p>
                A complete build typically takes 4-8 hours of printing time plus 2-3 hours for assembly.
                Most builders complete their first drone within a weekend.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>What if I crash my drone?</h3>
              <p>
                That's part of the hobby! Our modular design makes it easy to print replacement parts.
                Most crashes only damage inexpensive plastic components, not electronics.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>Do you provide build instructions?</h3>
              <p>
                Yes! Every product includes detailed PDF guides, video tutorials, and access to our
                community forum for additional support and tips.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>Can I modify the designs?</h3>
              <p>
                Absolutely! Our open-source approach encourages customization. Many builders create
                unique variants and share them with the community.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>What's the flight time like?</h3>
              <p>
                Flight times vary by model and setup, typically 5-15 minutes. Our efficient designs
                maximize flight time while maintaining stability and performance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
