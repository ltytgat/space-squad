import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getShipAccess } from '@/lib/shipAccess'
import { getVehicleAccess, vehicleRelationId } from '@/lib/vehicleAccess'
import { VehicleClient } from './VehicleClient'
import '../vehicles.css'

export const metadata = { title: 'Fiche véhicule — Space Squad' }

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const vehicleId = Number(rawId)
  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) notFound()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const access = await getVehicleAccess(payload, user, vehicleId, 3)
  if (!access.vehicle || !access.canRead) notFound()

  let activeShip: any = null
  let canManageEquipment = false
  if (access.canEdit) {
    const ownerCharacterId = vehicleRelationId(access.vehicle.proprietaire)
    const ownerCharacter = access.isOwner
      ? access.character
      : ownerCharacterId
        ? await payload.findByID({ collection: 'characters', id: ownerCharacterId, depth: 0, overrideAccess: true }).catch(() => null)
        : null
    const activeShipId = vehicleRelationId(ownerCharacter?.vaisseau)
    if (activeShipId) {
      activeShip = await payload.findByID({
        collection: 'ships', id: activeShipId, depth: 3, overrideAccess: true,
      }).catch(() => null)
      canManageEquipment = Boolean(activeShip && (await getShipAccess(payload, user, activeShipId, { depth: 3 })).canEdit)
    }
  }

  const model = access.vehicle.modele && typeof access.vehicle.modele === 'object' ? access.vehicle.modele : null
  const owner = access.vehicle.proprietaire && typeof access.vehicle.proprietaire === 'object' ? access.vehicle.proprietaire : null
  const shipInventory = canManageEquipment ? activeShip : null
  const weaponStock = (shipInventory?.inventaireArmes ?? []).map((entry: any) => {
    const weapon = entry.arme && typeof entry.arme === 'object' ? entry.arme : null
    return weapon && Number(entry.quantite) > 0 ? { ...weapon, quantity: Number(entry.quantite) } : null
  }).filter(Boolean)
  const ammoStock = (shipInventory?.inventaireConsommables ?? []).map((entry: any) => {
    const ammo = entry.consommable && typeof entry.consommable === 'object' ? entry.consommable : null
    return ammo && Number(entry.quantite) > 0 ? { ...ammo, quantity: Number(entry.quantite) } : null
  }).filter(Boolean)

  return <div className="ss-root vehicle-root">
    <SiteHeader activePage="vehicles" />
    <main className="vehicle-layout">
      <header className="vehicle-page-header"><div className="ss-container">
        <nav className="vehicle-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/vehicles">Véhicules</Link><span aria-hidden="true">›</span><span>{access.vehicle.nom}</span></nav>
        <span className="vehicle-eyebrow">{model?.variante?.nom ?? 'Véhicule'}</span>
        <h1>{access.vehicle.nom}</h1>
        <p>{model?.nom ?? 'Modèle inconnu'}{owner?.nom ? ` · Propriété de ${owner.nom}` : ''}</p>
      </div></header>
      <VehicleClient
        vehicle={JSON.parse(JSON.stringify(access.vehicle))}
        ownerName={owner?.nom ?? null}
        canEdit={access.canEdit}
        canManageEquipment={canManageEquipment}
        activeShipName={activeShip?.nom ?? null}
        weapons={JSON.parse(JSON.stringify(weaponStock))}
        ammunition={JSON.parse(JSON.stringify(ammoStock))}
      />
    </main>
    <SiteFooter />
  </div>
}
