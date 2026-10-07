import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { shopNavigation } from './shop-sections'
import { factionRewardsTitle } from '@/lib/factionRewards'
import './shop.css'

export const metadata = { title: 'Boutique — Space Squad' }

export default async function ShopPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs: characters } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 1, limit: 1, overrideAccess: true })
  if (!characters[0]) redirect('/character')
  const affiliation = (characters[0] as any).affiliation
  const faction = affiliation && typeof affiliation === 'object' ? affiliation : null
  const factionName = String(faction?.nom ?? '').trim()
  const rewardLinkLabel = factionName ? factionRewardsTitle(factionName) : null

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><span>Boutique</span></nav>
        <div className="shop-heading-title-row">
          <h1>Boutique</h1>
          <Link className="shop-all-link shop-heading-all-link" href="/shop/tout">Tout le catalogue <span aria-hidden="true">→</span></Link>
        </div>
        <p>Choisissez une section pour consulter le matériel et gérer vos transactions.</p>
      </div></section>
      <main className="ss-container shop-content shop-navigation">
        {shopNavigation.map((group) => <section className="shop-navigation-group" key={group.title}>
          <h2>{group.title}</h2>
          <div className="shop-navigation-grid">
            {group.links.map((link) => <Link className="shop-navigation-card" href={link.href} key={link.href}>
              <span>{link.label}</span><span className="shop-navigation-arrow" aria-hidden="true">›</span>
            </Link>)}
          </div>
        </section>)}
        {rewardLinkLabel && <section className="shop-navigation-group"><h2>Votre faction</h2><div className="shop-navigation-grid"><Link className="shop-navigation-card" href="/shop/recompenses"><span>{rewardLinkLabel}</span><span className="shop-navigation-arrow" aria-hidden="true">›</span></Link></div></section>}
      </main>
    </div>
    <SiteFooter />
  </div>
}
