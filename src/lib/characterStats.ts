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
}

// Types simplifiés pour les calculs

export function parseModifier(modStr: string | null | undefined): Record<string, number> {
  if (!modStr) return {}
  const mods: Record<string, number> = {}
  const regex = /([+-]\d+)\s*(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception|Mouv)|(Fo|INT|ANT|Hab|Cha|Pe|Force|Habilité|Connaissances|Culture|Anticipation|Perception|Mouv)\s*([+-]\d+)/gi
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

  let modArmor = totalMods['armure_physique'] || 0
  let modShield = totalMods['armure_bouclier'] || 0
  let modWeight = totalMods['poids_armure'] || 0

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
  const rankInfo = computeRank(character.pointsDeRang ?? 0)

  const asArmor = (v: any): Armor | null => {
    if (!v) return null
    if (typeof v === 'object' && 'item' in v) {
      if (!v.item || typeof v.item === 'string') return null
      return v.item
    }
    if (typeof v === 'string') return null
    return v
  }

  const asMods = (v: any): Mod[] => {
    if (!v) return []
    let mods = []
    if (typeof v === 'object' && 'mods' in v) {
      mods = v.mods ?? []
    } else if (Array.isArray(v)) {
      mods = v
    }
    return mods.filter((m: any) => typeof m === 'object' && m !== null)
  }

  const asWeapon = (v: any): Weapon | null => {
    if (!v) return null
    if (typeof v === 'object' && 'item' in v) {
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
  const totalArmorMods: Record<string, number> = {}

  armorSlotsData.forEach(s => {
    const armor = asArmor(s)
    if (armor) {
      const mods = asMods(s)
      const bridged = getBridgedArmorStats(armor, mods)
      
      totalPhysique += bridged.physique
      totalBouclier += bridged.bouclier
      totalArmorWeight += bridged.poids

      // On ajoute les autres bonus (non bridés pour le moment sauf physique/bouclier/poids)
      Object.entries(bridged.totalMods).forEach(([key, val]) => {
        if (!['armure_physique', 'armure_bouclier', 'poids_armure'].includes(key)) {
          totalArmorMods[key] = (totalArmorMods[key] || 0) + val
        }
      })
      
      // Ajouter les modificateurs intrinsèques de l'armure (champ texte modificateur)
      const armorBaseMods = parseModifier(armor.modificateur)
      Object.entries(armorBaseMods).forEach(([key, val]) => {
        if (key === 'armure_physique') totalPhysique += val
        else if (key === 'armure_bouclier') totalBouclier += val
        else if (key === 'poids_armure') totalArmorWeight -= val
        else totalArmorMods[key] = (totalArmorMods[key] || 0) + val
      })
    }
  })

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
      else totalArmorMods[key] = (totalArmorMods[key] || 0) + val
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

  const getCompetenceValue = (name: string) => {
    const comp = character.competences?.find((c: any) => c.competence === name)
    return comp ? comp.valeur : 0
  }

  const getEpreuveMod = (attrBonus: number, competenceName: string | null, modCible: string) => {
    const compVal = competenceName ? getCompetenceValue(competenceName) : 0
    const bonusMod = totalArmorMods[modCible] || 0
    return attrBonus + 2 * compVal + bonusMod
  }

  const epreuves = {
    vaisseau: [
      { label: 'Pilotage – Chasseur/Léger', value: getEpreuveMod(habiliteDieMod, 'Chasseur', 'epreuve_pilotage_leger') },
      { label: 'Pilotage – Bombardier/Intermédiaire', value: getEpreuveMod(habiliteDieMod, 'Bombardier', 'epreuve_pilotage_intermediaire') },
      { label: 'Pilotage – Corvette/Poids lourds', value: getEpreuveMod(habiliteDieMod, 'Poids Lourds', 'epreuve_pilotage_lourd') },
      { label: 'Pilotage – Frégate/Blindé', value: getEpreuveMod(habiliteDieMod, 'Transport de Troupes', 'epreuve_pilotage_blinde') },
      { label: 'Tir – Pilote', value: getEpreuveMod(perceptionDieMod, null, 'epreuve_tir_pilote') },
      { label: 'Tir – Tourelle', value: getEpreuveMod(perceptionDieMod, 'Canonnier', 'epreuve_tir_tourelle') },
      { label: 'Tir - Véhicule', value: getEpreuveMod(perceptionDieMod, 'Stabilisation', 'epreuve_tir_vehicule') },
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
      { label: 'Tir Fusil/Pistolet', value: getEpreuveMod(perceptionDieMod, 'Assaut', 'epreuve_tir_assaut') },
      { label: 'Tir Sniper', value: getEpreuveMod(perceptionDieMod, 'Sniper', 'epreuve_tir_sniper') },
      { label: 'Tir Shotgun', value: getEpreuveMod(perceptionDieMod, 'Shotgun', 'epreuve_tir_shotgun') },
      { label: 'Frapper au CàC', value: getEpreuveMod(habiliteDieMod, 'Combat rapproché', 'epreuve_cac') },
      { label: 'Premiers soins', value: getEpreuveMod(connaissancesDieMod, 'Médecine de terrain', 'epreuve_soins') },
    ],
  }

  const ba = anticipationDieMod
  const rank = rankInfo.level
  const bf = forceDieMod
  const dodgeBase = 15 + (ba * rank / 2) - ((totalArmorWeight - bf) / 2)
  const decouvert = Math.floor(dodgeBase)

  const dodge = {
    decouvert,
    depourvue: Math.floor(decouvert / 2),
    protege: Math.floor(decouvert * 1.5),
    couvert: Math.floor(decouvert * 2),
  }

  const origin = character.origine || 'Humain'
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
  const movement = Math.floor(xMouv - (totalArmorWeight - bf + totalWeaponWeightFinal) / 2 + bonusMouv)

  return {
    rankInfo,
    totalPhysique: finalTotalPhysique,
    totalBouclier,
    totalArmorWeight,
    totalWeaponWeightFinal,
    completedSets,
    totalArmorMods,
    forceDieMod,
    habiliteDieMod,
    connaissancesDieMod,
    cultureDieMod,
    anticipationDieMod,
    perceptionDieMod,
    epreuves,
    dodge,
    maxHP,
    movement,
    setsMap
  }
}
