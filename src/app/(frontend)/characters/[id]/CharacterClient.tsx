'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateStats, getStructuredMods } from '@/lib/characterStats'
import { updateCharacterSkills } from './actions'
import { MalusInput } from './MalusInput'

type CharacterProps = {
  character: any
  isAdmin: boolean
  isOwner: boolean
  allBaseSkills: string[]
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

export function CharacterClient({ character: initialCharacter, isAdmin, isOwner, allBaseSkills }: CharacterProps) {
  useRouter();
  const [character, setCharacter] = useState(initialCharacter)
  const [isModified, setIsModified] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showLearnNewSkill, setShowLearnNewSkill] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [hoveredItem, setHoveredItem] = useState<{item: any, type: string, mods?: any[], x: number, y: number} | null>(null)

  // Statistiques calculées en temps réel
  const stats = useMemo(() => calculateStats(character), [character])

  // Empêcher de quitter sans sauvegarder
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isModified) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isModified])

  const handleLevelUp = (skillName: string) => {
    const currentVal = character.competences?.find((c: any) => c.competence === skillName)?.valeur ?? 0
    const cost = currentVal + 1
    
    if (character.pointsDeCompetence >= cost) {
      const newCompetences = [...(character.competences ?? [])]
      const skillIdx = newCompetences.findIndex((c: any) => c.competence === skillName)
      
      if (skillIdx > -1) {
        newCompetences[skillIdx] = { ...newCompetences[skillIdx], valeur: currentVal + 1 }
      } else {
        newCompetences.push({ competence: skillName, valeur: 1 })
      }

      setCharacter({
        ...character,
        competences: newCompetences,
        pointsDeCompetence: character.pointsDeCompetence - cost
      })
      setIsModified(true)
    }
  }

  const handleLearnNewSkill = (skillName: string) => {
    if (character.pointsDeCompetence >= 1) {
      const newCompetences = [...(character.competences ?? []), { competence: skillName, valeur: 1 }]
      setCharacter({
        ...character,
        competences: newCompetences,
        pointsDeCompetence: character.pointsDeCompetence - 1
      })
      setIsModified(true)
      setShowLearnNewSkill(false)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      if (isModified) {
        if (!confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?')) {
          window.history.pushState(null, '', window.location.href)
        }
      }
    }
    if (isModified) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isModified])

  const handleCancel = () => {
    if (confirm('Voulez-vous vraiment annuler toutes les modifications ?')) {
      setCharacter(initialCharacter)
      setIsModified(false)
      setShowLearnNewSkill(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCharacterSkills(character.id, {
        competences: character.competences,
        pointsDeCompetence: character.pointsDeCompetence
      })
      setIsModified(false)
      // On ne reset pas le character local car il est déjà à jour, 
      // et la revalidation du serveur mettra à jour initialCharacter via les props.
      alert('Modifications enregistrées !')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

  // Liste des compétences non apprises
  const learnedSkills = character.competences?.map((c: any) => c.competence) ?? []
  const availableSkills = allBaseSkills.filter(s => !learnedSkills.includes(s))

  // Données d'inventaire filtrées (ne pas afficher ce qui est équipé)
  const inventoryData = useMemo(() => {
    const equippedArmorIds = [
      character.armureTete?.item?.id || character.armureTete?.id || character.armureTete,
      character.armureTorse?.item?.id || character.armureTorse?.id || character.armureTorse,
      character.armureBras?.item?.id || character.armureBras?.id || character.armureBras,
      character.armureJambes?.item?.id || character.armureJambes?.id || character.armureJambes,
      character.armureBackpack?.item?.id || character.armureBackpack?.id || character.armureBackpack,
    ].filter(id => id != null && typeof id !== 'object').map(id => String(id))

    const equippedWeaponIds = [
      character.armePrincipale?.item?.id || character.armePrincipale?.id || character.armePrincipale,
      character.armeSecondaire?.item?.id || character.armeSecondaire?.id || character.armeSecondaire,
      character.armeLourde?.item?.id || character.armeLourde?.id || character.armeLourde,
      character.armeDeMelee?.item?.id || character.armeDeMelee?.id || character.armeDeMelee,
    ].filter(id => id != null && typeof id !== 'object').map(id => String(id))

    const equippedConsumableIds = [
      character.consommableEquipe1?.id || character.consommableEquipe1,
      character.consommableEquipe2?.id || character.consommableEquipe2,
      character.consommableEquipe3?.id || character.consommableEquipe3,
    ].filter(id => id != null && typeof id !== 'object').map(id => String(id))
    
    const equippedChipIds = [
      character.puceMk1?.id || character.puceMk1,
      character.puceMk2?.id || character.puceMk2,
      character.puceMk3?.id || character.puceMk3,
    ].filter(id => id != null && typeof id !== 'object').map(id => String(id))

    const weapons = (character.inventaireArmes || []).filter((w: any) => {
      const itemId = typeof w.item === 'object' ? w.item?.id : w.item
      return !equippedWeaponIds.includes(String(itemId))
    })
    const armors = (character.inventaireArmures || []).filter((a: any) => {
      const itemId = typeof a.item === 'object' ? a.item?.id : a.item
      return !equippedArmorIds.includes(String(itemId))
    })
    const puces = (character.inventairePuces || []).filter((p: any) => !equippedChipIds.includes(String(p.id || p)))
    const consumables = (character.inventaire || []).filter((c: any) => {
      const item = c.consommable
      const itemId = typeof item === 'object' ? item.id : item
      return !equippedConsumableIds.includes(String(itemId))
    })
    const mods = character.inventaireMods || []

    return [
      { id: 'weapons', label: 'Armes', items: weapons },
      { id: 'armors', label: 'Armures', items: armors },
      { id: 'mods', label: 'Mods', items: mods },
      { id: 'chips', label: 'Puces', items: puces },
      { id: 'consumables', label: 'Consommables', items: consumables },
    ].filter(cat => cat.items.length > 0)
  }, [character])

  // Valeur de stockage pour les consommables équipés
  const backpackItem = character.armureBackpack?.item || character.armureBackpack
  const storageValue = (typeof backpackItem === 'object' ? backpackItem?.stockage : 0) || 0

  // Helper image
  const renderItemImage = (item: any) => {
    const img = item.image
    if (!img) return null
    const url = typeof img === 'object' ? img.url : img
    if (!url) return null
    return (
      <div className="char-item-image">
        <img src={url} alt={item.nom} />
      </div>
    )
  }

  // Contenu détaillé d'une arme
  const renderWeaponInner = (weapon: any, mods: any[] = []) => {
    const isMelee = weapon.categorie === 'melee'
    const isHeavy = weapon.categorie === 'lourde'
    const isSniper = weapon.categorie === 'sniper'
    const isThermique = weapon.type?.includes('thermique')
    const isPlasma = weapon.type?.includes('plasma')
    const structuredMods = getStructuredMods(mods)

    const bonusProjectiles = structuredMods['indicator_projectiles'] || 0
    const totalProjectiles = (weapon.projectilesParTir ?? 1) + bonusProjectiles
    const showProjectiles = totalProjectiles != null && !isThermique && !isPlasma

    const damageColorClass = (weapon.type?.[0]) ? `weapon-type-${weapon.type[0]}` : ''

    const getFinalDamageData = () => {
      let baseDamage = weapon.valeurDegats
      if (!baseDamage) return null
      let bonus = 0
      let multiplier = baseDamage.endsWith('*') ? 2 : 1
      const cleanDamage = baseDamage.replace('*', '').replace('!', '')

      if (isMelee) bonus = stats.forceDieMod * multiplier
      else if (!isHeavy && !isPlasma) bonus = stats.perceptionDieMod * multiplier

      bonus += structuredMods['degats_flat'] || 0
      if (isMelee) bonus += (structuredMods['degats_mod_fo_x1'] || 0) * stats.forceDieMod
      if (weapon.categorie === 'shotgun') bonus += (structuredMods['degats_mod_pe_x1'] || 0) * stats.perceptionDieMod

      const finalDamageStr = bonus === 0 ? baseDamage : `${cleanDamage}${bonus > 0 ? '+' : ''}${bonus}${baseDamage.endsWith('!') ? '!' : ''}`
      const diceMatch = cleanDamage.match(/(\d+)d(\d+)(?:([+-]\d+))?/)
      let min = 0, avg = 0, max: number | null = 0
      const isExplosive = baseDamage.endsWith('!')
      if (diceMatch) {
        const count = parseInt(diceMatch[1])
        const faces = parseInt(diceMatch[2])
        const fixed = parseInt(diceMatch[3] || '0')
        min = count + fixed + bonus
        if (isExplosive) {
          const expDie = ((faces + 1) / 2) * (faces / (faces - 1))
          avg = count * expDie + fixed + bonus
          max = null
        } else {
          avg = count * ((faces + 1) / 2) + fixed + bonus
          max = count * faces + fixed + bonus
        }
      }
      return { display: finalDamageStr, min: Math.floor(min), avg: Math.round(avg), max: max !== null ? Math.floor(max) : null }
    }

    const damageData = getFinalDamageData()

    const renderRangeTable = () => {
      const rows: { label: string; mod: string }[] = []
      const bonusPC = structuredMods['mod_portee_courte'] || 0
      const bonusPM = structuredMods['mod_portee_moyenne'] || 0
      const addPC = structuredMods['portee_courte'] || 0
      const addPM = structuredMods['portee_moyenne'] || 0

      if (isMelee) rows.push({ label: `< ${weapon.porteeFixe ?? 1}m`, mod: '0' })
      else if (isHeavy) rows.push({ label: `Max ${weapon.porteeFixe ?? 50}m`, mod: '0' })
      else if (isSniper) {
        const cpVal = (weapon.courtePortee ?? 0) + addPC
        const cpMod = (weapon.modCourtePortee ?? 0) + bonusPC
        rows.push({ label: `< ${cpVal}m`, mod: cpMod >= 0 ? `+${cpMod}` : `${cpMod}` })
        weapon.paliersSniper?.forEach((p: any) => {
          const pMod = (p.modificateur ?? 0) + bonusPC
          rows.push({ label: `< ${p.distanceMax}m`, mod: pMod >= 0 ? `+${pMod}` : `${pMod}` })
        })
      } else {
        if (weapon.courtePortee != null) {
          const cpVal = weapon.courtePortee + addPC
          const cpMod = (weapon.modCourtePortee ?? 0) + bonusPC
          rows.push({ label: `< ${cpVal}m`, mod: cpMod >= 0 ? `+${cpMod}` : `${cpMod}` })
        }
        if (weapon.moyennePortee != null) {
          const mpVal = weapon.moyennePortee + addPM
          const mpMod = (weapon.modMoyennePortee ?? 0) + bonusPM
          rows.push({ label: `< ${mpVal}m`, mod: mpMod >= 0 ? `+${mpMod}` : `${mpMod}` })
        }
      }
      if (!isMelee && !isHeavy && weapon.trancheMalusLonguePortee) {
        rows.push({ label: `+${weapon.trancheMalusLonguePortee}m`, mod: (weapon.malusParTranche ?? -1) >= 0 ? `+${weapon.malusParTranche}` : `${weapon.malusParTranche}` })
      }
      if (rows.length === 0) return null
      return (
        <table className="weapon-range-table">
          <thead><tr>{rows.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
          <tbody><tr>{rows.map((r, i) => <td key={i}>{r.mod}</td>)}</tr></tbody>
        </table>
      )
    }

    const bonusChargeur = structuredMods['chargeur'] || 0
    const bonusChargeurPct = structuredMods['chargeur_pct'] || 0
    const finalChargeur = Math.ceil((weapon.tailleChargeur ?? 0) * (1 + bonusChargeurPct / 100)) + bonusChargeur

    return (
      <div className="char-equip-item">
        {renderItemImage(weapon)}
        <span className="char-equip-item-name">{weapon.nom}</span>
        <div className="char-equip-item-stats">
          {damageData && (
            <div className="weapon-damage-block">
              <div className={`weapon-damage-badge ${damageColorClass}`}>
                <span className="weapon-damage-icon">⚔️</span>
                <span className="weapon-damage-value">{damageData.display}</span>
              </div>
              {!isPlasma && (
                <div className="weapon-damage-details">
                  <div className="damage-stat"><span className="damage-stat-label">MIN</span><span className="damage-stat-val">{damageData.min}</span></div>
                  <div className="damage-stat highlight"><span className="damage-stat-label">MOY</span><span className="damage-stat-val">{damageData.avg}</span></div>
                  {damageData.max !== null && <div className="damage-stat"><span className="damage-stat-label">MAX</span><span className="damage-stat-val">{damageData.max}</span></div>}
                </div>
              )}
            </div>
          )}
          <div className="weapon-utility-stats">
            {weapon.tailleChargeur != null && <div className="weapon-util-item" title="Chargeur"><span className="util-icon">📦</span><span className="util-value">{finalChargeur}</span></div>}
            {showProjectiles && <div className="weapon-util-item" title="Projectiles/tir"><span className="util-icon">×</span><span className="util-value">{totalProjectiles}</span></div>}
            {weapon.tempsRechargement != null && <div className="weapon-util-item" title="Rechargement"><span className="util-icon">🔄</span><span className="util-value">{weapon.tempsRechargement}t</span></div>}
            {weapon.poids != null && <div className="weapon-util-item" title="Poids"><span className="util-icon">⚖️</span><span className="util-value">{Math.max(0, weapon.poids + (structuredMods['poids'] || 0))}kg</span></div>}
            {isThermique && weapon.valeurChauffe != null && <div className="weapon-util-item" title="Valeur de chauffe"><span className="util-icon">🔥</span><span className="util-value">{weapon.valeurChauffe}%</span></div>}
            {isThermique && weapon.tempsRefroidissement != null && <div className="weapon-util-item" title="Refroidissement"><span className="util-icon">❄️</span><span className="util-value">{Math.round(weapon.tempsRefroidissement * (1 + (structuredMods['refroidissement_pct'] || 0) / 100))}%</span></div>}
          </div>
        </div>
        {renderRangeTable()}
        {mods.length > 0 && (
          <div className="char-equip-item-mods-list">
            {mods.map((m: any) => <div key={m.id} className="char-equip-mod-item" title={m.effet}>🔧 {m.nom}</div>)}
          </div>
        )}
      </div>
    )
  }

  // Contenu détaillé d'une armure
  const renderArmorInner = (armorPiece: any, mods: any[] = []) => {
    const structuredMods = getStructuredMods(mods)
    const bonusPhysique = structuredMods['armure_physique'] || 0
    const bonusBouclier = structuredMods['armure_bouclier'] || 0
    const bonusRupture = structuredMods['armure_rupture'] || 0

    let setInfo = null
    if (armorPiece.set) {
      const sId = typeof armorPiece.set === 'object' ? armorPiece.set.id : armorPiece.set
      const info = stats.setsMap.get(sId)
      if (info) setInfo = { name: info.set.nom, count: info.count }
    }

    return (
      <div className="char-equip-item">
        {renderItemImage(armorPiece)}
        <span className="char-equip-item-name">{armorPiece.nom}</span>
        <div className="char-equip-item-stats">
          {armorPiece.valeurArmurePhysique != null && (
            <span title="Armure physique" className="stats-physique">
              🛡️ {armorPiece.valeurArmurePhysique + bonusPhysique}
            </span>
          )}
          {armorPiece.valeurBouclier != null && (
            <span title="Bouclier" className="stats-bouclier">
              ⚡ {armorPiece.valeurBouclier + bonusBouclier}
            </span>
          )}
          {armorPiece.valeurRupture != null && (
            <span title="Rupture" className="stats-rupture">
              💥 1 à {Math.max(0, armorPiece.valeurRupture + bonusRupture)}
            </span>
          )}
        </div>
        {armorPiece.modificateur && <div className="char-equip-item-mod-base">Mod: {armorPiece.modificateur}</div>}
        {mods.length > 0 && (
          <div className="char-equip-item-mods-list">
            {mods.map((m: any) => (
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
    )
  }

  // Contenu détaillé d'un mod
  const renderModInner = (mod: any) => (
    <div className="char-equip-item">
      <span className="char-equip-item-name">{mod.nom}</span>
      <div className="char-equip-item-mod-base">Effet: {mod.effet}</div>
    </div>
  )

  // Contenu détaillé d'une puce
  const renderChipInner = (chip: any) => (
    <div className="char-equip-item">
      <span className="char-equip-item-name">{chip.nom}</span>
      <div className="char-equip-item-stats">
        <span className="ss-tag">{chip.categorie}</span>
      </div>
      <div className="char-equip-item-mod-base">{chip.effet}</div>
      {chip.cooldown && <div className="char-equip-item-mod-base">Cooldown: {chip.cooldown}t</div>}
    </div>
  )

  // Contenu détaillé d'un consommable
  const renderConsumableInner = (item: any) => (
    <div className="char-equip-item">
      {renderItemImage(item)}
      <span className="char-equip-item-name">{item.nom}</span>
      <div className="char-equip-item-stats">
        <span className="ss-tag">{item.categorie}</span>
      </div>
      {item.effet && <div className="char-equip-item-mod-base">{item.effet}</div>}
      {item.epreuve && <div className="char-equip-item-mod-base">Épreuve: {item.epreuve} ({ (item.modificateurEpreuve ?? 0) >= 0 ? '+' : '' }{item.modificateurEpreuve ?? 0})</div>}
    </div>
  )

  // Helper rendu armure
  const renderArmorSlot = (label: string, armor: any, mods: any[] = []) => {
    const armorPiece = armor?.item || armor
    const isEquipped = !!armorPiece && typeof armorPiece !== 'string'
    
    return (
      <div className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}>
        <span className="char-equip-slot-label">{label}</span>
        {isEquipped ? renderArmorInner(armorPiece, mods) : (
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">🛡️</span>
            <span className="char-equip-empty-text">Non équipé</span>
          </div>
        )}
      </div>
    )
  }

  // Helper rendu arme
  const renderWeaponSlot = (label: string, weaponGroup: any) => {
    const weapon = weaponGroup?.item
    const mods = weaponGroup?.mods || []
    const isEquipped = !!weapon && typeof weapon !== 'string'
    
    if (!isEquipped) {
      return (
        <div className="char-equip-slot char-equip-slot-empty">
          <span className="char-equip-slot-label">{label}</span>
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">🔫</span>
            <span className="char-equip-empty-text">Non équipé</span>
          </div>
        </div>
      )
    }

    return (
      <div className="char-equip-slot">
        <span className="char-equip-slot-label">{label}</span>
        {renderWeaponInner(weapon, mods)}
      </div>
    )
  }

  const renderConsumableSlot = (label: string, consumable: any) => {
    const item = consumable
    const isEquipped = !!item && typeof item !== 'string'

    return (
      <div className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}>
        <span className="char-equip-slot-label">{label}</span>
        {isEquipped ? renderConsumableInner(item) : (
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">🧪</span>
            <span className="char-equip-empty-text">Vide</span>
          </div>
        )}
      </div>
    )
  }

  const handleMouseEnter = (e: React.MouseEvent, itemObj: any, type: string) => {
    let item = itemObj
    let mods: any[] = []
    
    if (type === 'weapons' || type === 'armors') {
      item = itemObj.item
      mods = itemObj.mods || []
    } else if (type === 'consumables') {
      item = itemObj.consommable
    }

    setHoveredItem({
      item,
      type,
      mods,
      x: e.clientX,
      y: e.clientY
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredItem) {
      setHoveredItem({ ...hoveredItem, x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseLeave = () => {
    setHoveredItem(null)
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  return (
    <div className={`ss-root char-root ${isModified ? 'is-editing' : ''}`}>
      <div className="char-layout">
        {/* ── En-tête ── */}
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              {isAdmin && <><a href="/characters">Personnages</a><span aria-hidden="true">›</span></>}
              <span>{isOwner ? 'Mon personnage' : (character.nom ?? 'Personnage')}</span>
            </nav>

            <div className="char-name-container">
              <h1 className="char-name">{character.nom || 'Personnage en cours de création'}</h1>
            </div>
            
            <div className="char-tags">
              {character.origine && <span className="ss-tag">{character.origine}</span>}
              {character.sexe && <span className="ss-tag">{character.sexe}</span>}
              {character.affiliation && <span className={`ss-tag char-tag-affil-${character.affiliation.toLowerCase()}`}>{character.affiliation}</span>}
            </div>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="char-content ss-container">

          {/* ── Rangée 1 : Identité + Attributs ── */}
          <div className="char-row char-row-top">
            <div className="char-card char-card-identity">
              <h2 className="char-card-title">Identité</h2>
              <div className={`char-rank char-rank--${rankTier(stats.rankInfo.level)}`}>
                <div className="char-rank-header">
                  <span className="char-rank-badge">Rang {stats.rankInfo.level}</span>
                  <span className="char-rank-name">{stats.rankInfo.name}</span>
                </div>
                <div className="char-rank-bar-track"><div className="char-rank-bar-fill" style={{ width: `${stats.rankInfo.progressPercent}%` }} /></div>
                <div className="char-rank-pts">
                  <span>{stats.rankInfo.pointsInRank} pts</span>
                  {stats.rankInfo.pointsToNext !== null ? <span>{stats.rankInfo.pointsToNext} pts → Rang {stats.rankInfo.level + 1}</span> : <span className="char-rank-max">Rang maximum</span>}
                </div>
              </div>
              <dl className="char-dl">
                <div className="char-dl-row"><dt>Konis</dt><dd>{character.konis || 0}</dd></div>
                <div className="char-dl-row"><dt>Légende</dt><dd>{character.legende || 0}</dd></div>
                <div className="char-dl-row char-hp-row">
                  <dt>Blessures Max</dt>
                  <dd><div className="char-stat-right">
                    {isAdmin && <MalusInput characterId={character.id} field="bonusPointsDeBlessures" initialValue={character.bonusPointsDeBlessures || 0} />}
                    <span className="char-hp-value">{stats.maxHP}</span>
                  </div></dd>
                </div>
                <div className="char-dl-row char-move-row"><dt>Mouvement</dt><dd><span className="char-move-value">{stats.movement} m</span></dd></div>
                <div className="char-dodge-section">
                  <h3 className="char-dodge-title">Esquive</h3>
                  <table className="char-dodge-table">
                    <thead><tr><th>Dépourvue</th><th className="char-dodge-base-header">Découvert</th><th>Protégé</th><th>Couvert</th></tr></thead>
                    <tbody><tr><td>{stats.dodge.depourvue}</td><td className="char-dodge-base">{stats.dodge.decouvert}</td><td>{stats.dodge.protege}</td><td>{stats.dodge.couvert}</td></tr></tbody>
                  </table>
                </div>
              </dl>
            </div>

            <div className="char-card char-card-stats">
              <h2 className="char-card-title">Caractéristiques</h2>
              <div className="char-stats-grid">
                {[
                  ['Force', character.force, 'force', character.malusForce],
                  ['Habilité', character.habilite, 'habilite', character.malusHabilite],
                  ['Connaissances', character.connaissances, 'connaissances', character.malusConnaissances],
                  ['Culture', character.culture, 'culture', character.malusCulture],
                  ['Anticipation', character.anticipation, 'anticipation', character.malusAnticipation],
                  ['Perception', character.perception, 'perception', character.malusPerception],
                ].map(([label, baseValue, key, malus]: any) => {
                  const bonus = stats.totalArmorMods[key] || 0
                  const currentMalus = malus || 0
                  const total = (baseValue || 0) + bonus - currentMalus
                  const dieMod = Math.floor((total - 10) / 2)
                  const dieModStr = dieMod >= 0 ? `+${dieMod}` : `${dieMod}`
                  return (
                    <div key={label} className="char-stat-item">
                      <div className="char-stat-main">
                        <span className="char-stat-label">{label}</span>
                        <div className="char-stat-right">
                          {isAdmin && <MalusInput characterId={character.id} field={`malus${key.charAt(0).toUpperCase()}${key.slice(1)}`} initialValue={currentMalus} />}
                          <span className="char-stat-value">{total} <span className="char-stat-die-mod">({dieModStr})</span></span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Rangée 2 : Épreuves ── */}
          <div className="char-card">
            <h2 className="char-card-title">Épreuves</h2>
            <div className="char-epreuves-grid">
              {['vaisseau', 'pacifiques', 'combat'].map((cat: any) => (
                <div key={cat} className="char-epreuves-section">
                  <h3 className="char-epreuves-subtitle">{cat === 'vaisseau' ? 'En vaisseau / véhicule' : cat === 'pacifiques' ? 'Actions pacifiques' : 'Combat au sol'}</h3>
                  <div className="char-epreuves-list">
                    {stats.epreuves[cat as keyof typeof stats.epreuves].map((e: any) => (
                      <div key={e.label} className="char-epreuve-item">
                        <span className="char-epreuve-label">{e.label}</span>
                        <span className="char-epreuve-value">{e.value >= 0 ? '+' : ''}{e.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Rangée 5 : Compétences ── */}
          <div className="char-card">
            <div className="char-card-header-with-stats">
              <h2 className="char-card-title">Compétences</h2>
              <div className="char-skill-points-header">
                Points disponibles : <strong>{character.pointsDeCompetence ?? 0}</strong>
              </div>
            </div>
            <div className="char-skills-grid">
              {character.competences?.map((c: any) => (
                <div key={c.competence} className="char-skill-item">
                  <span className="char-skill-name">{c.competence}</span>
                  <div className="char-skill-actions">
                    <span className="char-skill-value">{c.valeur}</span>
                    <button 
                      className="char-skill-plus" 
                      onClick={() => handleLevelUp(c.competence)}
                      disabled={(character.pointsDeCompetence ?? 0) < c.valeur + 1}
                      title={`Améliorer pour ${c.valeur + 1} points`}
                    >
                      +{c.valeur + 1}
                    </button>
                  </div>
                </div>
              ))}
              {character.competencesSpeciales?.map((c: any) => (
                <div key={c.nom} className="char-skill-item char-skill-special">
                  <span className="char-skill-name">{c.nom}</span>
                  <span className="char-skill-value">{c.valeur}</span>
                </div>
              ))}

              {/* Apprendre une nouvelle compétence */}
              {!showLearnNewSkill ? (
                (character.pointsDeCompetence ?? 0) >= 1 && (
                  <button className="char-skill-learn-new" onClick={() => setShowLearnNewSkill(true)}>
                    Apprendre une nouvelle compétence (1 pt)
                  </button>
                )
              ) : (
                <div className="char-skill-learn-select">
                  <select onChange={(e) => handleLearnNewSkill(e.target.value)} defaultValue="">
                    <option value="" disabled>Choisir une compétence...</option>
                    {availableSkills.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setShowLearnNewSkill(false)}>Annuler</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Rangée 3 : Armures ── */}
          <div className="char-card">
            <div className="char-card-header-with-stats">
              <h2 className="char-card-title">Armures</h2>
              <div className="char-card-totals">
                <div className="char-total-item stats-physique"><span className="char-total-label">Physique</span><span className="char-total-value">{stats.totalPhysique}</span></div>
                <div className="char-total-item stats-bouclier"><span className="char-total-label">Bouclier</span><span className="char-total-value">{stats.totalBouclier}</span></div>
              </div>
            </div>
            <div className="char-equip-grid char-equip-grid-5">
              {renderArmorSlot("Tête", character.armureTete, character.armureTete?.mods)}
              {renderArmorSlot("Torse", character.armureTorse, character.armureTorse?.mods)}
              {renderArmorSlot("Bras", character.armureBras, character.armureBras?.mods)}
              {renderArmorSlot("Jambes", character.armureJambes, character.armureJambes?.mods)}
              {renderArmorSlot("Back-pack", character.armureBackpack, character.armureBackpack?.mods)}
            </div>
          </div>

          {/* ── Rangée 3 : Arsenal ── */}
          <div className="char-card">
            <h2 className="char-card-title">Arsenal</h2>
            <div className="char-equip-grid char-equip-grid-3">
              {renderWeaponSlot("Principale", character.armePrincipale)}
              {renderWeaponSlot("Secondaire", character.armeSecondaire)}
              {renderWeaponSlot("Lourde", character.armeLourde)}
              {renderWeaponSlot("Mêlée", character.armeDeMelee)}
              {storageValue >= 1 && renderConsumableSlot("Consommable 1", character.consommableEquipe1)}
              {storageValue >= 2 && renderConsumableSlot("Consommable 2", character.consommableEquipe2)}
              {storageValue >= 3 && renderConsumableSlot("Consommable 3", character.consommableEquipe3)}
            </div>
          </div>

          {/* ── Section Inventaire ── */}
          <div className="char-card">
            <h2 className="char-card-title">Inventaire (Possessions)</h2>
            {inventoryData.length === 0 ? (
              <p className="char-empty-hint">L'inventaire est vide.</p>
            ) : (
              <div className="char-inventory-categories">
                {inventoryData.map(cat => (
                  <div key={cat.id} className="char-inventory-category">
                    <button 
                      className="char-inventory-category-header"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <span className="char-inventory-category-title">{cat.label} ({cat.items.length})</span>
                      <span className="char-inventory-category-icon">{collapsedCategories[cat.id] ? '▶' : '▼'}</span>
                    </button>
                    
                    {!collapsedCategories[cat.id] && (
                      <div className="char-inventory-list">
                        <table className="char-inventory-table">
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Détails</th>
                              {cat.id === 'consumables' && <th>Qté</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {cat.items.map((itemObj: any, idx: number) => {
                              const item = (cat.id === 'consumables') ? itemObj.consommable : (itemObj.item || itemObj)
                              let subLabel = ""
                              
                              if (cat.id === 'weapons') {
                                subLabel = item.categorie || ""
                              } else if (cat.id === 'armors') {
                                subLabel = item.categorie || ""
                              } else if (cat.id === 'chips') {
                                subLabel = item.categorie || ""
                              } else if (cat.id === 'mods') {
                                subLabel = item.categoriePrincipale || ""
                              } else if (cat.id === 'consumables') {
                                subLabel = item.categorie || ""
                              }

                              return (
                                <tr 
                                  key={idx} 
                                  className="char-inventory-row-hoverable"
                                  onMouseEnter={(e) => handleMouseEnter(e, itemObj, cat.id)}
                                  onMouseMove={handleMouseMove}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <td><strong>{item.nom}</strong></td>
                                  <td>{subLabel}</td>
                                  {cat.id === 'consumables' && <td>{itemObj.quantite}</td>}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Barre de validation */}
      {isModified && (
        <div className="char-edit-bar">
          <div className="ss-container">
            <span>Modification en cours...</span>
            <div className="char-edit-buttons">
              <button className="ss-button secondary" onClick={handleCancel} disabled={isSaving}>Annuler</button>
              <button className="ss-button primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Enregistrement...' : 'Valider'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Tooltip d'inventaire */}
      {hoveredItem && (
        <div 
          className="char-inventory-tooltip"
          style={{ 
            left: hoveredItem.x + 15, 
            top: hoveredItem.y + 15,
            position: 'fixed',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {hoveredItem.type === 'weapons' && renderWeaponInner(hoveredItem.item, hoveredItem.mods)}
          {hoveredItem.type === 'armors' && renderArmorInner(hoveredItem.item, hoveredItem.mods)}
          {hoveredItem.type === 'chips' && renderChipInner(hoveredItem.item)}
          {hoveredItem.type === 'consumables' && renderConsumableInner(hoveredItem.item)}
          {hoveredItem.type === 'mods' && renderModInner(hoveredItem.item)}
        </div>
      )}
    </div>
  )
}
