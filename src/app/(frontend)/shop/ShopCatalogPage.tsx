import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeShipAccess } from '@/lib/shipAccess'
import { computeRank } from '@/lib/rankSystem'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { getActiveCharacter } from '@/lib/activeCharacter'
import type { OwnedFactionReward } from '@/lib/factionRewards'
import { ShopClient, type ShopItem, type ShopCharacter, type ShopShip } from './ShopClient'
import type { ShopItemDetail } from './ShopItemDetails'
import { shopScopes, type ShopScope } from './shop-sections'
import { adjustedShopPrice, getShopPolicyForCharacter, resolveShopPolicy, shopPolicyPaths } from '@/lib/groupShopPolicy'
import './shop.css'

const idOf = (value: any): number | null => {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

const detailLabels: Record<string, string> = {
  fabricant: 'Fabricant', categorie: 'Catégorie', famille: 'Famille', type: 'Type', types: 'Types',
  categoriePrincipale: 'Catégorie principale', sousCategorieArme: 'Arme compatible', sousCategorieArmure: 'Armure compatible',
  typeModule: 'Type de module', modele: 'Modèle', taille: 'Taille', rang: 'Rang requis',
  valeurDegats: 'Dégâts', degats: 'Dégâts', poids: 'Poids', forceMinimum: 'Fo minimum', porteeFixe: 'Portée', projectilesParTir: 'Projectiles par tir',
  valeurChauffe: 'Chauffe', courtePortee: 'Portée courte', modCourtePortee: 'Modificateur courte portée',
  moyennePortee: 'Portée moyenne', modMoyennePortee: 'Modificateur moyenne portée', paliersSniper: 'Paliers de portée',
  trancheMalusLonguePortee: 'Tranche de malus longue portée', malusParTranche: 'Malus par tranche',
  tailleChargeur: 'Taille du chargeur', tempsRechargement: 'Temps de rechargement', zoneEffet: 'Zone d’effet', tempsRefroidissement: 'Refroidissement',
  valeurArmurePhysique: 'Armure physique', valeurBouclier: 'Bouclier', valeurRupture: 'Rupture', stockage: 'Stockage',
  modificateur: 'Modificateur', set: 'Set d’armure', tailleConsommable: 'Taille', tailleObjet: 'Taille',
  typeMunition: 'Type de munition', roleSpecialRequis: 'Rôle spécial requis', effet: 'Effet', description: 'Description',
  epreuve: 'Épreuve', modificateurEpreuve: 'Modificateur d’épreuve', cooldown: 'Cooldown', restriction: 'Restriction',
  consommation: 'Consommation', puissance: 'Puissance', modificateurs: 'Modificateurs', bouclierMax: 'Boucliers max',
  cooldownBouclier: 'Cooldown bouclier', rechargeBouclier: 'Recharge', reparations: 'Réparations', malusPoids: 'Malus de poids',
  blindageBonus: 'Bonus de blindage', capacite: 'Capacité', consommationParPersonne: 'Consommation par personne',
  nombrePlaces: 'Nombre de places', consommationSupplementaire: 'Consommation supplémentaire', portee: 'Portée',
  bonusDegatsPourcentage: 'Bonus de dégâts', bonusDegatsPar100MJ: 'Bonus de dégâts par 100 MJ', mjMaxUtilisable: 'MJ maximum utilisables',
  angleTir: 'Angle de tir', quantiteEquipable: 'Quantité équipable', calibre: 'Calibre', bonus: 'Bonus',
  chauffe: 'Chauffe', ballesParSalve: 'Balles par salve', chargeur: 'Chargeur', distance: 'Distance / champ d’action',
  bonusBlindage: 'Bonus de blindage en joute', pointsEmport: 'Points d’emport',
}

function labelForDetail(key: string) {
  return detailLabels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toLocaleUpperCase('fr'))
}

function detailValue(value: any): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.map(detailValue).filter(Boolean).join(' · ')
  if (typeof value === 'object') {
    if (typeof value.nom === 'string') return value.nom
    return Object.entries(value)
      .filter(([key, child]) => !['id', 'createdAt', 'updatedAt'].includes(key) && child !== null && child !== undefined && child !== '')
      .map(([key, child]) => `${labelForDetail(key)} : ${detailValue(child)}`)
      .join(' · ')
  }
  return String(value)
}

function summaries(docs: any[], collection: string, policy: any): ShopItem[] {
  return docs.map((doc) => ({
    id: doc.id,
    nom: doc.nom ?? 'Objet sans nom',
    prix: adjustedShopPrice(doc.prix ?? null, resolveShopPolicy(policy, shopPolicyPaths(collection, doc)).percentage),
    policyPercentage: resolveShopPolicy(policy, shopPolicyPaths(collection, doc)).percentage,
    available: resolveShopPolicy(policy, shopPolicyPaths(collection, doc)).available,
    rang: doc.rang ?? null,
    categorie: doc.categorie ?? null,
    categoriePrincipale: doc.categoriePrincipale ?? null,
    sousCategorieArme: doc.sousCategorieArme ?? null,
    sousCategorieArmure: doc.sousCategorieArmure ?? null,
    setId: doc.set && typeof doc.set === 'object' ? Number(doc.set.id) : doc.set == null ? null : Number(doc.set),
    setNom: doc.set && typeof doc.set === 'object' && typeof doc.set.nom === 'string' ? doc.set.nom : null,
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
    details: Object.entries(doc)
      .filter(([key, value]) => !['id', 'nom', 'prix', 'image', 'createdAt', 'updatedAt', '_status'].includes(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]): ShopItemDetail => ({ label: labelForDetail(key), value: detailValue(value) }))
      .filter(({ value }) => value !== ''),
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
  const character: any = await getActiveCharacter(payload, user, { depth: 2 })
  if (!character) redirect('/character')
  if (!isCharacterCreationComplete(character)) redirect('/character')
  const faction = character.affiliation && typeof character.affiliation === 'object'
    ? character.affiliation
    : idOf(character.affiliation) ? await payload.findByID({ collection: 'factions', id: idOf(character.affiliation)!, depth: 0, overrideAccess: true }).catch(() => null) : null
  const factionRewards: OwnedFactionReward[] = (character.inventaireRecompensesFaction ?? []).map((item: any) => ({
    nom: String(item.nom ?? ''), effet: String(item.effet ?? ''), faction: String(item.faction ?? ''), grade: String(item.grade ?? ''),
    id: item.id == null ? undefined : String(item.id),
    typeRecompense: item.typeRecompense === 'acces-armes-ex' ? 'acces-armes-ex' : item.typeRecompense === 'acces-atelier' ? 'acces-atelier' : item.typeRecompense === 'bon-reduction' ? 'bon-reduction' : null,
    pourcentageReduction: item.pourcentageReduction == null ? null : Number(item.pourcentageReduction),
    usage: ['arme-sol', 'arme-espace', 'module-espace'].includes(item.usage) ? item.usage : null,
  }))
  const shopPolicy = await getShopPolicyForCharacter(payload, character)

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
    weapons: summaries(weapons.docs as any[], 'weapons', shopPolicy), armors: summaries(armors.docs as any[], 'armors', shopPolicy),
    consumables: summaries(consumables.docs as any[], 'consumables', shopPolicy), mods: summaries(mods.docs as any[], 'mods', shopPolicy),
    shipWeapons: summaries(shipWeapons.docs as any[], 'ship-weapons', shopPolicy), shipModules: summaries(shipModules.docs as any[], 'ship-modules', shopPolicy),
    shipConsumables: summaries(shipConsumables.docs as any[], 'ship-consumables', shopPolicy),
  }
  const byId = (items: ShopItem[]) => new Map(items.map((item) => [String(item.id), item]))
  const weaponById = byId(catalogs.weapons), armorById = byId(catalogs.armors), consumableById = byId(catalogs.consumables), modById = byId(catalogs.mods)
  const shipWeaponById = byId(catalogs.shipWeapons), shipModuleById = byId(catalogs.shipModules), shipConsumableById = byId(catalogs.shipConsumables)
  const modList = (values: any[]) => (values ?? []).map((value) => modById.get(String(idOf(value)))).filter(Boolean) as ShopItem[]
  const customEquipmentIds = (character.inventaireEquipementsCustom ?? []).map(idOf).filter((id: number | null): id is number => id !== null)
  const customEquipmentDocs = customEquipmentIds.length
    ? (await payload.find({ collection: 'custom-equipment', where: { id: { in: customEquipmentIds } }, depth: 2, limit: 500, overrideAccess: true })).docs as any[]
    : []
  const customWeapons: ShopCharacter['inventaireArmes'] = customEquipmentDocs
    .filter((item) => item.categorieEquipement === 'arme')
    .map((customItem) => {
      const properties = customItem.proprietesFigees && typeof customItem.proprietesFigees === 'object' ? customItem.proprietesFigees : {}
      const weapon = summaries([{
        ...properties,
        id: customItem.id,
        nom: customItem.nom,
        prix: customItem.prixAchat,
        categorie: customItem.categorie ?? properties.categorie,
        type: typeof customItem.typeArme === 'string' ? customItem.typeArme.split(',').filter(Boolean) : properties.type,
        image: customItem.armeSource?.image ?? properties.image,
      }], 'custom-equipment', shopPolicy)[0]
      const sourceCollection = customItem.categorieEquipement === 'arme' ? 'weapons' : 'armors'
      const sourceId = idOf(customItem.armeSource ?? customItem.armureSource)
      const sourceItem = customItem.armeSource && typeof customItem.armeSource === 'object' ? customItem.armeSource
        : customItem.armureSource && typeof customItem.armureSource === 'object' ? customItem.armureSource
          : null
      const sourcePolicy = resolveShopPolicy(shopPolicy, shopPolicyPaths(sourceCollection, sourceItem ?? { id: sourceId, categorie: customItem.categorie }))
      weapon.prix = adjustedShopPrice(customItem.prixAchat, sourcePolicy.percentage)
      weapon.policyPercentage = sourcePolicy.percentage
      weapon.custom = true
      return { item: weapon, mods: modList(customItem.mods), customEquipmentId: Number(customItem.id) }
    })
  const characterData: ShopCharacter = {
    id: character.id, nom: character.nom ?? 'Personnage', konis: character.konis ?? 0,
    rang: computeRank(Number(character.pointsDeRang) || 0).level,
    factionName: String(faction?.nom ?? ''), inventaireRecompensesFaction: factionRewards,
    inventaireArmes: [
      ...(character.inventaireArmes ?? []).map((row: any) => ({ item: weaponById.get(String(idOf(row.item))) ?? null, mods: modList(row.mods), munitions: row.munitionsActuelles ?? 0 })),
      ...customWeapons,
    ],
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
