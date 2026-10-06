import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeShipAccess } from '@/lib/shipAccess'
import { listInstalledShipComponents, listShipTransferItems } from '@/lib/shipyard'
import { ShipyardClient } from './ShipyardClient'
import '../shop.css'

export const metadata = { title: 'Chantier naval — Space Squad' }

function idOf(value: any): number | null {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

function modelSummary(model: any) {
  const itemName = (value: any) => value && typeof value === 'object' ? value.nom ?? null : null
  const weapons = (model.armes ?? []).map((entry: any) => ({ nom: itemName(entry.arme), emplacement: entry.emplacement ?? 'pilote' })).filter((entry: any) => entry.nom)
  const optionalModules = (model.modulesOptionnels ?? []).map(itemName).filter(Boolean)
  return {
    id: model.id,
    nom: model.nom ?? 'Modèle de vente',
    prix: model.prix ?? null,
    description: model.description ?? null,
    chassis: itemName(model.chassis),
    classe: model.chassis?.classe ?? null,
    categorie: model.chassis?.categorie ?? null,
    tourelles: model.chassis?.tourelles ?? 0,
    components: [
      ['Générateur', itemName(model.generateur)],
      ['Propulseurs', itemName(model.propulseurs)],
      ['Boucliers', itemName(model.boucliers)],
      ['Système de survie', itemName(model.survie)],
      ...optionalModules.map((name: string) => ['Module optionnel', name]),
      ...weapons.map((weapon: any) => [`Arme · ${weapon.emplacement}`, weapon.nom]),
    ].filter((entry) => entry[1]),
  }
}

function shipSummary(ship: any) {
  const model = ship.modele && typeof ship.modele === 'object' ? ship.modele : null
  return {
    id: ship.id,
    nom: ship.nom ?? `Vaisseau ${ship.id}`,
    proprietaire: idOf(ship.proprietaire),
    modele: model ? { id: model.id, nom: model.nom, prix: model.prix } : null,
    moduleGenerateur: ship.moduleGenerateur,
    modulePropulseurs: ship.modulePropulseurs,
    moduleSurvie: ship.moduleSurvie,
    moduleBoucliers: ship.moduleBoucliers,
    modulesSupplementaires: ship.modulesSupplementaires ?? [],
    armesPilote: ship.armesPilote ?? [],
    armesTourelles: ship.armesTourelles ?? [],
    consommablesVaisseau: ship.consommablesVaisseau ?? [],
    inventaireModules: ship.inventaireModules ?? [],
    inventaireArmes: ship.inventaireArmes ?? [],
    inventaireConsommables: ship.inventaireConsommables ?? [],
    components: listInstalledShipComponents(ship),
    transferItems: listShipTransferItems(ship),
  }
}

export default async function ShipyardPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs: characters } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 1, limit: 1, overrideAccess: true })
  const character: any = characters[0]
  if (!character) redirect('/character')

  const [modelsResult, ownedResult] = await Promise.all([
    payload.find({ collection: 'ship-sale-models', depth: 4, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ships', where: { proprietaire: { equals: character.id } }, depth: 4, limit: 200, sort: 'nom', overrideAccess: true }),
  ])
  const activeShipId = idOf(character.vaisseau)
  const shipsById = new Map<number, any>((ownedResult.docs as any[]).map((ship) => [Number(ship.id), ship]))
  if (activeShipId && !shipsById.has(activeShipId)) {
    const activeShip = await payload.findByID({ collection: 'ships', id: activeShipId, depth: 4, overrideAccess: true }).catch(() => null)
    if (activeShip) shipsById.set(activeShipId, activeShip)
  }
  const writableShips = [...shipsById.values()]
    .filter((ship) => computeShipAccess({ ship, character, isAdmin: user.role === 'admin' }).canEdit)
    .map(shipSummary)

  const data = {
    character: { id: character.id, nom: character.nom ?? 'Personnage', konis: Number(character.konis) || 0 },
    models: (modelsResult.docs as any[]).map(modelSummary),
    ownedShips: (ownedResult.docs as any[]).map(shipSummary),
    writableShips,
    activeShipId,
  }
  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Chantier naval</span></nav>
        <h1>Chantier naval</h1><p>Achetez un modèle de vaisseau, vendez un appareil ou transférez son matériel.</p>
      </div></section>
      <main className="ss-container shop-content"><ShipyardClient {...data} /></main>
    </div>
    <SiteFooter />
  </div>
}
