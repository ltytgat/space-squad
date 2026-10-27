import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { findShipCrew, getShipAccess } from '@/lib/shipAccess'
import { ShipClient } from '../../ship/ShipClient'
import { ShipNameEditor } from '../../ship/ShipNameEditor'
import '../../ship/ship.css'
import { atelierShipSpecializationTags } from '@/lib/atelier'
import { shipModelDisplayName } from '@/lib/shipyard'

export const metadata = { title: 'Fiche vaisseau — Space Squad' }

export default async function AdminShipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipId = Number.parseInt(id, 10)
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user) redirect('/login')
  if (Number.isNaN(shipId)) redirect('/')

  const access = await getShipAccess(payload, user, shipId)
  if (!access.ship || !access.canRead) redirect(access.isAdmin ? '/ships' : '/')
  const ship = access.ship
  const shipImage = [ship.image, ship.modele?.image, ship.modele?.chassis?.image].find(
    (image: any) => image && typeof image === 'object' && typeof image.url === 'string',
  ) as { url: string; alt?: string | null } | undefined
  const typeTagLabels: Record<string, string> = { combat: 'Combat', exploration: 'Exploration', transport: 'Transport' }
  const typeTags = atelierShipSpecializationTags(ship.modele?.chassis ?? {})
  const isCustom = Boolean(ship.atelierPersonnalise || ship.modele?.atelierPrive || ship.modele?.chassis?.atelierPrive)

  const crew = await findShipCrew(payload, shipId)

  return <div className="ss-root ship-root">
    <SiteHeader activePage="ships" />
    <main className="ship-layout">
      <div className="ship-page-header">
        <div className="ss-container">
            <nav className="ship-breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">›</span>
            {(access.isAdmin || access.isMJ) && <>
              <Link href="/ships">Vaisseaux</Link>
              <span aria-hidden="true">›</span>
            </>}
            <span>{ship.nom}</span>
          </nav>
          <div className={shipImage?.url ? 'ship-header-content ship-header-has-image' : 'ship-header-content'}>
            <div className="ship-header-details">
              <ShipNameEditor shipId={ship.id} initialName={ship.nom} readOnly={!access.canEdit} />
              <div className="ship-tags"><span className="ship-tag">{shipModelDisplayName(ship.modele)}</span><span className="ship-tag ship-tag-class">Classe {ship.modele?.chassis?.classe ?? '—'}</span>{isCustom && <span className="ship-tag">Custom</span>}{typeTags.map((tag) => <span className="ship-tag" key={tag}>{typeTagLabels[tag] ?? tag}</span>)}</div>
            </div>
            {shipImage?.url && (
              <figure className="ship-header-image">
                <img src={shipImage.url} alt={shipImage.alt || ship.nom} />
              </figure>
            )}
          </div>
        </div>
      </div>
      <ShipClient
        ship={JSON.parse(JSON.stringify(ship))}
        crew={JSON.parse(JSON.stringify(crew))}
        readOnly={!access.canEdit}
        viewerCharacterId={access.character?.id ?? null}
        canManageCrew={access.canManageCrew}
        canJoin={access.canJoin}
      />
    </main>
    <SiteFooter />
  </div>
}
