import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeRank } from '@/lib/rankSystem'
import { computeShipAccess } from '@/lib/shipAccess'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { GarageClient } from './GarageClient'
import '../shop.css'

export const metadata = { title: 'Garage — Space Squad' }

function idOf(value: any): number | null {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

function modelSummary(model: any) {
  const variant = model.variante && typeof model.variante === 'object' ? model.variante : null
  const image = model.image && typeof model.image === 'object' && typeof model.image.url === 'string'
    ? { url: model.image.url, alt: model.image.alt ?? model.nom ?? 'Image du véhicule' }
    : null
  const options = [
    model.toutTerrain ? 'Tout terrain' : null,
    model.supportArme ? "Support d’arme" : null,
    Number(model.turboBonus) > 0 ? `Turbo +${model.turboBonus}` : null,
    model.tourelleClasseMax ? `Tourelle · vaisseau ${model.tourelleClasseMax}` : null,
    Number(model.remorqueIndicePoids) > 0 ? `Remorque · poids ${model.remorqueIndicePoids}` : null,
  ].filter((option): option is string => Boolean(option))

  return {
    id: model.id,
    nom: model.nom ?? 'Modèle de véhicule',
    prix: model.prix ?? null,
    classe: variant?.classe ?? null,
    varianteId: idOf(variant),
    variante: variant?.nom ?? 'Autres véhicules',
    position: variant?.position ?? null,
    image,
    places: Number(model.places) || 0,
    emportsArmesPersonnages: Number(model.emportsArmesPersonnages) || 0,
    blindageMax: Number(model.blindageMax) || 0,
    bouclierMax: Number(model.bouclierMax) || 0,
    rechargeBouclier: Number(model.rechargeBouclier) || 0,
    mouvement: Number(model.mouvement) || 0,
    options,
  }
}

function vehicleSummary(vehicle: any) {
  const model = vehicle.modele && typeof vehicle.modele === 'object' ? vehicle.modele : null
  const weapon = vehicle.armeTourelle && typeof vehicle.armeTourelle === 'object' ? vehicle.armeTourelle : null
  const magazine = vehicle.chargeurRelie && typeof vehicle.chargeurRelie === 'object' ? vehicle.chargeurRelie : null
  const weaponId = idOf(vehicle.armeTourelle)
  const magazineId = idOf(vehicle.chargeurRelie)
  return {
    id: vehicle.id,
    nom: vehicle.nom ?? `Véhicule ${vehicle.id}`,
    modelName: model?.nom ?? 'Modèle inconnu',
    modelPrice: model?.prix ?? null,
    blindageActuel: Number(vehicle.blindageActuel) || 0,
    blindageMax: Number(model?.blindageMax) || 0,
    weaponName: weapon?.nom ?? (weaponId ? `Arme #${weaponId}` : null),
    magazineName: magazine?.nom ?? (magazineId ? `Chargeur #${magazineId}` : null),
    ammunition: Number(vehicle.munitionsActuelles) || 0,
  }
}

export default async function GaragePage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const character: any = await getActiveCharacter(payload, user, { depth: 1 })
  if (!character) redirect('/character')
  if (!isCharacterCreationComplete(character)) redirect('/character')

  const [modelsResult, vehiclesResult] = await Promise.all([
    payload.find({ collection: 'vehicle-sale-models', depth: 2, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'vehicles', where: { proprietaire: { equals: character.id } }, depth: 2, limit: 500, sort: 'nom', overrideAccess: true }),
  ])

  const activeShipId = idOf(character.vaisseau)
  let activeShipCanReceive = false
  let activeShipName: string | null = null
  if (activeShipId) {
    const activeShip = await payload.findByID({ collection: 'ships', id: activeShipId, depth: 1, overrideAccess: true }).catch(() => null) as any
    if (activeShip) {
      activeShipName = activeShip.nom ?? `Vaisseau ${activeShip.id}`
      activeShipCanReceive = computeShipAccess({ ship: activeShip, character, isAdmin: user.role === 'admin' }).canEdit
    }
  }

  const data = {
    character: {
      id: character.id,
      nom: character.nom ?? 'Personnage',
      konis: Number(character.konis) || 0,
      rang: computeRank(Number(character.pointsDeRang) || 0).level,
    },
    models: (modelsResult.docs as any[]).map(modelSummary),
    vehicles: (vehiclesResult.docs as any[]).map(vehicleSummary),
    activeShipName,
    activeShipCanReceive,
  }

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Garage</span></nav>
        <h1>Garage</h1><p>Achetez un véhicule ou revendez-en un pour récupérer une partie de sa valeur.</p>
      </div></section>
      <main className="ss-container shop-content"><GarageClient {...data} /></main>
    </div>
    <SiteFooter />
  </div>
}
