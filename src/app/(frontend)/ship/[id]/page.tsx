import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { findShipCrew, getShipAccess } from '@/lib/shipAccess'
import { ShipClient } from '../ShipClient'
import { ShipNameEditor } from '../ShipNameEditor'
import '../ship.css'

export const metadata = { title: 'Vaisseau — Space Squad' }

export default async function AccessibleShipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipId = Number.parseInt(id, 10)
  if (Number.isNaN(shipId)) redirect('/')

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')

  const access = await getShipAccess(payload, user, shipId)
  if (!access.ship || !access.canRead) redirect('/')
  const ship = access.ship

  const [crew, ownershipCandidates] = await Promise.all([
    findShipCrew(payload, shipId),
    (async () => {
      const characterId = access.character?.id
      const groupId = typeof access.character?.groupe === 'object'
        ? access.character.groupe?.id
        : access.character?.groupe
      if (!access.isOwner || !groupId) return []

      const { docs } = await payload.find({
        collection: 'characters',
        where: { groupe: { equals: groupId } },
        depth: 0,
        limit: 500,
        sort: 'nom',
        select: { id: true, nom: true },
        overrideAccess: true,
      })
      return docs
        .filter((member: any) => String(member.id) !== String(characterId))
        .map((member: any) => ({ id: member.id, nom: member.nom || `Personnage ${member.id}` }))
    })(),
  ])
  return <div className="ss-root ship-root">
    <SiteHeader activePage="ship" />
    <main className="ship-layout">
      <div className="ship-page-header"><div className="ss-container"><nav className="ship-breadcrumb" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/ship">Mes vaisseaux</Link><span aria-hidden="true">›</span><span>{ship.nom}</span></nav><ShipNameEditor shipId={ship.id} initialName={ship.nom} readOnly={!access.canEdit} /><div className="ship-tags"><span className="ship-tag">{ship.modele?.nom ?? 'Modèle indéfini'}</span><span className="ship-tag ship-tag-class">Classe {ship.modele?.chassis?.classe ?? '—'}</span></div></div></div>
      <ShipClient
        ship={JSON.parse(JSON.stringify(ship))}
        crew={JSON.parse(JSON.stringify(crew))}
        ownershipCandidates={JSON.parse(JSON.stringify(ownershipCandidates))}
        canTransferOwnership={access.isOwner}
        readOnly={!access.canEdit}
        viewerCharacterId={access.character?.id ?? null}
        canManageCrew={access.canManageCrew}
        canJoin={access.canJoin}
      />
    </main>
    <SiteFooter />
  </div>
}
