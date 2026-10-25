import { computeRank } from './rankSystem'

export type Armor = {
  id: number
  nom: string
  categorie: 'tete' | 'torse' | 'bras' | 'jambes' | 'backpack'
  valeurArmurePhysique?: number | null
  valeurBouclier?: number | null
  valeurRupture?: number | null
  poids?: number | null
  modificateur?: string | null
  set?: number | ArmorSet | null
}

export type ArmorSet = {
  id: number
  nom: string
  bonus: string
}

export type Weapon = {
  id: number
  nom: string
  poids?: number | null
  forceMinimum?: number | null
  tailleChargeur?: number | null
  valeurDegats?: string | null
  projectilesParTir?: number | null
  tempsRechargement?: number | null
  type?: string[] | null
  categorie?: string | null
  porteeFixe?: number | null
  courtePortee?: number | null
  modCourtePortee?: number | null
  moyennePortee?: number | null
  modMoyennePortee?: number | null
  paliersSniper?: { distanceMax: number; modificateur: number }[] | null
  trancheMalusLonguePortee?: number | null
  malusParTranche?: number | null
  valeurChauffe?: number | null
  tempsRefroidissement?: number | null
}

export type Mod = {
  id: number
  nom: string
  effet: string
  modificateurs?: {
    cible: string
    valeur: number
  }[] | null
  bonusConsommables?: {
    categorie: string
    quantite: number
  }[] | null
}

export type GravityLevel = 'zero-g' | 'tres-faible' | 'faible' | 'legere' | 'normale' | 'elevee' | 'forte' | 'tres-forte'

export const GRAVITY_OPTIONS: { label: string; value: GravityLevel }[] = [
  { label: 'Zéro G · 0g', value: 'zero-g' },
  { label: 'Très faible · 0,1g à 0,4g (-3)', value: 'tres-faible' },
  { label: 'Faible · 0,4g à 0,7g (-2)', value: 'faible' },
  { label: 'Légère · 0,7g à 0,9g (-1)', value: 'legere' },
  { label: 'Normale · 0,9g à 1,1g (0)', value: 'normale' },
  { label: 'Élevée · 1,1g à 1,4g (+1)', value: 'elevee' },
  { label: 'Forte · 1,4g à 1,8g (+2)', value: 'forte' },
  { label: 'Très forte · 1,8g à 2,5g (+3)', value: 'tres-forte' },
]

export const GRAVITY_CATEGORY_LABELS: Record<GravityLevel, string> = {
  'zero-g': 'Zéro G',
  'tres-faible': 'Très faible',
  faible: 'Faible',
  legere: 'Légère',
  normale: 'Normale',
  elevee: 'Élevée',
  forte: 'Forte',
  'tres-forte': 'Très forte',
}

const ORDINARY_GRAVITY_LEVELS: GravityLevel[] = [
  'tres-faible', 'faible', 'legere', 'normale', 'elevee', 'forte', 'tres-forte',
]

const GRAVITY_RULES: Record<GravityLevel, {
  weightMultiplier: number
  shotPenalty: number
  optimalRangeMultiplier: number
  movementModifier: number
  zeroGravityMovement: boolean
  notes: string[]
}> = {
  'zero-g': {
    weightMultiplier: 1, shotPenalty: -4, optimalRangeMultiplier: Infinity, movementModifier: 0,
    zeroGravityMovement: true,
    notes: ['Propulsion à 1d10m au càc, 1d4 sur impact de tir et en tirant'],
  },
  'tres-faible': {
    weightMultiplier: 0, shotPenalty: -2, optimalRangeMultiplier: Infinity, movementModifier: 0,
    zeroGravityMovement: false,
    notes: ['Propulsion à 1d10m au càc, 1d4m sur impact tir'],
  },
  faible: {
    weightMultiplier: 0.5, shotPenalty: -1, optimalRangeMultiplier: 2, movementModifier: 0,
    zeroGravityMovement: false,
    notes: ['Propulsion à 1d4m au càc, 1m sur impact de tir'],
  },
  legere: { weightMultiplier: 1, shotPenalty: 0, optimalRangeMultiplier: 1, movementModifier: 1, zeroGravityMovement: false, notes: [] },
  normale: { weightMultiplier: 1, shotPenalty: 0, optimalRangeMultiplier: 1, movementModifier: 0, zeroGravityMovement: false, notes: [] },
  elevee: { weightMultiplier: 1, shotPenalty: 0, optimalRangeMultiplier: 1, movementModifier: -1, zeroGravityMovement: false, notes: [] },
  forte: { weightMultiplier: 1.5, shotPenalty: -2, optimalRangeMultiplier: 0.5, movementModifier: 0, zeroGravityMovement: false, notes: [] },
  'tres-forte': {
    weightMultiplier: 2, shotPenalty: -4, optimalRangeMultiplier: 0.25, movementModifier: 0,
    zeroGravityMovement: false,
    notes: [
      'Sprint impossible',
      'Chaque tour : Lancez 1d20, si le score est inférieur à votre Force, vous subissez un malus de FO -1 pour le reste de la mission (cumulable)',
    ],
  },
}

export function getGravityRules(level: string | null | undefined) {
  return GRAVITY_RULES[level && Object.prototype.hasOwnProperty.call(GRAVITY_RULES, level) ? level as GravityLevel : 'normale']
}

export function getEffectiveGravityLevel(level: string | null | undefined, origin: string | null | undefined): GravityLevel {
  const selectedLevel = level && Object.prototype.hasOwnProperty.call(GRAVITY_RULES, level) ? level as GravityLevel : 'normale'
  if (selectedLevel === 'zero-g' || (origin !== 'Strani' && origin !== 'Vada')) return selectedLevel

  const speciesShift = origin === 'Strani' ? 1 : -1
  const selectedIndex = ORDINARY_GRAVITY_LEVELS.indexOf(selectedLevel)
  const effectiveIndex = Math.max(0, Math.min(ORDINARY_GRAVITY_LEVELS.length - 1, selectedIndex + speciesShift))
  return ORDINARY_GRAVITY_LEVELS[effectiveIndex]
}

// Types simplifiés pour les calculs

export function parseModifier(modStr: string | null | undefined): Record<string, number> {
  if (!modStr) return {}
  const mods: Record<string, number> = {}
  const regex = /([+-]\d+)\s*(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception|Mouv|Mouvement|Dégâts|Portée|Chargeur|Munitions|Refroidissement)|(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception|Mouv|Mouvement|Dégâts|Portée|Chargeur|Munitions|Refroidissement)\s*([+-]\d+)/gi
  let match
  const mapping: Record<string, string> = {
    fo: 'force',
    force: 'force',
    hab: 'habilite',
    habilite: 'habilite',
    int: 'connaissances',
    connaissances: 'connaissances',
    cha: 'culture',
    culture: 'culture',
    ant: 'anticipation',
    anticipation: 'anticipation',
    pe: 'perception',
    perception: 'perception',
    mouv: 'mouvement',
    mouvement: 'mouvement',
    degats: 'degats_flat',
    portee: 'portee_flat',
    chargeur: 'chargeur',
    munitions: 'chargeur',
    refroidissement: 'refroidissement_flat',
  }

  while ((match = regex.exec(modStr)) !== null) {
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

export function getStructuredMods(mods: Mod[]): Record<string, number> {
  const total: Record<string, number> = {}
  mods.forEach((m) => {
    if (m.modificateurs && Array.isArray(m.modificateurs)) {
      m.modificateurs.forEach((mod) => {
        total[mod.cible] = (total[mod.cible] || 0) + mod.valeur
      })
    }
  })
  return total
}

/**
 * Calcule les statistiques d'une pièce d'armure en appliquant les restrictions sur les mods.
 */
export function getBridgedArmorStats(armor: Armor, mods: Mod[]) {
  const totalMods: Record<string, number> = {}
  mods.forEach(m => {
    // Bonus du champ texte "effet"
    const effects = parseModifier(m.effet)
    Object.entries(effects).forEach(([k, v]) => totalMods[k] = (totalMods[k] || 0) + v)
    
    // Bonus des modificateurs structurés
    if (m.modificateurs && Array.isArray(m.modificateurs)) {
      const mapping: Record<string, string> = {
        stat_force: 'force',
        stat_habilite: 'habilite',
        stat_connaissances: 'connaissances',
        stat_culture: 'culture',
        stat_anticipation: 'anticipation',
        stat_perception: 'perception',
        armure_physique: 'armure_physique',
        armure_bouclier: 'armure_bouclier',
        armure_rupture: 'armure_rupture',
        poids: 'poids_armure',
      }
      m.modificateurs.forEach(mod => {
        const key = mapping[mod.cible] || mod.cible
        totalMods[key] = (totalMods[key] || 0) + mod.valeur
      })
    }
  })

  const basePhys = armor.valeurArmurePhysique ?? 0
  const baseBouclier = armor.valeurBouclier ?? 0
  // Rappel: poids de base = valeur armure physique si non spécifié
  const basePoids = armor.poids ?? basePhys

  const modArmor = totalMods['armure_physique'] || 0
  const modShield = totalMods['armure_bouclier'] || 0
  const modWeight = totalMods['poids_armure'] || 0

  // Application des brides : le bonus ne peut excéder le double de la valeur de base
  const appliedBonusPhys = Math.min(modArmor, 2 * basePhys)
  const appliedBonusBouclier = Math.min(modShield, 2 * baseBouclier)

  // Le poids augmente avec l'armure ajoutée (1pt = 1kg)
  // Puis on applique le bonus de poids du mod (souvent positif pour alléger, à soustraire)
  // Le poids final ne peut être inférieur à 0.
  const finalWeight = Math.max(0, basePoids + appliedBonusPhys - modWeight)

  return {
    physique: basePhys + appliedBonusPhys,
    bouclier: baseBouclier + appliedBonusBouclier,
    poids: finalWeight,
    bonusPhysique: appliedBonusPhys,
    bonusBouclier: appliedBonusBouclier,
    bonusPoids: modWeight, // On garde la valeur brute du mod pour info ou on peut mettre la diff
    totalMods,
  }
}

export function calculateStats(character: any) {
  const weaponGravity = getGravityRules(character.facteurGravite)
  const rankInfo = computeRank(character.pointsDeRang ?? 0)

  const bonusSources: Record<string, { source: string; value: number }[]> = {}
  const totalArmorMods: Record<string, number> = {}
  const addBonus = (key: string, value: number, source: string) => {
    if (!value) return
    if (!bonusSources[key]) bonusSources[key] = []
    bonusSources[key].push({ source, value })
    totalArmorMods[key] = (totalArmorMods[key] || 0) + value
  }

  const asArmor = (v: any): Armor | null => {
    if (!v) return null
    if (typeof v === 'object' && v.customItem && typeof v.customItem === 'object') {
      const custom = v.customItem
      const properties = custom.proprietesFigees
      if (!properties || typeof properties !== 'object') return null
      return { ...properties, id: custom.id, nom: custom.nom ?? properties.nom, categorie: custom.categorie ?? properties.categorie, set: custom.set ?? properties.set } as Armor
    }
    if (typeof v === 'object' && 'item' in v) {
      if (v.customItem && typeof v.customItem === 'object') return asArmor({ customItem: v.customItem })
      if (!v.item || typeof v.item === 'string') return null
      return v.item
    }
    if (typeof v === 'string') return null
    return v
  }

  const asMods = (v: any): Mod[] => {
    if (!v) return []
    let mods = []
    if (typeof v === 'object' && v.customItem && typeof v.customItem === 'object') {
      mods = v.customItem.mods ?? []
    } else
    if (typeof v === 'object' && 'mods' in v) {
      mods = v.mods ?? []
    } else if (Array.isArray(v)) {
      mods = v
    }
    return mods.filter((m: any) => typeof m === 'object' && m !== null)
  }

  const asWeapon = (v: any): Weapon | null => {
    if (!v) return null
    if (typeof v === 'object' && v.customItem && typeof v.customItem === 'object') {
      const custom = v.customItem
      const properties = custom.proprietesFigees
      if (!properties || typeof properties !== 'object') return null
      return { ...properties, id: custom.id, nom: custom.nom ?? properties.nom, categorie: custom.categorie ?? properties.categorie } as Weapon
    }
    if (typeof v === 'object' && 'item' in v) {
      if (v.customItem && typeof v.customItem === 'object') return asWeapon({ customItem: v.customItem })
      if (!v.item || typeof v.item === 'string') return null
      return v.item
    }
    if (typeof v === 'string') return null
    return v
  }

  const armorSlotsData = [
    character.armureTete,
    character.armureTorse,
    character.armureBras,
    character.armureJambes,
    character.armureBackpack,
  ]

  let totalPhysique = 0
  let totalBouclier = 0
  let totalArmorWeight = 0

  armorSlotsData.forEach(s => {
    const armor = asArmor(s)
    if (armor) {
      const mods = asMods(s)
      const bridged = getBridgedArmorStats(armor, mods)
      
      totalPhysique += bridged.physique
      totalBouclier += bridged.bouclier
      totalArmorWeight += bridged.poids

      // Collecte des sources de bonus pour les infobulles
      mods.forEach(m => {
        // Bonus du champ texte "effet"
        const effects = parseModifier(m.effet)
        Object.entries(effects).forEach(([k, v]) => addBonus(k, v, `Mod: ${m.nom} (${armor.nom})`))
        
        // Bonus des modificateurs structurés
        if (m.modificateurs && Array.isArray(m.modificateurs)) {
          const mapping: Record<string, string> = {
            stat_force: 'force',
            stat_habilite: 'habilite',
            stat_connaissances: 'connaissances',
            stat_culture: 'culture',
            stat_anticipation: 'anticipation',
            stat_perception: 'perception',
          }
          m.modificateurs.forEach(mod => {
            const key = mapping[mod.cible] || mod.cible
            if (!['armure_physique', 'armure_bouclier', 'armure_rupture', 'poids'].includes(mod.cible)) {
              addBonus(key, mod.valeur, `Mod: ${m.nom} (${armor.nom})`)
            }
          })
        }
      })
      
      // Ajouter les modificateurs intrinsèques de l'armure (champ texte modificateur)
      const armorBaseMods = parseModifier(armor.modificateur)
      Object.entries(armorBaseMods).forEach(([key, val]) => {
        if (!['armure_physique', 'armure_bouclier', 'poids_armure'].includes(key)) {
          addBonus(key, val, `Armure: ${armor.nom}`)
        }
      })
    }
  })

  // Bonus/malus de caractéristiques accordé par l'origine du personnage.
  // Ils passent par les mêmes sources que les mods d'armure afin d'apparaître
  // dans les breakdowns des bulles d'information.
  const origin = character.origine || 'Humain'
  const effectiveGravityLevel = getEffectiveGravityLevel(character.facteurGravite, origin)
  const gravity = getGravityRules(effectiveGravityLevel)
  if (origin === 'Strani') {
    addBonus('perception', 2, 'Origine : Strani')
    addBonus('force', -2, 'Origine : Strani')
  } else if (origin === 'Vada') {
    addBonus('force', 2, 'Origine : Vada')
    addBonus('perception', -2, 'Origine : Vada')
  }

  const weapons = [
    asWeapon(character.armePrincipale),
    asWeapon(character.armeSecondaire),
    asWeapon(character.armeLourde),
    asWeapon(character.armeDeMelee),
  ].filter(Boolean) as Weapon[]

  const totalWeaponWeight = weapons.reduce((acc, w) => acc + (w.poids ?? 0), 0)
  
  const weaponMods = [
    ...asMods(character.armePrincipale),
    ...asMods(character.armeSecondaire),
    ...asMods(character.armeLourde),
    ...asMods(character.armeDeMelee),
  ]
  const structuredWeaponMods = getStructuredMods(weaponMods)
  const reductionPoidsArmes = structuredWeaponMods['poids'] || 0
  if (reductionPoidsArmes) {
    addBonus('poids_armes_reduction', reductionPoidsArmes, "Mods d'armes (allègement)")
  }
  const totalWeaponWeightFinal = Math.max(0, totalWeaponWeight - reductionPoidsArmes)

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

  completedSets.forEach(s => {
    const setMods = parseModifier(s.set.bonus)
    Object.entries(setMods).forEach(([key, val]) => {
      if (key === 'armure_physique') totalPhysique += val
      else if (key === 'armure_bouclier') totalBouclier += val
      else {
        addBonus(key, val, `Set: ${s.set.nom}`)
      }
    })
  })

  const finalTotalPhysique = Math.max(0, totalPhysique)

  const getDieMod = (key: string, baseValue: number | undefined) => {
    const bonus = totalArmorMods[key] || 0
    const malusKey = `malus${key.charAt(0).toUpperCase()}${key.slice(1)}`
    const malus = character[malusKey] || 0
    const total = (baseValue || 0) + bonus - malus
    return Math.floor((total - 10) / 2)
  }

  const forceDieMod = getDieMod('force', character.force)
  const habiliteDieMod = getDieMod('habilite', character.habilite)
  const connaissancesDieMod = getDieMod('connaissances', character.connaissances)
  const cultureDieMod = getDieMod('culture', character.culture)
  const anticipationDieMod = getDieMod('anticipation', character.anticipation)
  const perceptionDieMod = getDieMod('perception', character.perception)

  const maxKits = Math.max(0, connaissancesDieMod)

  const getCompetenceValue = (name: string) => {
    const comp = character.competences?.find((c: any) => c.competence === name)
    return comp ? comp.valeur : 0
  }

  const getEpreuveMod = (attrBonus: number, competenceName: string | null, modCible: string) => {
    const compVal = competenceName ? getCompetenceValue(competenceName) : 0
    const bonusMod = totalArmorMods[modCible] || 0
    return attrBonus + 2 * compVal + bonusMod
  }

  const getTirEpreuveMod = (attrBonus: number, competenceName: string | null, modCible: string) =>
    getEpreuveMod(attrBonus, competenceName, modCible) + gravity.shotPenalty

  const epreuves = {
    vaisseau: [
      { label: 'Pilotage – Chasseur/Léger', value: getEpreuveMod(habiliteDieMod, 'Chasseur', 'epreuve_pilotage_leger') },
      { label: 'Pilotage – Bombardier/Intermédiaire', value: getEpreuveMod(habiliteDieMod, 'Bombardier', 'epreuve_pilotage_intermediaire') - 5 },
      { label: 'Pilotage – Corvette/Poids lourds', value: getEpreuveMod(habiliteDieMod, 'Poids Lourds', 'epreuve_pilotage_lourd') - 10 },
      { label: 'Pilotage – Frégate/Blindé', value: getEpreuveMod(habiliteDieMod, 'Transport de Troupes', 'epreuve_pilotage_blinde') - 15 },
      { label: 'Tir – Pilote', value: getTirEpreuveMod(perceptionDieMod, null, 'epreuve_tir_pilote') },
      { label: 'Tir – Tourelle', value: getTirEpreuveMod(perceptionDieMod, 'Canonnier', 'epreuve_tir_tourelle') },
      { label: 'Tir - Véhicule', value: getTirEpreuveMod(perceptionDieMod, 'Stabilisation', 'epreuve_tir_vehicule') },
    ],
    pacifiques: [
      { label: 'Réparation', value: getEpreuveMod(connaissancesDieMod, 'Mécanicien', 'epreuve_reparation') },
      { label: 'Négocier / Influencer', value: getEpreuveMod(cultureDieMod, 'Diplomate', 'epreuve_negocier') },
      { label: 'Crypter / Décrypter / Analyse', value: getEpreuveMod(connaissancesDieMod, 'Analyse', 'epreuve_analyse') },
      { label: 'Culture', value: getEpreuveMod(cultureDieMod, 'Culture', 'epreuve_culture') },
      { label: 'Discrétion', value: getEpreuveMod(anticipationDieMod, 'Furtivité', 'epreuve_discretion') },
    ],
    combat: [
      { label: 'Initiative', value: getEpreuveMod(anticipationDieMod, 'Réactivité', 'epreuve_initiative') },
      { label: 'Tir Fusil/Pistolet', value: getTirEpreuveMod(perceptionDieMod, 'Assaut', 'epreuve_tir_assaut') },
      { label: 'Tir Sniper', value: getTirEpreuveMod(perceptionDieMod, 'Sniper', 'epreuve_tir_sniper') },
      { label: 'Tir Shotgun', value: getTirEpreuveMod(perceptionDieMod, 'Shotgun', 'epreuve_tir_shotgun') },
      { label: 'Frapper au CàC', value: getEpreuveMod(habiliteDieMod, 'Combat rapproché', 'epreuve_cac') },
      { label: 'Premiers soins', value: getEpreuveMod(connaissancesDieMod, 'Médecine de terrain', 'epreuve_soins') },
    ],
  }

  const ba = anticipationDieMod
  const rank = rankInfo.level
  const bf = forceDieMod
  const armorWeightForCalculations = totalArmorWeight * gravity.weightMultiplier
  const weaponWeightForCalculations = totalWeaponWeightFinal * gravity.weightMultiplier
  const dodgeBase = 15 + (ba * rank / 2) - ((armorWeightForCalculations - bf) / 2)
  const decouvert = Math.floor(dodgeBase)

  const dodge = {
    decouvert,
    depourvue: Math.floor(decouvert / 2),
    protege: Math.floor(decouvert * 1.5),
    couvert: Math.floor(decouvert * 2),
  }

  const n = character.bonusPointsDeBlessures || 0
  let hpBase = 30
  let hpFactor = 5
  if (origin === 'Strani') {
    hpBase = 20
    hpFactor = 4
  } else if (origin === 'Vada') {
    hpBase = 40
    hpFactor = 6
  }
  const maxHP = Math.floor((hpBase + hpFactor * bf + bf * (rank - 1)) / 3 + n)

  let xMouv = 10
  if (origin === 'Strani') xMouv = 14
  else if (origin === 'Vada') xMouv = 6
  const bonusMouv = totalArmorMods['mouvement'] || 0
  const movement = gravity.zeroGravityMovement
    ? 2 + forceDieMod
    : xMouv - Math.floor((armorWeightForCalculations - bf + weaponWeightForCalculations) / 2) + bonusMouv + gravity.movementModifier

  // Construction du breakdown pour les infobulles
  const breakdown: Record<string, any> = {
    maxHP: {
      label: "Blessures Max",
      formula: "⌊(Base_Origine + Facteur * BF + BF * (Rang - 1)) / 3 + Bonus⌋",
      components: [
        { label: `Base (Origine: ${origin})`, value: hpBase },
        { label: `Facteur (Origine: ${origin})`, value: hpFactor },
        { label: "BF (Force)", value: bf },
        { label: "Rang", value: rank },
        { label: "Bonus Blessures", value: n, source: "Attribut personnage" }
      ]
    },
    movement: {
      label: "Mouvement",
      formula: gravity.zeroGravityMovement
        ? "2 + Mod.Fo"
        : "Base_Origine - ⌊(Poids_Armures × Gravité - BF + Poids_Armes × Gravité) / 2⌋ + Bonus_Mouv + Modificateur_Gravité",
      components: [
        { label: gravity.zeroGravityMovement ? '2' : `Base (Origine: ${origin})`, value: gravity.zeroGravityMovement ? 2 : xMouv },
        ...(gravity.zeroGravityMovement ? [] : [{ label: "Poids Armures (calcul)", value: armorWeightForCalculations, sub: `Poids cumulé des armures bridées × ${gravity.weightMultiplier}` }]),
        { label: "BF (Force)", value: bf },
        ...(gravity.zeroGravityMovement ? [] : [{ label: "Poids Armes (calcul)", value: weaponWeightForCalculations, sub: `Poids total - Allègement, × ${gravity.weightMultiplier}` }]),
        ...(gravity.zeroGravityMovement ? [] : [
          { label: "Bonus Mouvement", value: bonusMouv },
          { label: "Modificateur de gravité", value: gravity.movementModifier },
        ]),
      ]
    },
    dodge: {
      label: "Esquive (Découvert)",
      formula: "15 + (BA * Rang / 2) - ((Poids_Armures × Gravité - BF) / 2)",
      components: [
        { label: "Base fixe", value: 15 },
        { label: "BA (Anticipation)", value: ba },
        { label: "Rang", value: rank },
        { label: "Poids Armures (calcul)", value: armorWeightForCalculations },
        { label: "BF (Force)", value: bf }
      ]
    }
  }

  // Ajout des caractéristiques au breakdown
  const statsKeys = [
    ['force', 'Force', character.force, character.malusForce],
    ['habilite', 'Habilité', character.habilite, character.malusHabilite],
    ['connaissances', 'Connaissances', character.connaissances, character.malusConnaissances],
    ['culture', 'Culture', character.culture, character.malusCulture],
    ['anticipation', 'Anticipation', character.anticipation, character.malusAnticipation],
    ['perception', 'Perception', character.perception, character.malusPerception],
  ]

  statsKeys.forEach(([key, label, base, malus]: any) => {
    const components: { label: string; value: any; source?: string; sub?: string }[] = [
      { label: "Base", value: base || 0 }
    ]
    if (bonusSources[key]) {
      bonusSources[key].forEach(s => {
        components.push({ label: s.source, value: s.value })
      })
    }
    if (malus) {
      components.push({ label: "Malus", value: -malus, source: "Attribut personnage" })
    }

    breakdown[key] = {
      label,
      formula: "Base + Σ(Bonus) - Malus",
      dieFormula: "⌊(Total - 10) / 2⌋",
      components
    }
  })

  return {
    rankInfo,
    totalPhysique: finalTotalPhysique,
    totalBouclier,
    totalArmorWeight,
    totalWeaponWeightFinal,
    gravity,
    weaponGravity,
    effectiveGravityLevel,
    armorWeightForCalculations,
    weaponWeightForCalculations,
    completedSets,
    totalArmorMods,
    forceDieMod,
    habiliteDieMod,
    connaissancesDieMod,
    cultureDieMod,
    anticipationDieMod,
    perceptionDieMod,
    maxKits,
    epreuves,
    dodge,
    maxHP,
    movement,
    setsMap,
    breakdown,
    bonusSources
  }
}
