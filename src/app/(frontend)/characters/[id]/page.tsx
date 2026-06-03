import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { computeRank } from '@/lib/rankSystem'
import '../../character/character.css'

// ── Types locaux pour les relations populées (depth: 1) ──────────────────────

type Weapon = {
  id: number
  nom: string
  poids?: number
  tailleChargeur?: number
  valeurDegats?: string
  projectilesParTir?: number
  valeurRechargement?: number
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
        <span className="char-equip-empty-label">—</span>
      )}
    </div>
  )
}

function WeaponSlot({ label, weapon }: { label: string; weapon: Weapon | null }) {
  const isMelee = weapon?.categorie === 'melee'
  const isHeavy = weapon?.categorie === 'lourde'
  const isSniper = weapon?.categorie === 'sniper'
  const isThermique = weapon?.type?.includes('thermique')
  const isPlasma = weapon?.type?.includes('plasma')

  // Masquer les projectiles pour Thermique/Plasma
  const showProjectiles = weapon?.projectilesParTir != null && !isThermique && !isPlasma

  // Déterminer la classe de couleur pour les dégâts
  const damageColorClass = weapon?.type?.[0] ? `weapon-type-${weapon.type[0]}` : ''

  // Construction du tableau de portée
  const renderRangeTable = () => {
    if (!weapon) return null

    const rows: { label: string; mod: string }[] = []

    if (isMelee) {
      rows.push({ label: `< ${weapon.porteeFixe ?? 1}m`, mod: '0' })
    } else if (isHeavy) {
      rows.push({ label: `< ${weapon.porteeFixe ?? 50}m`, mod: '0' })
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
      const lastDist = rows[rows.length - 1]?.label.match(/\d+/)?.[0] ?? '0'
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
            {weapon.valeurDegats != null && (
              <span title="Dégâts" className={damageColorClass}>⚔ {weapon.valeurDegats}</span>
            )}
            {weapon.tailleChargeur != null && (
              <span title="Chargeur">📦 {weapon.tailleChargeur}</span>
            )}
            {showProjectiles && (
              <span title="Projectiles/tir">× {weapon.projectilesParTir}</span>
            )}
            {weapon.valeurRechargement != null && (
              <span title="Rechargement">🔄 {weapon.valeurRechargement}</span>
            )}
            {weapon.poids != null && (
              <span title="Poids">{weapon.poids} kg</span>
            )}
          </div>
          {renderRangeTable()}
        </div>
      ) : (
        <span className="char-equip-empty-label">—</span>
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

  if (isNaN(characterId)) redirect(isAdmin ? '/characters' : '/character')

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
    redirect(isAdmin ? '/characters' : '/character')
  }

  if (!character) redirect(isAdmin ? '/characters' : '/character')

  // Contrôle d'accès : admin voit tout, joueur uniquement son propre personnage
  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  const isOwner = String(ownerId) === String(user.id)

  if (!isAdmin && !isOwner) redirect('/character')

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

  const getSetInfo = (armor: Armor | null) => {
    if (!armor || !(armor.set && typeof armor.set === 'object')) return null
    const info = setsMap.get(armor.set.id)
    if (info) {
      return { name: info.set.nom, count: info.count }
    }
    return null
  }

  return (
    <div className="ss-root char-root">
      <SiteHeader activePage={isAdmin ? 'characters' : 'character'} />

      <div className="char-layout">
        {/* ── En-tête ── */}
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              {isAdmin ? (
                <>
                  <a href="/characters">Personnages</a>
                  <span aria-hidden="true">›</span>
                  <span>{character.nom ?? 'Personnage'}</span>
                </>
              ) : (
                <span>Mon personnage</span>
              )}
            </nav>

            {character.nom ? (
              <>
                <h1 className="char-name">{character.nom}</h1>
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
              <h2 className="char-card-title">Attributs</h2>
              <div className="char-stats-grid">
                {(
                  [
                    ['Force', character.force],
                    ['Habilité', character.habilite],
                    ['Connaissances', character.connaissances],
                    ['Culture', character.culture],
                    ['Anticipation', character.anticipation],
                    ['Perception', character.perception],
                  ] as [string, number | undefined][]
                ).map(([label, value]) => (
                  <div key={label} className="char-stat-item">
                    <span className="char-stat-label">{label}</span>
                    <span className="char-stat-value">{stat(value)}</span>
                  </div>
                ))}
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
              <WeaponSlot label="Principale" weapon={asWeapon(character.armePrincipale)} />
              <WeaponSlot label="Secondaire" weapon={asWeapon(character.armeSecondaire)} />
              <WeaponSlot label="Lourde" weapon={asWeapon(character.armeLourde)} />
              <WeaponSlot label="Poing" weapon={asWeapon(character.armeDePoing)} />
              <WeaponSlot label="Mêlée" weapon={asWeapon(character.armeDeMelee)} />
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
