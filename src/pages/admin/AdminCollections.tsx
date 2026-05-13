import SEO from '@/components/SEO'
import { NAV_PRODUCT_CARDS } from '@/lib/catalog'
import styles from './AdminCollections.module.css'

export default function AdminCollections() {
  return <><SEO title="Admin Navigation" noIndex /><div className={styles.page}><section className={styles.header}><span>Navigation</span><h1>Homepage and dropdown control</h1><p>The current premium product destinations are below. A later pass can add drag-and-drop ordering from the database.</p></section><div className={styles.grid}>{NAV_PRODUCT_CARDS.map(card => <article key={card.value} className={styles.card}><strong>{card.label}</strong><p>{card.description}</p><span>{card.href}</span></article>)}</div></div></>
}
