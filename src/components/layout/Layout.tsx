import { type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getDefaultSiteContent } from '@/lib/siteContent'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const previewMode = location.search.includes('preview=draft') ? 'draft' : 'published'
  const { data: globalContent } = useSiteContent('global_store', previewMode)
  const content = globalContent ?? getDefaultSiteContent('global_store')
  const shellStyle = {
    '--store-bg': content.theme.backgroundColor,
    '--store-surface': content.theme.surfaceColor,
    '--store-accent': content.theme.accentColor,
    '--store-accent-soft': content.theme.accentSoftColor,
    '--store-text': content.theme.textColor,
    '--store-muted': content.theme.mutedTextColor,
    '--store-hero-overlay': content.theme.heroOverlayColor,
    '--store-card-radius': content.theme.cardRadius,
    background: content.theme.backgroundColor,
    color: content.theme.textColor,
  } as CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', ...shellStyle }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
