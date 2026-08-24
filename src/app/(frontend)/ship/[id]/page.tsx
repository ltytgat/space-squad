import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ShipClient } from '../ShipClient'
import '../ship.css'

export const metadata = { title: 'Vaisseau — Space Squad' }

export default async function AccessibleShipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipId = Number.parseInt(id, 10)
  if (Number.isNaN(shipId)) redirect('/')

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')

  const { docs: characters } = await payload.find({
    collection: 'characters', where: { user: { equals: user.id } }, depth: 1, limit: 1, overrideAccess: true,
  })
  const character = characters[0] as any
  if (!character && user.role !== 'admin') redirect('/')

  let ship: any
  try { ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 4 }) } catch { redirect('/') }
  if (!ship) redirect('/')

  let canEdit = user.role === 'admin'
  const assignedShipId = typeof character?.vaisseau === 'object' ? character.vaisseau?.id : character?.vaisseau
  if (assignedShipId === shipId) canEdit = true

  if (!canEdit && character?.groupe) {
    const groupId = typeof character.groupe === 'object' ? character.groupe.id : character.groupe
    const ownerId = typeof ship.proprietaire === 'object' ? ship.proprietaire?.id : ship.proprietaire
    if (ownerId) {
      const owner = await payload.findByID({ collection: 'characters', id: ownerId, depth: 0, overrideAccess: true }) as any
      const ownerGroupId = typeof owner?.groupe === 'object' ? owner.groupe?.id : owner?.groupe
      canEdit = Boolean(owner && String(ownerGroupId) === String(groupId))
    }
  }
  if (!canEdit && user.role !== 'admin') redirect('/')

  const { docs: crew } = await payload.find({ collection: 'characters', where: { vaisseau: { equals: shipId } }, depth: 1, limit: 50 })
  return <div className="ss-root ship-root">
    <SiteHeader activePage="ship" />
    <main className="ship-layout">
      <div className="ship-page-header"><div className="ss-container"><nav className="ship-breadcrumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">›</span><a href="/character">Personnage</a><span aria-hidden="true">›</span><span>{ship.nom}</span></nav><h1 className="ship-name">{ship.nom}</h1></div></div>
      <ShipClient ship={JSON.parse(JSON.stringify(ship))} crew={JSON.parse(JSON.stringify(crew))} readOnly={!canEdit} />
    </main>
    <SiteFooter />
  </div>
}
