import { Link } from 'react-router-dom'
import { ArrowRight, Download, Package, Cpu, Shield, Zap } from 'lucide-react'
import SEO from '@/components/SEO'
import ProductCard from '@/components/products/ProductCard'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { formatCurrency } from '@/lib/utils'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { data: products } = useProducts()
  const { data: categories } = useCategories()
  const featured = products?.slice(0, 4) ?? []

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
            src="https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=1600"
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
    </>
  )
}
