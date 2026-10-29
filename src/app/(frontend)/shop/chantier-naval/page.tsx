import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeShipAccess } from '@/lib/shipAccess'
import { computeRank } from '@/lib/rankSystem'
import { listInstalledShipComponents, listShipTransferItems } from '@/lib/shipyard'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { ShipyardClient } from './ShipyardClient'
import '../shop.css'
import { adjustedShopPrice, getShopPolicyForCharacter, resolveShopPolicy, shopPolicyPaths } from '@/lib/groupShopPolicy'

export const metadata = { title: 'Chantier naval — Space Squad' }

function idOf(value: any): number | null {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

function modelSummary(model: any, policy: any) {
  const itemName = (value: any) => value && typeof value === 'object' ? value.nom ?? null : null
  const weapons = (model.armes ?? []).map((entry: any) => ({ nom: itemName(entry.arme), emplacement: entry.emplacement ?? 'pilote' })).filter((entry: any) => entry.nom)
  const optionalModules = (model.modulesOptionnels ?? []).map(itemName).filter(Boolean)
  return {
    id: model.id,
    nom: model.nom ?? 'Modèle de vente',
    prix: adjustedShopPrice(model.prix ?? null, resolveShopPolicy(policy, shopPolicyPaths('ship-sale-models', model)).percentage),
    policyPercentage: resolveShopPolicy(policy, shopPolicyPaths('ship-sale-models', model)).percentage,
    available: resolveShopPolicy(policy, shopPolicyPaths('ship-sale-models', model)).available,
    description: model.description ?? null,
    image: model.image && typeof model.image === 'object' && typeof model.image.url === 'string'
      ? { url: model.image.url, alt: model.image.alt ?? model.nom ?? 'Image du vaisseau' }
      : null,
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
    details: [
      ['Châssis', itemName(model.chassis)],
      ['Classe', model.chassis?.classe],
      ['Catégorie', model.chassis?.categorie],
      ['Blindage', model.chassis?.blindage],
      ['Esquive de base', model.chassis?.esquiveBase],
      ['Tourelles', model.chassis?.tourelles],
      ['Points d’emport pilote', model.chassis?.pointsEmportPilote],
      ['Points d’emport tourelles', model.chassis?.pointsEmportTourelles],
      ['Modules supplémentaires', model.chassis?.modulesSupplementaires],
      ['Emplacements consommables', model.chassis?.consommables],
      ['Équipements inclus', [['Générateur', itemName(model.generateur)], ['Propulseurs', itemName(model.propulseurs)], ['Boucliers', itemName(model.boucliers)], ['Système de survie', itemName(model.survie)], ...optionalModules.map((name: string) => ['Module optionnel', name]), ...weapons.map((weapon: any) => [weapon.emplacement, weapon.nom])].map(([kind, name]: [string, string]) => `${kind} : ${name}`).join(' · ')],
      ['Description', model.description],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => ({ label: String(label), value: String(value) })),
  }
}

function shipSummary(ship: any, policy: any, componentCatalog: Map<string, any>) {
  const model = ship.modele && typeof ship.modele === 'object' ? ship.modele : null
  const components = listInstalledShipComponents(ship).map((component) => {
    const collection = component.kind === 'module' ? 'ship-modules' : 'ship-weapons'
    const doc = componentCatalog.get(`${collection}:${component.itemId}`)
    if (!doc) return component
    const percentage = resolveShopPolicy(policy, shopPolicyPaths(collection, doc)).percentage
    return { ...component, prix: adjustedShopPrice(component.prix, percentage) }
  })
  const modelPercentage = model
    ? model.atelierPrive
      ? resolveShopPolicy(policy, ['atelier', 'atelier/vaisseau']).percentage
      : resolveShopPolicy(policy, shopPolicyPaths('ship-sale-models', model)).percentage
    : 0
  const modelBasePrice = model?.atelierPrive ? model.atelierPrixAchat ?? model.prix : model?.prix
  return {
    id: ship.id,
    nom: ship.nom ?? `Vaisseau ${ship.id}`,
    proprietaire: idOf(ship.proprietaire),
    modele: model ? { id: model.id, nom: model.nom, prix: adjustedShopPrice(modelBasePrice, modelPercentage) } : null,
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
    components,
    transferItems: listShipTransferItems(ship),
  }
}

export default async function ShipyardPage({ searchParams }: {
  searchParams: Promise<{ tab?: string; sourceShipId?: string }>
}) {
  const { tab, sourceShipId } = await searchParams
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const character: any = await getActiveCharacter(payload, user, { depth: 1 })
  if (!character) redirect('/character')
  if (!isCharacterCreationComplete(character)) redirect('/character')
  const shopPolicy = await getShopPolicyForCharacter(payload, character)

  const [modelsResult, ownedResult, weaponsResult, modulesResult] = await Promise.all([
    payload.find({ collection: 'ship-sale-models', where: { atelierPrive: { equals: false } }, depth: 4, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ships', where: { proprietaire: { equals: character.id } }, depth: 4, limit: 200, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ship-weapons', depth: 0, limit: 1000, overrideAccess: true }),
    payload.find({ collection: 'ship-modules', depth: 0, limit: 1000, overrideAccess: true }),
  ])
  const componentCatalog = new Map<string, any>([
    ...(weaponsResult.docs as any[]).map((item) => [`ship-weapons:${item.id}`, item] as [string, any]),
    ...(modulesResult.docs as any[]).map((item) => [`ship-modules:${item.id}`, item] as [string, any]),
  ])
  const activeShipId = idOf(character.vaisseau)
  const shipsById = new Map<number, any>((ownedResult.docs as any[]).map((ship) => [Number(ship.id), ship]))
  const requestedSourceId = Number.parseInt(sourceShipId ?? '', 10)
  const additionalShipIds = new Set([activeShipId, requestedSourceId].filter(
    (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0,
  ))
  for (const additionalShipId of additionalShipIds) {
    if (shipsById.has(additionalShipId)) continue
    const ship = await payload.findByID({ collection: 'ships', id: additionalShipId, depth: 4, overrideAccess: true }).catch(() => null)
    if (ship) shipsById.set(additionalShipId, ship)
  }
  const writableShips = [...shipsById.values()]
    .filter((ship) => computeShipAccess({ ship, character, isAdmin: user.role === 'admin' }).canEdit)
    .map((ship) => shipSummary(ship, shopPolicy, componentCatalog))

  const data = {
    character: { id: character.id, nom: character.nom ?? 'Personnage', konis: Number(character.konis) || 0, rang: computeRank(Number(character.pointsDeRang) || 0).level },
    models: (modelsResult.docs as any[]).filter((model) => resolveShopPolicy(shopPolicy, shopPolicyPaths('ship-sale-models', model)).available).map((model) => modelSummary(model, shopPolicy)),
    ownedShips: (ownedResult.docs as any[]).map((ship) => shipSummary(ship, shopPolicy, componentCatalog)),
    writableShips,
    activeShipId,
  }
  const initialSourceShipId = sourceShipId ? Number.parseInt(sourceShipId, 10) : null
  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Chantier naval</span></nav>
        <h1>Chantier naval</h1><p>Achetez un modèle de vaisseau, vendez un appareil ou transférez son matériel.</p>
      </div></section>
      <main className="ss-container shop-content"><ShipyardClient {...data} initialTab={tab === 'transfer' ? 'transfer' : 'buy'} initialSourceShipId={Number.isFinite(initialSourceShipId) ? initialSourceShipId : null} /></main>
    </div>
    <SiteFooter />
  </div>
}
