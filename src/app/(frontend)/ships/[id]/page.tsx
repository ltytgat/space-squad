import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ShipClient } from '../../ship/ShipClient'
import '../../ship/ship.css'

export const metadata = { title: 'Fiche vaisseau — Space Squad' }

export default async function AdminShipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipId = Number.parseInt(id, 10)
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user || user.role !== 'admin') redirect('/')
  if (Number.isNaN(shipId)) redirect('/ships')

  let ship: any
  try {
    ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 4 })
  } catch {
    redirect('/ships')
  }
  if (!ship) redirect('/ships')

  const { docs: crew } = await payload.find({
    collection: 'characters',
    where: { vaisseau: { equals: shipId } },
    depth: 1,
    limit: 50,
  })

  return <div className="ss-root ship-root">
    <SiteHeader activePage="ships" />
    <main className="ship-layout">
      <div className="ship-page-header">
        <div className="ss-container">
            <nav className="ship-breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">›</span>
            <Link href="/ships">Vaisseaux</Link>
            <span aria-hidden="true">›</span>
            <span>{ship.nom}</span>
          </nav>
          <h1 className="ship-name">{ship.nom}</h1>
          <div className="ship-tags"><span className="ship-tag">{ship.modele?.nom ?? 'Modèle indéfini'}</span><span className="ship-tag ship-tag-class">Classe {ship.modele?.chassis?.classe ?? '—'}</span></div>
        </div>
      </div>
      <ShipClient ship={JSON.parse(JSON.stringify(ship))} crew={JSON.parse(JSON.stringify(crew))} isAdmin />
    </main>
    <SiteFooter />
  </div>
}
