import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeShipAccess } from '@/lib/shipAccess'
import type { OwnedFactionReward } from '@/lib/factionRewards'
import { ShopClient, type ShopItem, type ShopCharacter, type ShopShip } from './ShopClient'
import { shopScopes, type ShopScope } from './shop-sections'
import './shop.css'

const idOf = (value: any): number | null => {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

function summaries(docs: any[]): ShopItem[] {
  return docs.map((doc) => ({
    id: doc.id,
    nom: doc.nom ?? 'Objet sans nom',
    prix: doc.prix ?? null,
    categorie: doc.categorie ?? null,
    categoriePrincipale: doc.categoriePrincipale ?? null,
    sousCategorieArme: doc.sousCategorieArme ?? null,
    sousCategorieArmure: doc.sousCategorieArmure ?? null,
    famille: doc.famille ?? null,
    typeModule: doc.typeModule ?? null,
    type: Array.isArray(doc.type) ? doc.type.join(', ') : doc.type ?? null,
    types: Array.isArray(doc.type) ? doc.type : doc.type ? [doc.type] : [],
    modele: doc.modele ?? null,
    taille: doc.taille ?? null,
    degats: doc.degats ?? doc.valeurDegats ?? null,
    calibre: doc.calibre ?? null,
    effet: doc.effet ?? doc.description ?? null,
    image: doc.image && typeof doc.image === 'object' && typeof doc.image.url === 'string'
      ? { url: doc.image.url, alt: doc.image.alt ?? doc.nom ?? 'Illustration du matériel' }
      : null,
  }))
}

function stackSummary(rows: any[], relationField: string, catalog: Map<string, ShopItem>): { item: ShopItem | null; quantite: number }[] {
  const totals = new Map<string, number>()
  for (const row of rows ?? []) {
    const id = idOf(row[relationField])
    if (id !== null) totals.set(String(id), (totals.get(String(id)) ?? 0) + (Number(row.quantite) || 0))
  }
  return [...totals].map(([id, quantite]) => ({ item: catalog.get(id) ?? null, quantite }))
}

export default async function ShopCatalogPage({ scope }: { scope: ShopScope }) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs: characters } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 2, limit: 1, overrideAccess: true })
  const character: any = characters[0]
  if (!character) redirect('/character')
  const faction = character.affiliation && typeof character.affiliation === 'object'
    ? character.affiliation
    : idOf(character.affiliation) ? await payload.findByID({ collection: 'factions', id: idOf(character.affiliation)!, depth: 0, overrideAccess: true }).catch(() => null) : null
  const factionRewards: OwnedFactionReward[] = (character.inventaireRecompensesFaction ?? []).map((item: any) => ({
    nom: String(item.nom ?? ''), effet: String(item.effet ?? ''), faction: String(item.faction ?? ''), grade: String(item.grade ?? ''),
    id: item.id == null ? undefined : String(item.id),
    typeRecompense: item.typeRecompense === 'acces-armes-ex' ? 'acces-armes-ex' : item.typeRecompense === 'bon-reduction' ? 'bon-reduction' : null,
    pourcentageReduction: item.pourcentageReduction == null ? null : Number(item.pourcentageReduction),
    usage: ['arme-sol', 'arme-espace', 'module-espace'].includes(item.usage) ? item.usage : null,
  }))

  const [weapons, armors, consumables, mods, shipWeapons, shipModules, shipConsumables] = await Promise.all([
    payload.find({ collection: 'weapons', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'armors', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'consumables', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'mods', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ship-weapons', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ship-modules', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
    payload.find({ collection: 'ship-consumables', depth: 1, limit: 500, sort: 'nom', overrideAccess: true }),
  ])
  const catalogs = {
    weapons: summaries(weapons.docs as any[]), armors: summaries(armors.docs as any[]),
    consumables: summaries(consumables.docs as any[]), mods: summaries(mods.docs as any[]),
    shipWeapons: summaries(shipWeapons.docs as any[]), shipModules: summaries(shipModules.docs as any[]),
    shipConsumables: summaries(shipConsumables.docs as any[]),
  }
  const byId = (items: ShopItem[]) => new Map(items.map((item) => [String(item.id), item]))
  const weaponById = byId(catalogs.weapons), armorById = byId(catalogs.armors), consumableById = byId(catalogs.consumables), modById = byId(catalogs.mods)
  const shipWeaponById = byId(catalogs.shipWeapons), shipModuleById = byId(catalogs.shipModules), shipConsumableById = byId(catalogs.shipConsumables)
  const modList = (values: any[]) => (values ?? []).map((value) => modById.get(String(idOf(value)))).filter(Boolean) as ShopItem[]
  const characterData: ShopCharacter = {
    id: character.id, nom: character.nom ?? 'Personnage', konis: character.konis ?? 0,
    factionName: String(faction?.nom ?? ''), inventaireRecompensesFaction: factionRewards,
    inventaireArmes: (character.inventaireArmes ?? []).map((row: any) => ({ item: weaponById.get(String(idOf(row.item))) ?? null, mods: modList(row.mods), munitions: row.munitionsActuelles ?? 0 })),
    inventaireArmures: (character.inventaireArmures ?? []).map((row: any) => ({ item: armorById.get(String(idOf(row.item))) ?? null, mods: modList(row.mods) })),
    inventaireMods: modList(character.inventaireMods),
    inventaire: stackSummary(character.inventaire, 'consommable', consumableById),
    armesEquipees: (['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'] as const).map((slot) => {
      const row = character[slot]
      return row?.item ? { slot, item: weaponById.get(String(idOf(row.item))) ?? null, mods: modList(row.mods) } : null
    }).filter(Boolean) as ShopCharacter['armesEquipees'],
  }

  const requestedShipIds = new Set<number>()
  const currentShipId = idOf(character.vaisseau)
  if (currentShipId) requestedShipIds.add(currentShipId)
  const { docs: ownedShips } = await payload.find({ collection: 'ships', where: { proprietaire: { equals: character.id } }, depth: 1, limit: 100, overrideAccess: true })
  for (const ship of ownedShips as any[]) requestedShipIds.add(ship.id)
  const shipDocs = [...ownedShips as any[]]
  if (currentShipId && !shipDocs.some((ship) => ship.id === currentShipId)) {
    const current = await payload.findByID({ collection: 'ships', id: currentShipId, depth: 1, overrideAccess: true }).catch(() => null)
    if (current) shipDocs.push(current)
  }
  const ships: ShopShip[] = shipDocs.filter((ship) => requestedShipIds.has(ship.id) && computeShipAccess({ ship, character, isAdmin: user.role === 'admin' }).canEdit).map((ship: any) => ({
    id: ship.id, nom: ship.nom ?? 'Vaisseau',
    inventaireArmes: stackSummary(ship.inventaireArmes, 'arme', shipWeaponById),
    inventaireModules: stackSummary(ship.inventaireModules, 'module', shipModuleById),
    inventaireConsommables: stackSummary(ship.inventaireConsommables, 'consommable', shipConsumableById),
  }))

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link>{scope !== 'tout' && <><span aria-hidden="true">›</span><span>{shopScopes[scope].title}</span></>}</nav>
        <h1>{shopScopes[scope].title}</h1><p>{shopScopes[scope].description}</p>
      </div></section>
      <div className="ss-container shop-content">
        <ShopClient character={characterData} ships={ships} catalogs={catalogs} scope={scope} />
      </div>
    </div>
    <SiteFooter />
  </div>
}
