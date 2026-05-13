import { Link, useLocation } from 'react-router-dom'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getDefaultSiteContent } from '@/lib/siteContent'
import styles from './Footer.module.css'

export default function Footer() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: globalContent } = useSiteContent('global_store', previewMode)
  const content = globalContent ?? getDefaultSiteContent('global_store')
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <img src="/brand/wingxtra-logo.svg" alt="Wingxtra" className={styles.logoImg} />
            </div>
            <p className={styles.tagline}>{content.footer.tagline}</p>
          </div>

          <div className={styles.col}>
            <h4>{content.footer.shopHeading}</h4>
            <Link to="/shop">All Products</Link>
            <Link to="/drones">Wingxtra Aircraft</Link>
            <Link to="/collection/additive_manufacturing">Additive Manufacturing</Link>
            <Link to="/collection/propulsion_systems">Propulsion Systems</Link>
            <Link to="/collection/avionics_flight_control">Avionics & Flight Control</Link>
          </div>

          <div className={styles.col}>
            <h4>{content.footer.accountHeading}</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
          </div>

          <div className={styles.col}>
            <h4>{content.footer.supportHeading}</h4>
            <a href={`mailto:${content.footer.supportEmail}`}>{content.footer.supportEmail}</a>
            <Link to="/shop">{content.footer.documentationLabel}</Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>{`(c) ${new Date().getFullYear()} ${content.footer.copyrightText}`}</p>
          <div className={styles.badges}>
            {content.footer.badges.map(badge => (
              <span key={badge} className={styles.badge}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

