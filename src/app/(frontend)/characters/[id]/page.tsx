import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeRank } from '@/lib/rankSystem'
import { MalusInput } from './MalusInput'
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
}

type Mod = {
  id: number
  nom: string
  effet: string
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
  set?: ArmorSet | number | null
}

type Ship = { id: number; nom: string; classe?: string; modele?: string }
type Group = { id: number; nom: string }

type Character = {
  id: number
  user?: { id: number } | string | null
  nom?: string
  sexe?: string
  origine?: string
  affiliation?: string
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
  armePrincipale?: { item?: Weapon | string | null } | null
  armeSecondaire?: { item?: Weapon | string | null } | null
  armeLourde?: { item?: Weapon | string | null } | null
  armeDePoing?: { item?: Weapon | string | null } | null
  armeDeMelee?: { item?: Weapon | string | null } | null
  backpack?: string | null
  vaisseau?: Ship | string | null
  roleVaisseau?: string | null
  groupe?: Group | string | null
  competences?: { competence: string; valeur: number; id?: string }[]
  competencesSpeciales?: { nom: string; valeur: number; id?: string }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function asArmor(v: { item?: Armor | string | null } | Armor | string | null | undefined): Armor | null {
  if (!v) return null
  if (typeof v === 'object' && 'item' in v) {
    if (!v.item || typeof v.item === 'string') return null
    return v.item
  }
  if (typeof v === 'string') return null
  return v as Armor
}

function parseModifier(modStr: string | null | undefined): Record<string, number> {
  if (!modStr) return {}
  const mods: Record<string, number> = {}
  // On cherche des patterns comme "Cha+2" ou "Fo+1" ou "+1 Fo"
  // On supporte les deux ordres pour plus de flexibilité
  const regex = /([+-]\d+)\s*(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception)|(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception)\s*([+-]\d+)/gi
  let match
  const mapping: Record<string, string> = {
    fo: 'force',
    force: 'force',
    hab: 'habilite',
    habilité: 'habilite',
    int: 'connaissances',
    connaissances: 'connaissances',
    cha: 'culture',
    culture: 'culture',
    ant: 'anticipation',
    anticipation: 'anticipation',
    pe: 'perception',
    perception: 'perception',
  }

  while ((match = regex.exec(modStr)) !== null) {
    // Si match[1] existe, c'est le format "+1 Fo" (valeur, puis nom)
    // Si match[3] existe, c'est le format "Cha+2" (nom, puis valeur)
    const valStr = match[1] || match[4]
    const keyStr = (match[2] || match[3]).toLowerCase()
    
    const val = parseInt(valStr)
    const key = mapping[keyStr]
    
    if (key) {
      mods[key] = (mods[key] || 0) + val
    }
  }
  return mods
}

function asMods(v: { mods?: (Mod | number)[] | null } | (Mod | number)[] | null | undefined): Mod[] {
  if (!v) return []
  let mods: (Mod | number)[] = []
  if (typeof v === 'object' && 'mods' in v) {
    mods = v.mods ?? []
  } else if (Array.isArray(v)) {
    mods = v
  }
  return mods.filter((m): m is Mod => typeof m === 'object' && m !== null)
}

function asWeapon(v: { item?: Weapon | string | null } | Weapon | string | null | undefined): Weapon | null {
  if (!v) return null
  if (typeof v === 'object' && 'item' in v) {
    if (!v.item || typeof v.item === 'string') return null
    return v.item
  }
  if (typeof v === 'string') return null
  return v as Weapon
}

function asShip(v: Ship | string | null | undefined): Ship | null {
  if (!v || typeof v === 'string') return null
  return v
}

function asGroup(v: Group | string | null | undefined): Group | null {
  if (!v || typeof v === 'string') return null
  return v
}

function stat(value: number | undefined) {
  return value ?? 0
}

const CLASSE_LABEL: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma',
  delta: 'Delta',
}

function rankTier(level: number): string {
  if (level <= 3) return 'novice'
  if (level <= 6) return 'advanced'
  if (level <= 9) return 'elite'
  return 'master'
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function ArmorSlot({
  label,
  armor,
  mods = [],
  setInfo,
}: {
  label: string
  armor: Armor | null
  mods?: Mod[]
  setInfo?: { name: string; count: number } | null
}) {
  return (
    <div className={`char-equip-slot${armor ? '' : ' char-equip-slot-empty'}`}>
      <span className="char-equip-slot-label">{label}</span>
      {armor ? (
        <div className="char-equip-item">
          <span className="char-equip-item-name">{armor.nom}</span>
          <div className="char-equip-item-stats">
            {armor.valeurArmurePhysique != null && (
              <span title="Armure physique" className="stats-physique">
                🛡 {armor.valeurArmurePhysique}
              </span>
            )}
            {armor.valeurBouclier != null && (
              <span title="Bouclier" className="stats-bouclier">
                ⚡ {armor.valeurBouclier}
              </span>
            )}
            {armor.valeurRupture != null && <span title="Rupture">💥 1 à {armor.valeurRupture}</span>}
          </div>
          {armor.modificateur && <div className="char-equip-item-mod-base">Mod: {armor.modificateur}</div>}
          {mods.length > 0 && (
            <div className="char-equip-item-mods-list">
              {mods.map((m) => (
                <div key={m.id} className="char-equip-mod-item" title={m.effet}>
                  🔧 {m.nom}
                </div>
              ))}
            </div>
          )}
          {setInfo && (
            <div className={`char-equip-item-set-progression ${setInfo.count >= 4 ? 'set-complete' : ''}`}>
              {setInfo.name} ({setInfo.count}/4)
            </div>
          )}
        </div>
      ) : (
        <div className="char-equip-empty">
          <span className="char-equip-empty-icon">🛡️</span>
          <span className="char-equip-empty-text">Non équipé</span>
        </div>
      )}
    </div>
  )
}

function WeaponSlot({
  label,
  weapon,
  forceDieMod,
  perceptionDieMod,
}: {
  label: string
  weapon: Weapon | null
  forceDieMod: number
  perceptionDieMod: number
}) {
  const isMelee = weapon?.categorie === 'melee'
  const isHeavy = weapon?.categorie === 'lourde'
  const isSniper = weapon?.categorie === 'sniper'
  const isThermique = weapon?.type?.includes('thermique')
  const isPlasma = weapon?.type?.includes('plasma')

  // Masquer les projectiles pour Thermique/Plasma
  const showProjectiles = weapon?.projectilesParTir != null && !isThermique && !isPlasma

  // Déterminer la classe de couleur pour les dégâts
  const damageColorClass = weapon?.type?.[0] ? `weapon-type-${weapon.type[0]}` : ''

  // Calcul du bonus de dégâts
  const getFinalDamageData = () => {
    if (!weapon || !weapon.valeurDegats) return null

    let baseDamage = weapon.valeurDegats
    let bonus = 0
    let multiplier = baseDamage.endsWith('*') ? 2 : 1
    const cleanDamage = baseDamage.replace('*', '').replace('!', '')

    if (isMelee) {
      bonus = forceDieMod * multiplier
    } else if (!isHeavy && !isPlasma) {
      // Pour les armes (hors lourde, mêlée ou plasma), on utilise Perception
      bonus = perceptionDieMod * multiplier
    }

    const finalDamageStr = bonus === 0 ? baseDamage : `${cleanDamage}${bonus > 0 ? '+' : ''}${bonus}${baseDamage.endsWith('!') ? '!' : ''}`
    
    // Calcul des stats min/moy/max
    // Format attendu: XdY+Z ou XdY
    const diceMatch = cleanDamage.match(/(\d+)d(\d+)(?:([+-]\d+))?/)
    let min = 0, avg = 0, max: number | null = 0
    const isExplosive = baseDamage.endsWith('!')

    if (diceMatch) {
      const count = parseInt(diceMatch[1])
      const faces = parseInt(diceMatch[2])
      const fixed = parseInt(diceMatch[3] || '0')
      
      min = count + fixed + bonus
      
      if (isExplosive) {
        // Espérance dé explosif: (faces + 1) / 2 * (faces / (faces - 1))
        const expDie = ((faces + 1) / 2) * (faces / (faces - 1))
        avg = count * expDie + fixed + bonus
        max = null // Infini
      } else {
        avg = count * ((faces + 1) / 2) + fixed + bonus
        max = count * faces + fixed + bonus
      }
    }

    return {
      display: finalDamageStr,
      min: Math.floor(min),
      avg: Math.round(avg),
      max: max !== null ? Math.floor(max) : null
    }
  }

  const damageData = getFinalDamageData()

  // Construction du tableau de portée
  const renderRangeTable = () => {
    if (!weapon) return null

    const rows: { label: string; mod: string }[] = []

    if (isMelee) {
      rows.push({ label: `< ${weapon.porteeFixe ?? 1}m`, mod: '0' })
    } else if (isHeavy) {
      rows.push({ label: `Max ${weapon.porteeFixe ?? 50}m`, mod: '0' })
    } else if (isSniper) {
      // Courte portée définie plus haut
      rows.push({
        label: `< ${weapon.courtePortee ?? 0}m`,
        mod: (weapon.modCourtePortee ?? 0) >= 0 ? `+${weapon.modCourtePortee}` : `${weapon.modCourtePortee}`,
      })
      // Paliers sniper
      weapon.paliersSniper?.forEach((p) => {
        rows.push({
          label: `< ${p.distanceMax}m`,
          mod: (p.modificateur ?? 0) >= 0 ? `+${p.modificateur}` : `${p.modificateur}`,
        })
      })
    } else {
      // Armes standard (Fusil, Pistolet, Shotgun)
      if (weapon.courtePortee != null) {
        rows.push({
          label: `< ${weapon.courtePortee}m`,
          mod: (weapon.modCourtePortee ?? 0) >= 0 ? `+${weapon.modCourtePortee}` : `${weapon.modCourtePortee}`,
        })
      }
      if (weapon.moyennePortee != null) {
        rows.push({
          label: `< ${weapon.moyennePortee}m`,
          mod: (weapon.modMoyennePortee ?? 0) >= 0 ? `+${weapon.modMoyennePortee}` : `${weapon.modMoyennePortee}`,
        })
      }
    }

    // Malus longue portée (si applicable)
    if (!isMelee && !isHeavy && weapon.trancheMalusLonguePortee) {
      rows.push({
        label: `+${weapon.trancheMalusLonguePortee}m`,
        mod: (weapon.malusParTranche ?? -1) >= 0 ? `+${weapon.malusParTranche}` : `${weapon.malusParTranche}`,
      })
    }

    if (rows.length === 0) return null

    return (
      <table className="weapon-range-table">
        <thead>
          <tr>
            {rows.map((r, i) => (
              <th key={i}>{r.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {rows.map((r, i) => (
              <td key={i}>{r.mod}</td>
            ))}
          </tr>
        </tbody>
      </table>
    )
  }

  return (
    <div className={`char-equip-slot${weapon ? '' : ' char-equip-slot-empty'}`}>
      <span className="char-equip-slot-label">{label}</span>
      {weapon ? (
        <div className="char-equip-item">
          <span className="char-equip-item-name">{weapon.nom}</span>
          <div className="char-equip-item-stats">
            {damageData != null && (
              <div className="weapon-damage-block">
                <div className={`weapon-damage-badge ${damageColorClass}`}>
                  <span className="weapon-damage-icon">⚔️</span>
                  <span className="weapon-damage-value">{damageData.display}</span>
                </div>
                {!isPlasma && (
                  <div className="weapon-damage-details">
                    <div className="damage-stat">
                      <span className="damage-stat-label">MIN</span>
                      <span className="damage-stat-val">{damageData.min}</span>
                    </div>
                    <div className="damage-stat highlight">
                      <span className="damage-stat-label">MOY</span>
                      <span className="damage-stat-val">{damageData.avg}</span>
                    </div>
                    {damageData.max !== null && (
                      <div className="damage-stat">
                        <span className="damage-stat-label">MAX</span>
                        <span className="damage-stat-val">{damageData.max}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="weapon-utility-stats">
              {weapon.tailleChargeur != null && (
                <div className="weapon-util-item" title="Chargeur">
                  <span className="util-icon">📦</span>
                  <span className="util-value">{weapon.tailleChargeur}</span>
                </div>
              )}
              {showProjectiles && (
                <div className="weapon-util-item" title="Projectiles/tir">
                  <span className="util-icon">×</span>
                  <span className="util-value">{weapon.projectilesParTir}</span>
                </div>
              )}
              {weapon.tempsRechargement != null && (
                <div className="weapon-util-item" title="Rechargement">
                  <span className="util-icon">🔄</span>
                  <span className="util-value">{weapon.tempsRechargement}t</span>
                </div>
              )}
              {weapon.poids != null && (
                <div className="weapon-util-item" title="Poids">
                  <span className="util-icon">⚖️</span>
                  <span className="util-value">{weapon.poids}kg</span>
                </div>
              )}
            </div>
          </div>
          {renderRangeTable()}
        </div>
      ) : (
        <div className="char-equip-empty">
          <span className="char-equip-empty-icon">🔫</span>
          <span className="char-equip-empty-text">Non équipé</span>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const malusFields = [
    character.malusForce,
    character.malusHabilite,
    character.malusConnaissances,
    character.malusCulture,
    character.malusAnticipation,
    character.malusPerception,
  ]
  const isWounded = malusFields.some((m) => (m ?? 0) > 0)

  const rankInfo = computeRank(character.pointsDeRang ?? 0)

  // Totaux armures
  const armors = [
    asArmor(character.armureTete),
    asArmor(character.armureTorse),
    asArmor(character.armureBras),
    asArmor(character.armureJambes),
    asArmor(character.armureBackpack),
  ].filter(Boolean) as Armor[]

  const totalPhysique = armors.reduce((acc, a) => acc + (a.valeurArmurePhysique ?? 0), 0)
  const totalBouclier = armors.reduce((acc, a) => acc + (a.valeurBouclier ?? 0), 0)

  // Totaux armes
  const weapons = [
    asWeapon(character.armePrincipale),
    asWeapon(character.armeSecondaire),
    asWeapon(character.armeLourde),
    asWeapon(character.armeDePoing),
    asWeapon(character.armeDeMelee),
  ].filter(Boolean) as Weapon[]

  const totalWeaponWeight = weapons.reduce((acc, w) => acc + (w.poids ?? 0), 0)

  // Détection des sets pour toutes les pièces
  const armorPieces = [
    asArmor(character.armureTete),
    asArmor(character.armureTorse),
    asArmor(character.armureBras),
    asArmor(character.armureJambes),
  ]

  const setsMap = new Map<number, { set: ArmorSet; count: number }>()
  armorPieces.forEach((a) => {
    if (a?.set && typeof a.set === 'object') {
      const current = setsMap.get(a.set.id) || { set: a.set, count: 0 }
      current.count++
      setsMap.set(a.set.id, current)
    }
  })

  const completedSets = Array.from(setsMap.values()).filter((s) => s.count >= 4)

  // Calcul des modificateurs de caractéristiques via les armures et les mods
  const totalArmorMods: Record<string, number> = {}
  
  // 1. On analyse les modificateurs de base des armures équipées
  armors.forEach(a => {
    const armorMods = parseModifier(a.modificateur)
    Object.entries(armorMods).forEach(([key, val]) => {
      totalArmorMods[key] = (totalArmorMods[key] || 0) + val
    })
  })

  // 2. On analyse les effets des mods sur chaque pièce
  const allMods = [
    ...asMods(character.armureTete),
    ...asMods(character.armureTorse),
    ...asMods(character.armureBras),
    ...asMods(character.armureJambes),
    ...asMods(character.armureBackpack),
  ]
  allMods.forEach(m => {
    const modEffects = parseModifier(m.effet)
    Object.entries(modEffects).forEach(([key, val]) => {
      totalArmorMods[key] = (totalArmorMods[key] || 0) + val
    })
  })

  // 3. Bonus de set (si applicable, on pourrait aussi parser le bonus de set)
  completedSets.forEach(s => {
    const setMods = parseModifier(s.set.bonus)
    Object.entries(setMods).forEach(([key, val]) => {
      totalArmorMods[key] = (totalArmorMods[key] || 0) + val
    })
  })

  const getSetInfo = (armor: Armor | null) => {
    if (!armor || !(armor.set && typeof armor.set === 'object')) return null
    const info = setsMap.get(armor.set.id)
    if (info) {
      return { name: info.set.nom, count: info.count }
    }
    return null
  }

  // Calcul des modificateurs de dé pour les armes
  const getDieMod = (key: string, baseValue: number | undefined) => {
    const bonus = totalArmorMods[key] || 0
    const malusKey = `malus${key.charAt(0).toUpperCase()}${key.slice(1)}`
    const malus = character[malusKey] || 0
    const total = (baseValue || 0) + bonus - malus
    return Math.floor((total - 10) / 2)
  }

  const forceDieMod = getDieMod('force', character.force)
  const perceptionDieMod = getDieMod('perception', character.perception)
  const anticipationDieMod = getDieMod('anticipation', character.anticipation)

  // Calcul de l'esquive
  const getDodgeStats = () => {
    const ba = anticipationDieMod
    const rank = rankInfo.level
    const totalArmor = totalPhysique
    const bf = forceDieMod

    // Esquive de base (découvert) : 15+(Bonus d'anticipation * Rang/2) – ((Armure Physique totale – Bonus de force)/2)
    const base = 15 + (ba * rank / 2) - ((totalArmor - bf) / 2)
    const decouvert = Math.floor(base)

    return {
      decouvert,
      depourvue: Math.floor(decouvert / 2),
      protege: Math.floor(decouvert * 1.5),
      couvert: Math.floor(decouvert * 2),
    }
  }

  const dodge = getDodgeStats()

  // Calcul des points de blessures
  const getMaxHP = () => {
    const origin = character.origine || 'Humain'
    const bf = forceDieMod
    const rank = rankInfo.level
    const n = character.bonusPointsDeBlessures || 0

    let base = 30
    let factor = 5

    if (origin === 'Strani') {
      base = 20
      factor = 4
    } else if (origin === 'Vada') {
      base = 40
      factor = 6
    }

    // Formule: (Base + Factor*BF + BF*(Rang-1)) / 3 + N
    const hp = (base + factor * bf + bf * (rank - 1)) / 3 + n
    return Math.floor(hp)
  }

  const maxHP = getMaxHP()

  // Calcul du mouvement
  const getMovement = () => {
    const origin = character.origine || 'Humain'
    const bf = forceDieMod
    const totalArmor = totalPhysique
    const totalWeapons = totalWeaponWeight

    let x = 10
    if (origin === 'Strani') {
      x = 14
    } else if (origin === 'Vada') {
      x = 6
    }

    // Formule: X - (Armure physique total - Bonus de Force + Poids des armes total)/2
    const move = x - (totalArmor - bf + totalWeapons) / 2
    return Math.floor(move)
  }

  const movement = getMovement()

  return (
    <div className="ss-root char-root">
      <SiteHeader activePage={isOwner ? 'character' : (isAdmin ? 'characters' : undefined)} />

      <div className="char-layout">
        {/* ── En-tête ── */}
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              {isAdmin && (
                <>
                  <a href="/characters">Personnages</a>
                  <span aria-hidden="true">›</span>
                </>
              )}
              <span>{isOwner ? 'Mon personnage' : (character.nom ?? 'Personnage')}</span>
            </nav>

            {character.nom ? (
              <>
                <div className="char-name-container">
                  <h1 className="char-name">{character.nom}</h1>
                  {isWounded && <span className="char-wounded-badge">Blessé</span>}
                </div>
                <div className="char-tags">
                  {character.origine && (
                    <span className="ss-tag">{character.origine}</span>
                  )}
                  {character.sexe && (
                    <span className="ss-tag">{character.sexe}</span>
                  )}
                  {character.affiliation && (
                    <span className={`ss-tag char-tag-affil-${character.affiliation.toLowerCase()}`}>
                      {character.affiliation}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="char-name char-name-empty">Personnage en cours de création</h1>
                <p className="char-empty-hint">
                  Un administrateur remplira votre fiche prochainement.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="char-content ss-container">

          {/* ── Rangée 1 : Identité + Attributs ── */}
          <div className="char-row char-row-top">

            <div className="char-card char-card-identity">
              <h2 className="char-card-title">Identité</h2>

              {/* ── Rang calculé ── */}
              <div className={`char-rank char-rank--${rankTier(rankInfo.level)}`}>
                <div className="char-rank-header">
                  <span className="char-rank-badge">Rang {rankInfo.level}</span>
                  <span className="char-rank-name">{rankInfo.name}</span>
                </div>
                <div className="char-rank-bar-track">
                  <div
                    className="char-rank-bar-fill"
                    style={{ width: `${rankInfo.progressPercent}%` }}
                    aria-label={`Progression ${rankInfo.progressPercent}%`}
                  />
                </div>
                <div className="char-rank-pts">
                  <span>{rankInfo.pointsInRank} pts</span>
                  {rankInfo.pointsToNext !== null ? (
                    <span>
                      {rankInfo.pointsToNext} pts → Rang {rankInfo.level + 1}
                    </span>
                  ) : (
                    <span className="char-rank-max">Rang maximum</span>
                  )}
                </div>
              </div>

              <dl className="char-dl">
                <div className="char-dl-row">
                  <dt>Konis</dt>
                  <dd>{stat(character.konis)}</dd>
                </div>
                <div className="char-dl-row">
                  <dt>Légende</dt>
                  <dd>{stat(character.legende)}</dd>
                </div>
                <div className="char-dl-row char-hp-row">
                  <dt>Blessures Max</dt>
                  <dd>
                    <div className="char-stat-right">
                      {isAdmin && (
                        <MalusInput
                          characterId={character.id}
                          field="bonusPointsDeBlessures"
                          initialValue={character.bonusPointsDeBlessures || 0}
                        />
                      )}
                      <span className="char-hp-value">{maxHP}</span>
                    </div>
                  </dd>
                </div>
                <div className="char-dl-row char-move-row">
                  <dt>Mouvement</dt>
                  <dd>
                    <span className="char-move-value">{movement} m</span>
                  </dd>
                </div>

                <div className="char-dodge-section">
                  <h3 className="char-dodge-title">Esquive</h3>
                  <table className="char-dodge-table">
                    <thead>
                      <tr>
                        <th>Dépourvue</th>
                        <th className="char-dodge-base-header">Découvert</th>
                        <th>Protégé</th>
                        <th>Couvert</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{dodge.depourvue}</td>
                        <td className="char-dodge-base">{dodge.decouvert}</td>
                        <td>{dodge.protege}</td>
                        <td>{dodge.couvert}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="char-dl-row char-dl-divider">
                  <dt>Escouade</dt>
                  <dd>{asGroup(character.groupe)?.nom ?? '—'}</dd>
                </div>
                <div className="char-dl-row">
                  <dt>Vaisseau</dt>
                  <dd>{asShip(character.vaisseau)?.nom ?? '—'}</dd>
                </div>
                {character.roleVaisseau && (
                  <div className="char-dl-row">
                    <dt>Rôle</dt>
                    <dd>
                      {character.roleVaisseau === 'proprietaire' ? 'Propriétaire' : 'Passager'}
                    </dd>
                  </div>
                )}
                {asShip(character.vaisseau)?.classe && (
                  <div className="char-dl-row">
                    <dt>Classe</dt>
                    <dd>{CLASSE_LABEL[asShip(character.vaisseau)!.classe!] ?? asShip(character.vaisseau)!.classe}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="char-card char-card-stats">
              <h2 className="char-card-title">Caractéristiques</h2>
              <div className="char-stats-grid">
                {(
                  [
                    ['Force', character.force, 'force', character.malusForce],
                    ['Habilité', character.habilite, 'habilite', character.malusHabilite],
                    ['Connaissances', character.connaissances, 'connaissances', character.malusConnaissances],
                    ['Culture', character.culture, 'culture', character.malusCulture],
                    ['Anticipation', character.anticipation, 'anticipation', character.malusAnticipation],
                    ['Perception', character.perception, 'perception', character.malusPerception],
                  ] as [string, number | undefined, string, number | undefined][]
                ).map(([label, baseValue, key, malus]) => {
                  const bonus = totalArmorMods[key] || 0
                  const currentMalus = malus || 0
                  const total = (baseValue || 0) + bonus - currentMalus
                  const dieMod = Math.floor((total - 10) / 2)
                  const dieModStr = dieMod >= 0 ? `+${dieMod}` : `${dieMod}`
                  
                  // Mapping pour les noms de champs Payload
                  const malusFieldName = `malus${key.charAt(0).toUpperCase()}${key.slice(1)}`

                  return (
                    <div key={label} className="char-stat-item">
                      <div className="char-stat-main">
                        <span className="char-stat-label">{label}</span>
                        <div className="char-stat-right">
                          {isAdmin && (
                            <MalusInput
                              characterId={character.id}
                              field={malusFieldName}
                              initialValue={currentMalus}
                            />
                          )}
                          <span className="char-stat-value">
                            {total} <span className="char-stat-die-mod">({dieModStr})</span>
                          </span>
                        </div>
                      </div>
                      {(bonus !== 0 || currentMalus !== 0) && (
                        <div className="char-stat-detail">
                          <span className="char-stat-base">{baseValue || 0}</span>
                          {bonus !== 0 && (
                            <span className={`char-stat-bonus ${bonus > 0 ? 'is-positive' : 'is-negative'}`}>
                              {bonus > 0 ? '+' : ''}{bonus}
                            </span>
                          )}
                          {currentMalus !== 0 && (
                            <span className="char-stat-malus">
                              -{currentMalus}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Rangée 2 : Armures ── */}
          <div className="char-card">
            <div className="char-card-header-with-stats">
              <h2 className="char-card-title">Armures</h2>
              <div className="char-card-totals">
                <div className="char-total-item stats-physique">
                  <span className="char-total-label">Physique</span>
                  <span className="char-total-value">{totalPhysique}</span>
                </div>
                <div className="char-total-item stats-bouclier">
                  <span className="char-total-label">Bouclier</span>
                  <span className="char-total-value">{totalBouclier}</span>
                </div>
              </div>
            </div>

            {completedSets.length > 0 && (
              <div className="char-armor-sets">
                {completedSets.map((s) => (
                  <div key={s.set.id} className="char-armor-set-active">
                    <span className="char-armor-set-name">Set Complet : {s.set.nom}</span>
                    <p className="char-armor-set-bonus">{s.set.bonus}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="char-equip-grid char-equip-grid-5">
              <ArmorSlot
                label="Tête"
                armor={asArmor(character.armureTete)}
                mods={asMods(character.armureTete)}
                setInfo={getSetInfo(asArmor(character.armureTete))}
              />
              <ArmorSlot
                label="Torse"
                armor={asArmor(character.armureTorse)}
                mods={asMods(character.armureTorse)}
                setInfo={getSetInfo(asArmor(character.armureTorse))}
              />
              <ArmorSlot
                label="Bras"
                armor={asArmor(character.armureBras)}
                mods={asMods(character.armureBras)}
                setInfo={getSetInfo(asArmor(character.armureBras))}
              />
              <ArmorSlot
                label="Jambes"
                armor={asArmor(character.armureJambes)}
                mods={asMods(character.armureJambes)}
                setInfo={getSetInfo(asArmor(character.armureJambes))}
              />
              <ArmorSlot
                label="Back-pack"
                armor={asArmor(character.armureBackpack)}
                mods={asMods(character.armureBackpack)}
              />
            </div>
          </div>

          {/* ── Rangée 3 : Arsenal ── */}
          <div className="char-card">
            <h2 className="char-card-title">Arsenal</h2>
            <div className="char-equip-grid char-equip-grid-3">
              <WeaponSlot
                label="Principale"
                weapon={asWeapon(character.armePrincipale)}
                forceDieMod={forceDieMod}
                perceptionDieMod={perceptionDieMod}
              />
              <WeaponSlot
                label="Secondaire"
                weapon={asWeapon(character.armeSecondaire)}
                forceDieMod={forceDieMod}
                perceptionDieMod={perceptionDieMod}
              />
              <WeaponSlot
                label="Lourde"
                weapon={asWeapon(character.armeLourde)}
                forceDieMod={forceDieMod}
                perceptionDieMod={perceptionDieMod}
              />
              <WeaponSlot
                label="Poing"
                weapon={asWeapon(character.armeDePoing)}
                forceDieMod={forceDieMod}
                perceptionDieMod={perceptionDieMod}
              />
              <WeaponSlot
                label="Mêlée"
                weapon={asWeapon(character.armeDeMelee)}
                forceDieMod={forceDieMod}
                perceptionDieMod={perceptionDieMod}
              />
            </div>

            {character.backpack && (
              <div className="char-backpack">
                <h3 className="char-backpack-title">Backpack</h3>
                <p className="char-backpack-content">{character.backpack}</p>
              </div>
            )}
          </div>

          {/* ── Rangée 4 : Compétences ── */}
          {((character.competences?.length ?? 0) > 0 ||
            (character.competencesSpeciales?.length ?? 0) > 0) && (
            <div className="char-card">
              <h2 className="char-card-title">Compétences</h2>
              <div className="char-skills-grid">
                {character.competences?.map((c) => (
                  <div key={c.id ?? c.competence} className="char-skill-item">
                    <span className="char-skill-name">{c.competence}</span>
                    <span className="char-skill-value">{c.valeur}</span>
                  </div>
                ))}
                {character.competencesSpeciales?.map((c) => (
                  <div key={c.id ?? c.nom} className="char-skill-item char-skill-special">
                    <span className="char-skill-name">{c.nom}</span>
                    <span className="char-skill-value">{c.valeur}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
