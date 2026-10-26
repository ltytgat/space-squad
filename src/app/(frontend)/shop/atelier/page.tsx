import Link from 'next/link'
import { headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { factionKey, ownsFactionAtelierAccess } from '@/lib/factionRewards'
import { atelierPointsForPersonalItem, atelierPointsForShip, atelierRelationId } from '@/lib/atelier'
import { readShopPrice } from '@/lib/shop'
import { AtelierClient, type AtelierItem, type AtelierModification } from './AtelierClient'
import '../shop.css'
import './atelier.css'

const idOf = (value: any): number | null => {
  return atelierRelationId(value)
}

function imageSummary(image: any, fallbackName: string) {
  return image && typeof image === 'object' && typeof image.url === 'string'
    ? { url: image.url, alt: image.alt ?? fallbackName }
    : null
}

function personalItemSummary(row: any, index: number, kind: 'arme' | 'armure'): AtelierItem | null {
  const item = row?.item && typeof row.item === 'object' ? row.item : null
  if (!item || row.customItem) return null
  const points = atelierPointsForPersonalItem(kind, item)
  const price = readShopPrice(item.prix)
  if (points === null || price === null) return null
  const set = item.set && typeof item.set === 'object' ? item.set : null
  return {
    id: Number(item.id),
    index,
    kind,
    nom: String(item.nom ?? 'Équipement sans nom'),
    categorie: String(item.categorie ?? ''),
    type: Array.isArray(item.type) ? item.type.map(String) : [],
    classe: null,
    prix: price,
    points,
    image: imageSummary(item.image, String(item.nom ?? 'Équipement')),
    setNom: set?.nom ? String(set.nom) : null,
    modelNom: null,
    description: null,
    properties: kind === 'arme'
      ? {
          fabricant: item.fabricant, categorie: item.categorie, type: item.type, poids: item.poids,
          forceMinimum: item.forceMinimum, valeurDegats: item.valeurDegats, zoneEffet: item.zoneEffet,
          projectilesParTir: item.projectilesParTir, tempsRechargement: item.tempsRechargement,
          porteeFixe: item.porteeFixe, courtePortee: item.courtePortee, modCourtePortee: item.modCourtePortee,
          moyennePortee: item.moyennePortee, modMoyennePortee: item.modMoyennePortee,
          paliersSniper: item.paliersSniper, trancheMalusLonguePortee: item.trancheMalusLonguePortee,
          malusParTranche: item.malusParTranche, tailleChargeur: item.tailleChargeur,
          valeurChauffe: item.valeurChauffe, tempsRefroidissement: item.tempsRefroidissement,
          details: item.details, prix: item.prix,
        }
      : {
          categorie: item.categorie, valeurArmurePhysique: item.valeurArmurePhysique,
          valeurBouclier: item.valeurBouclier, valeurRupture: item.valeurRupture,
          poids: item.poids, modificateur: item.modificateur, rang: item.rang,
          stockage: item.stockage, prix: item.prix,
        },
    components: (row.mods ?? []).map((mod: any) => typeof mod === 'object' ? String(mod.nom ?? '') : '').filter(Boolean),
  }
}

function shipItemSummary(ship: any, index: number, occupiedIds: Set<number>): AtelierItem | null {
  const model = ship.modele && typeof ship.modele === 'object' ? ship.modele : null
  const chassis = model?.chassis && typeof model.chassis === 'object' ? model.chassis : null
  if (!model || !chassis || ship.atelierPersonnalise || model.atelierPrive || (model.atelierModifications ?? []).length > 0 || occupiedIds.has(Number(ship.id)) || ship.pilote || ship.copilote || (ship.canonniers ?? []).some((entry: any) => entry.personnage)) return null
  const points = atelierPointsForShip(chassis.classe)
  const price = readShopPrice(model.prix)
  if (points === null || price === null) return null
  const itemName = (value: any) => value && typeof value === 'object' ? String(value.nom ?? '') : ''
  const weapons = (model.armes ?? []).map((entry: any) => `${entry.emplacement ?? 'pilote'} : ${itemName(entry.arme)}`).filter((value: string) => !value.endsWith(': '))
  const optionalModules = (model.modulesOptionnels ?? []).map(itemName).filter(Boolean)
  const components = [
    ['Générateur', itemName(model.generateur)], ['Propulseurs', itemName(model.propulseurs)],
    ['Boucliers', itemName(model.boucliers)], ['Système de survie', itemName(model.survie)],
    ...optionalModules.map((name: string) => ['Module optionnel', name]),
    ...weapons.map((weapon: string) => ['Arme', weapon]),
  ].filter((entry) => entry[1]).map(([kind, name]) => `${kind} : ${name}`)
  return {
    id: Number(ship.id), index, kind: 'vaisseau', nom: String(ship.nom ?? `Vaisseau ${ship.id}`),
    categorie: String(chassis.categorie ?? ''), type: [], classe: String(chassis.classe), prix: price, points,
    image: imageSummary(model.image ?? chassis.image, String(model.nom ?? ship.nom ?? 'Vaisseau')),
    setNom: null, modelNom: String(model.nom ?? chassis.nom ?? 'Modèle de vaisseau'),
    description: model.description ? String(model.description) : null,
    properties: {
      nom: chassis.nom, classe: chassis.classe, categorie: chassis.categorie, tourelles: chassis.tourelles,
      pointsEmportPilote: chassis.pointsEmportPilote, pointsEmportTourelles: chassis.pointsEmportTourelles,
      blindage: chassis.blindage, modulesSupplementaires: chassis.modulesSupplementaires,
      consommables: chassis.consommables, esquiveBase: chassis.esquiveBase,
    },
    components,
  }
}

function modificationSummary(doc: any): AtelierModification {
  return {
    id: Number(doc.id), nom: String(doc.nom ?? 'Modification'),
    description: doc.description ? String(doc.description) : null,
    compatibilites: (doc.compatibilites ?? []).map((compatibility: any) => ({
      categorieEquipement: compatibility.categorieEquipement,
      sousCategorie: compatibility.sousCategorie ?? null,
      typeArme: compatibility.typeArme ?? null,
      classeVaisseau: compatibility.classeVaisseau ?? null,
      prix: Number(compatibility.prix), points: Number(compatibility.points),
      maximum: Number(compatibility.maximum),
      multiplicateurRachat: compatibility.multiplicateurRachat == null ? null : Number(compatibility.multiplicateurRachat),
    })),
    effets: (doc.effets ?? []).map((effect: any) => ({ cible: String(effect.cible), operation: String(effect.operation), valeur: String(effect.valeur) })),
  }
}

export const metadata = { title: 'Atelier — Space Squad' }

export default async function AtelierPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  const character: any = await getActiveCharacter(payload, user, { depth: 3 })
  if (!character) redirect('/character')
  if (!isCharacterCreationComplete(character)) redirect('/character')

  const affiliation = character.affiliation && typeof character.affiliation === 'object'
    ? character.affiliation
    : idOf(character.affiliation) ? await payload.findByID({ collection: 'factions', id: idOf(character.affiliation)!, depth: 0, overrideAccess: true }).catch(() => null) : null
  const factionName = String(affiliation?.nom ?? '')
  const faction = factionKey(factionName)
  const kind: AtelierItem['kind'] | null = faction === 'alliance' ? 'arme' : faction === 'union' ? 'armure' : faction === 'guilde' ? 'vaisseau' : null
  const hasPermit = ownsFactionAtelierAccess(character.inventaireRecompensesFaction, factionName)
  if (!kind || !hasPermit) {
    return <div className="ss-root shop-root"><SiteHeader activePage="shop" /><div className="shop-layout">
      <section className="shop-heading"><div className="ss-container"><nav className="shop-breadcrumb"><Link href="/">Accueil</Link><span>›</span><Link href="/shop">Boutique</Link><span>›</span><span>Atelier</span></nav><h1>Atelier</h1><p>Un permis valide pour votre organisation est nécessaire pour accéder à cet atelier.</p></div></section>
      <main className="ss-container shop-content"><div className="shop-empty"><Link href="/shop">Retour à la boutique</Link></div></main>
    </div><SiteFooter /></div>
  }

  const modificationsResult = await payload.find({ collection: 'atelier-modifications', where: { active: { equals: true } }, depth: 0, limit: 500, sort: 'nom', overrideAccess: true })
  let items: AtelierItem[] = []
  if (kind === 'arme') {
    items = (character.inventaireArmes ?? []).map((row: any, index: number) => personalItemSummary(row, index, 'arme')).filter(Boolean) as AtelierItem[]
  } else if (kind === 'armure') {
    items = (character.inventaireArmures ?? []).map((row: any, index: number) => personalItemSummary(row, index, 'armure')).filter(Boolean) as AtelierItem[]
  } else {
    const ships = await payload.find({ collection: 'ships', where: { proprietaire: { equals: character.id } }, depth: 4, limit: 200, sort: 'nom', overrideAccess: true })
    const shipIds = (ships.docs as any[]).map((ship) => Number(ship.id))
    const occupied = shipIds.length ? await payload.find({ collection: 'characters', where: { vaisseau: { in: shipIds } }, depth: 0, limit: 500, pagination: false, select: { vaisseau: true }, overrideAccess: true }) : { docs: [] }
    const occupiedIds = new Set((occupied.docs as any[]).map((member) => idOf(member.vaisseau)).filter((id): id is number => id !== null))
    items = (ships.docs as any[]).map((ship, index) => shipItemSummary(ship, index, occupiedIds)).filter(Boolean) as AtelierItem[]
  }

  return <div className="ss-root shop-root"><SiteHeader activePage="shop" /><div className="shop-layout">
    <section className="shop-heading"><div className="ss-container">
      <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Atelier de {factionName}</span></nav>
      <h1>Atelier de {factionName}</h1>
      <p>{kind === 'arme' ? 'Personnalisez une arme Alliance thermique ou cinétique de votre réserve.' : kind === 'armure' ? 'Personnalisez une pièce du set Starlancer de votre réserve.' : 'Personnalisez un vaisseau inoccupé de votre hangar.'}</p>
    </div></section>
    <main className="ss-container shop-content">
      <AtelierClient kind={kind} character={{ id: Number(character.id), nom: String(character.nom ?? 'Personnage'), konis: Number(character.konis) || 0 }} items={items} modifications={(modificationsResult.docs as any[]).map(modificationSummary)} />
    </main>
  </div><SiteFooter /></div>
}
