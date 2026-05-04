import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>▲</span>
              <span>VOLANT</span>
            </div>
            <p className={styles.tagline}>
              Precision-engineered drone components and 3D printed parts for builders who demand performance.
            </p>
          </div>

          <div className={styles.col}>
            <h4>Shop</h4>
            <Link to="/shop">All Products</Link>
            <Link to="/shop/drone-frames">Drone Frames</Link>
            <Link to="/shop/motors">Motors</Link>
            <Link to="/shop/escs">ESCs</Link>
            <Link to="/shop/carbon-fiber-parts">Carbon Fiber</Link>
          </div>

          <div className={styles.col}>
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
          </div>

          <div className={styles.col}>
            <h4>Support</h4>
            <a href="mailto:support@volant.store">support@volant.store</a>
            <Link to="/shop">Documentation</Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} VOLANT Store. All rights reserved.</p>
          <div className={styles.badges}>
            <span className={styles.badge}>FDM</span>
            <span className={styles.badge}>MJF</span>
            <span className={styles.badge}>Carbon Fiber</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
