import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ShipClient } from './ShipClient'
import './ship.css'

export const metadata = { title: 'Mon vaisseau — Space Squad' }

export default async function ShipPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 0, limit: 1 })
  const character = docs[0] as any
  const shipId = typeof character?.vaisseau === 'object' ? character.vaisseau?.id : character?.vaisseau
  if (!shipId) return <div className="ss-root ship-root"><SiteHeader activePage="ship" /><main className="ship-content ss-container"><h1 className="ship-name">Aucun vaisseau assigné</h1><p className="ship-empty-hint">Votre personnage n&apos;est pas encore assigné à un vaisseau.</p></main><SiteFooter /></div>
  const [ship, crewResult] = await Promise.all([
    payload.findByID({ collection: 'ships', id: shipId, depth: 4 }),
    payload.find({ collection: 'characters', where: { vaisseau: { equals: shipId } }, depth: 1, limit: 50 }),
  ])
  const model = typeof ship.modele === 'object' ? ship.modele : null
  const modelChassis = typeof model?.chassis === 'object' ? model.chassis : null
  return <div className="ss-root ship-root"><SiteHeader activePage="ship" /><main className="ship-layout"><div className="ship-page-header"><div className="ss-container"><nav className="ship-breadcrumb" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><span>Mon vaisseau</span></nav><h1 className="ship-name">{ship.nom}</h1><div className="ship-tags"><span className="ship-tag">{model?.nom ?? 'Modèle indéfini'}</span><span className="ship-tag ship-tag-class">Classe {modelChassis?.classe ?? '—'}</span></div></div></div><ShipClient ship={JSON.parse(JSON.stringify(ship))} crew={JSON.parse(JSON.stringify(crewResult.docs))} isAdmin={user.role === 'admin'} /></main><SiteFooter /></div>
}
