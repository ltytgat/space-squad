import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { findGroupShipIds } from '@/lib/shipAccess'
import '../../character/character.css'

// ── Types locaux pour les relations populées (depth: 1) ──────────────────────

type Weapon = {
  id: number
  nom: string
  poids?: number
  tailleChargeur?: number
  valeurDegats?: string
  projectilesParTir?: number
  tempsRechargement?: number
  type?: string[]
  categorie?: string
  porteeFixe?: number
  courtePortee?: number
  modCourtePortee?: number
  moyennePortee?: number
  modMoyennePortee?: number
  paliersSniper?: { distanceMax: number; modificateur: number }[]
  trancheMalusLonguePortee?: number
  malusParTranche?: number
  valeurChauffe?: number
  tempsRefroidissement?: number
}

type Mod = {
  id: number
  nom: string
  effet: string
  modificateurs?: {
    cible: string
    valeur: number
  }[]
}

type ArmorSet = {
  id: number
  nom: string
  bonus: string
}

type Armor = {
  id: number
  nom: string
  valeurArmurePhysique?: number
  valeurBouclier?: number
  modificateur?: string
  valeurRupture?: number
  stockage?: number
  set?: ArmorSet | number | null
}

type Consumable = {
  id: number
  nom: string
  categorie: 'soins' | 'munitions' | 'grenades' | 'tactique' | 'outils'
  effet?: string
  epreuve?: string
  modificateurEpreuve?: number
  prix?: number
}

type Chip = {
  id: number
  nom: string
  categorie: 'active' | 'passive'
  effet: string
  restriction?: string
  cooldown?: number
}

type Ship = { id: number; nom: string; classe?: string; modele?: string }
type Group = { id: number; nom: string }

type Faction = {
  id: number
  nom: string
  rangs?: { nom: string; pointsRequis: number }[]
}

type Character = {
  id: number
  user?: { id: number } | string | null
  nom?: string
  sexe?: string
  origine?: string
  affiliation?: string | Faction | null
  pointsDeRang?: number
  konis?: number
  legende?: number
  force?: number
  habilite?: number
  connaissances?: number
  culture?: number
  anticipation?: number
  perception?: number
  malusForce?: number
  malusHabilite?: number
  malusConnaissances?: number
  malusCulture?: number
  malusAnticipation?: number
  malusPerception?: number
  bonusPointsDeBlessures?: number
  [key: string]: any // Pour accéder aux malus dynamiquement
  armureTete?: { item?: Armor | string | null; mods?: (Mod | number)[] | null } | null
  armureTorse?: { item?: Armor | string | null; mods?: (Mod | number)[] | null } | null
  armureBras?: { item?: Armor | string | null; mods?: (Mod | number)[] | null } | null
  armureJambes?: { item?: Armor | string | null; mods?: (Mod | number)[] | null } | null
  armureBackpack?: { item?: Armor | string | null; mods?: (Mod | number)[] | null } | null
  armePrincipale?: { item?: Weapon | string | null; mods?: (Mod | number)[] | null } | null
  armeSecondaire?: { item?: Weapon | string | null; mods?: (Mod | number)[] | null } | null
  armeLourde?: { item?: Weapon | string | null; mods?: (Mod | number)[] | null } | null
  armeDeMelee?: { item?: Weapon | string | null; mods?: (Mod | number)[] | null } | null
  consommableEquipe1?: Consumable | string | null
  consommableEquipe2?: Consumable | string | null
  consommableEquipe3?: Consumable | string | null
  consommablesEquipes?: (Consumable | number)[] | null
  backpack?: string | null
  vaisseau?: Ship | string | null
  roleVaisseau?: string | null
  groupe?: Group | string | null
  competences?: { competence: string; valeur: number; id?: string }[]
  competencesSpeciales?: { nom: string; valeur: number; id?: string }[]
  inventaireArmes?: { item: Weapon | number; mods?: (Mod | number)[] | null }[] | null
  inventaireArmures?: { item: Armor | number; mods?: (Mod | number)[] | null }[] | null
  inventaireMods?: (Mod | number)[] | null
  inventairePuces?: (Chip | number)[] | null
  inventaire?: { consommable: Consumable | number; quantite: number; id?: string }[]
}
// ── Sous-composants ──────────────────────────────────────────────────────────
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { CharacterClient } from './CharacterClient'

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  const role = (user as { role?: string }).role
  const isAdmin = role === 'admin'
  const characterId = parseInt(id, 10)

  if (isNaN(characterId)) redirect(isAdmin ? '/characters' : '/')

  // Récupération sans restriction pour vérifier la propriété manuellement
  let character: Character | null = null
  try {
    character = (await payload.findByID({
      collection: 'characters',
      id: characterId,
      depth: 3,
      overrideAccess: true,
    })) as Character
  } catch {
    redirect(isAdmin ? '/characters' : '/')
  }

  if (!character) redirect(isAdmin ? '/characters' : '/')

  // Contrôle d'accès : admin voit tout, joueur uniquement son propre personnage
  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  const isOwner = String(ownerId) === String(user.id)

  if (!isAdmin && !isOwner) redirect('/')

  // Vaisseaux accessibles : ceux du groupe, plus celui où le personnage est embarqué.
  const groupShipIds = await findGroupShipIds(payload, character)
  let relatedShips: any[] = []
  if (groupShipIds.length > 0) {
    const { docs } = await payload.find({
      collection: 'ships', where: { id: { in: groupShipIds } }, depth: 4, limit: 200, sort: 'nom', overrideAccess: true,
    })
    relatedShips = docs as any[]
  }

  // Récupérer la liste des compétences de base via le schéma (ou une constante partagée)
  // Ici on va extraire COMPETENCES_BASE du fichier src/collections/Characters.ts si possible
  // Mais pour faire simple et rapide, je vais utiliser les options du champ select de la collection
  const characterCollection = payloadConfig.collections.find(c => c.slug === 'characters')
  const competencesField = characterCollection?.fields.find((f: any) => f.name === 'competences') as any
  const skillSelectField = competencesField?.fields?.find((f: any) => f.name === 'competence')
  const allBaseSkills = skillSelectField?.options?.map((opt: any) => typeof opt === 'string' ? opt : opt.value) || []

  return (
    <>
      <SiteHeader activePage={isOwner ? 'character' : (isAdmin ? 'characters' : undefined)} />
      <CharacterClient 
        character={JSON.parse(JSON.stringify(character))} 
        isAdmin={isAdmin} 
        isOwner={isOwner}
        allBaseSkills={allBaseSkills}
        relatedShips={JSON.parse(JSON.stringify(relatedShips.filter(Boolean)))}
      />
      <SiteFooter />
    </>
  )
}
