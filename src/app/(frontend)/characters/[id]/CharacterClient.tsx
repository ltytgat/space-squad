'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateStats, getStructuredMods, getBridgedArmorStats, parseModifier, GRAVITY_OPTIONS, GRAVITY_CATEGORY_LABELS } from '@/lib/characterStats'
import type { GravityLevel } from '@/lib/characterStats'
import { minimumRankForChipSlot } from '@/lib/rankSystem'
import { weaponRangeRows } from '@/lib/weaponRanges'
import { weaponAllowedInSlot, weaponFromGroup, type CharacterWeaponSlot } from '@/lib/characterWeapons'
import { searchCharacterEditCatalog, updateCharacter, updateCharacterInEditMode, updateWeaponStatus, reloadWeapon } from './actions'
import { MalusInput } from './MalusInput'
import { KitUsageInput } from './KitUsageInput'
import { CoachingInput } from './CoachingInput'

type CharacterProps = {
  character: any
  isAdmin: boolean
  isOwner: boolean
  editMode: boolean
  factions: any[]
  isTemporary?: boolean
  allBaseSkills: string[]
  relatedShips: any[]
  relatedVehicles: any[]
}

const WEAPON_HEAT_SEGMENT_COUNT = 4

const SHIP_CLASS_LABEL: Record<string, string> = {
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

const ARMOR_SLOT_CATEGORIES: Record<string, string> = {
  armureTete: 'tete',
  armureTorse: 'torse',
  armureBras: 'bras',
  armureJambes: 'jambes',
  armureBackpack: 'backpack',
}

function getArmorCategory(armorGroup: any): string | undefined {
  const armor = armorGroup?.item || armorGroup
  return typeof armor === 'object' && armor !== null ? armor.categorie : undefined
}

function relationId(value: any): string | null {
  const id = value && typeof value === 'object' ? value.id : value
  return id == null ? null : String(id)
}

function asCustomWeaponGroup(customItem: any) {
  const item = weaponFromGroup({ customItem })
  if (!item) return null
  return {
    item,
    customItem,
    mods: customItem.mods ?? [],
    munitionsActuelles: customItem.munitionsActuelles ?? 0,
    chargeurRelie: customItem.chargeurRelie ?? null,
    customReserve: true,
  }
}

function addWeaponToInventory(character: any, weaponGroup: any) {
  if (!weaponGroup) return
  if (weaponGroup.customItem) {
    const customId = relationId(weaponGroup.customItem)
    const existingIds = (character.inventaireEquipementsCustom ?? []).map(relationId)
    if (customId && !existingIds.includes(customId)) {
      character.inventaireEquipementsCustom = [...(character.inventaireEquipementsCustom ?? []), weaponGroup.customItem]
    }
    return
  }
  character.inventaireArmes = [...(character.inventaireArmes ?? []), weaponGroup]
}

function isHeavyMachineGun(weapon: any): boolean {
  const name = String(weapon?.nom ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return weapon?.categorie === 'lourde' && name.includes('mitrailleuse')
}

function isHeavyBulletMagazine(item: any): boolean {
  const name = String(item?.nom ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return item?.typeMunition === 'balles-lourdes' || /balles? lourdes?/.test(name)
}

function getReloadPlan(weaponGroup: any, magazine: any, availableQuantity: number) {
  const weapon = weaponFromGroup(weaponGroup) ?? {}
  const mods = getStructuredMods(weaponGroup?.mods || [])
  const magMods = magazine?.effet ? parseModifier(magazine.effet) : {}
  const bonusChargeur = (mods['chargeur'] || 0) + (magMods['chargeur'] || 0)
  const bonusChargeurPct = mods['chargeur_pct'] || 0
  const maxAmmo = Math.ceil((weapon.tailleChargeur ?? 0) * (1 + bonusChargeurPct / 100)) + bonusChargeur
  const isThermique = weapon.type?.includes('thermique')

  if (isHeavyMachineGun(weapon) && isHeavyBulletMagazine(magazine)) {
    const sameMagazine = relationId(weaponGroup?.chargeurRelie) === relationId(magazine)
    const currentAmmo = sameMagazine ? Number(weaponGroup?.munitionsActuelles ?? 0) : 0
    const unitsToConsume = Math.min(
      Math.max(0, availableQuantity),
      Math.ceil(Math.max(0, maxAmmo - currentAmmo) / 50),
    )
    return {
      maxAmmo,
      unitsToConsume,
      newAmmoCount: Math.min(maxAmmo, currentAmmo + unitsToConsume * 50),
    }
  }

  return { maxAmmo, unitsToConsume: 1, newAmmoCount: isThermique ? 0 : maxAmmo }
}

function consumeInventoryItems(inventory: any[], consumableId: any, quantity: number) {
  let remaining = quantity
  return (inventory || []).map((item: any) => {
    if (relationId(item.consommable) !== String(consumableId) || remaining <= 0) return item
    const available = Number(item.quantite ?? 1)
    const consumed = Math.min(available, remaining)
    remaining -= consumed
    return { ...item, quantite: available - consumed }
  }).filter((item: any) => Number(item.quantite ?? 1) > 0)
}

export function CharacterClient({ character: initialCharacter, isAdmin, isOwner, editMode, factions, isTemporary = false, allBaseSkills, relatedShips, relatedVehicles }: CharacterProps) {
  useRouter();
  const [character, setCharacter] = useState(initialCharacter)
  const [lastSavedCharacter, setLastSavedCharacter] = useState(initialCharacter)
  const [gravityLevel, setGravityLevel] = useState<GravityLevel>('normale')
  const [weaponHeat, setWeaponHeat] = useState<Record<string, number>>({})
  const [isModified, setIsModified] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showLearnNewSkill, setShowLearnNewSkill] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [hoveredItem, setHoveredItem] = useState<{item: any, type: string, mods?: any[], x: number, y: number} | null>(null)
  const [managerChangedFields, setManagerChangedFields] = useState<Set<string>>(new Set())
  const [inventoryEditor, setInventoryEditor] = useState<{ section: 'weapons' | 'armors' | 'mods' | 'chips' | 'consumables'; index?: number } | null>(null)
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventorySearchResults, setInventorySearchResults] = useState<any[]>([])
  const [inventorySearchLoading, setInventorySearchLoading] = useState(false)
  const [inventorySearchError, setInventorySearchError] = useState('')
  const [selectorConfig, setSelectorConfig] = useState<{
    slot: string,
    label: string,
    type: 'weapon' | 'armor' | 'consumable' | 'armorMod' | 'chip',
    category?: string,
    currentId?: number | string,
    armorSlot?: string,
    modIndex?: number
  } | null>(null)
  const [reloadSelectorConfig, setReloadSelectorConfig] = useState<{
    slotKey: string,
    ammoType: string,
    availableMags: any[]
  } | null>(null)

  // Statistiques calculées en temps réel
  const stats = useMemo(() => calculateStats({ ...character, facteurGravite: gravityLevel }), [character, gravityLevel])
  const hasEquippedASU = (character.consommablesEquipes || []).some((equippedItem: any) => {
    const item = equippedItem?.consommable ?? equippedItem
    return typeof item === 'object' && String(item?.nom ?? '').trim().toLocaleUpperCase('fr') === 'ASU'
  })
  const maxSoins = stats.maxKits + (hasEquippedASU ? stats.rankInfo.level + 2 : 0)

  const factionRank = useMemo(() => {
    const val = character.rangDeFaction
    if (!val) return null

    const affiliation = character.affiliation
    if (typeof affiliation === 'object' && affiliation?.rangs && affiliation.rangs.length > 0) {
      // On considère que val est l'index 1-basé du rang
      const idx = parseInt(val) - 1
      if (!isNaN(idx) && affiliation.rangs[idx]) {
        return affiliation.rangs[idx].nom
      }
    }

    return val
  }, [character.affiliation, character.rangDeFaction])
  
  const affiliationName = useMemo(() => {
    if (!character.affiliation) return null
    return typeof character.affiliation === 'object' ? character.affiliation.nom : character.affiliation
  }, [character.affiliation])

  const ownsRoleRequiredBy = (item: any) => {
    const required = item?.roleSpecialRequis
    const requiredId = typeof required === 'object' ? required?.id : required
    if (requiredId == null || requiredId === '') return true
    return (character.rolesSpeciaux || []).some((role: any) => {
      const id = typeof role === 'object' ? role?.id : role
      return String(id) === String(requiredId)
    })
  }

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

  // Fermer le tooltip lors de l'ouverture/fermeture des sélecteurs
  useEffect(() => {
    setHoveredItem(null)
  }, [selectorConfig, reloadSelectorConfig])

  const handleMalusUpdate = (field: string, value: number) => {
    setCharacter((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    if (confirm('Voulez-vous vraiment annuler toutes les modifications ?')) {
      setCharacter(lastSavedCharacter)
      setIsModified(false)
      setManagerChangedFields(new Set())
      setShowLearnNewSkill(false)
    }
  }

  const handleEditFieldChange = (field: string, value: any) => {
    setCharacter((prev: any) => ({ ...prev, [field]: value }))
    setManagerChangedFields((previous) => new Set(previous).add(field))
    setIsModified(true)
  }

  const handleEditFactionChange = (value: string) => {
    const faction = factions.find((entry) => String(entry.id) === value) ?? null
    setCharacter((prev: any) => ({ ...prev, affiliation: faction, rangDeFaction: '' }))
    setManagerChangedFields((previous) => new Set(previous).add('affiliation').add('rangDeFaction'))
    setIsModified(true)
  }

  const inventoryField = (section: NonNullable<typeof inventoryEditor>['section']) => ({
    weapons: 'inventaireArmes',
    armors: 'inventaireArmures',
    mods: 'inventaireMods',
    chips: 'inventairePuces',
    consumables: 'inventaire',
  })[section]

  const handleOpenInventoryEditor = (section: NonNullable<typeof inventoryEditor>['section'], index?: number) => {
    setInventoryEditor({ section, ...(index === undefined ? {} : { index }) })
    setInventorySearch('')
    setInventorySearchResults([])
    setInventorySearchError('')
    setHoveredItem(null)
  }

  const handleInventoryCatalogPick = (item: any) => {
    if (!inventoryEditor) return
    const { section, index } = inventoryEditor
    const field = inventoryField(section)
    setCharacter((previous: any) => {
      const rows = [...(previous[field] ?? [])]
      if (section === 'weapons') {
        if (index === undefined) rows.push({ item, mods: [], munitionsActuelles: 0, chargeurRelie: null })
        else rows[index] = { ...rows[index], item }
      } else if (section === 'armors') {
        if (index === undefined) rows.push({ item, mods: [] })
        else rows[index] = { ...rows[index], item }
      } else if (section === 'consumables') {
        if (index === undefined) rows.push({ consommable: item, quantite: 1 })
        else rows[index] = { ...rows[index], consommable: item }
      } else if (index === undefined) {
        rows.push(item)
      } else {
        rows[index] = item
      }
      return { ...previous, [field]: rows }
    })
    setManagerChangedFields((previous) => new Set(previous).add(field))
    setIsModified(true)
    setInventoryEditor(null)
  }

  const handleInventoryRowChange = (section: NonNullable<typeof inventoryEditor>['section'], index: number, key: string, value: any) => {
    const field = inventoryField(section)
    setCharacter((previous: any) => {
      const rows = [...(previous[field] ?? [])]
      rows[index] = { ...rows[index], [key]: value }
      return { ...previous, [field]: rows }
    })
    setManagerChangedFields((previous) => new Set(previous).add(field))
    setIsModified(true)
  }

  const handleRemoveInventoryItem = (section: NonNullable<typeof inventoryEditor>['section'], index: number) => {
    const field = inventoryField(section)
    setCharacter((previous: any) => ({
      ...previous,
      [field]: (previous[field] ?? []).filter((_: any, rowIndex: number) => rowIndex !== index),
    }))
    setManagerChangedFields((previous) => new Set(previous).add(field))
    setIsModified(true)
  }

  const inventoryEditSection = inventoryEditor?.section ?? null
  useEffect(() => {
    if (!editMode || !inventoryEditSection) return
    let active = true
    const timeout = window.setTimeout(async () => {
      setInventorySearchLoading(true)
      setInventorySearchError('')
      try {
        const results = await searchCharacterEditCatalog(character.id, inventoryEditSection, inventorySearch)
        if (active) setInventorySearchResults(results as any[])
      } catch (error) {
        if (active) {
          setInventorySearchResults([])
          setInventorySearchError(error instanceof Error ? error.message : 'Impossible de rechercher dans le catalogue.')
        }
      } finally {
        if (active) setInventorySearchLoading(false)
      }
    }, 200)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [character.id, editMode, inventoryEditSection, inventorySearch])

  const handleSave = async (): Promise<boolean> => {
    setIsSaving(true)
    try {
      // Préparer les données à sauvegarder
      // On inclut les compétences ET l'équipement
      const fieldsToSave = [
        'competences', 'pointsDeCompetence',
        'armureTete', 'armureTorse', 'armureBras', 'armureJambes', 'armureBackpack',
        'armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee',
        'puceMk1', 'puceMk2', 'puceMk3',
        'consommableEquipe1', 'consommableEquipe2', 'consommableEquipe3',
        'consommablesEquipes',
        'inventaireArmes', 'inventaireArmures', 'inventaire', 'inventaireMods', 'inventairePuces'
      ]
      
      const saveData: any = {}
      fieldsToSave.forEach(field => {
        if (character[field] !== undefined) {
          // Pour les relations, Payload attend souvent des IDs ou des objets simplifiés
          // Ici on va essayer d'envoyer les données telles qu'elles sont dans l'état local
          // Payload gérera la conversion si nécessaire (ex: objet vers ID)
          const item = character[field]
          if (['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'].includes(field) && item?.customItem) {
            saveData[field] = { ...item, item: null, customItem: Number(relationId(item.customItem)) }
          } else {
            saveData[field] = item
          }
        }
      })

      if (editMode) {
        managerChangedFields.forEach((field) => {
          if (character[field] !== undefined) {
            const item = character[field]
            saveData[field] = ['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'].includes(field) && item?.customItem
              ? { ...item, item: null, customItem: Number(relationId(item.customItem)) }
              : item
          }
        })
        await updateCharacterInEditMode(character.id, saveData)
      } else {
        await updateCharacter(character.id, saveData)
      }
      setLastSavedCharacter(character)
      setManagerChangedFields(new Set())
      setIsModified(false)
      alert('Modifications enregistrées !')
      return true
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    if (isExporting || isSaving) return
    setIsExporting(true)
    try {
      if (isModified && !(await handleSave())) return
      window.location.assign(`/characters/${character.id}/export`)
    } finally {
      setIsExporting(false)
    }
  }

  // Liste des compétences non apprises
  const learnedSkills = character.competences?.map((c: any) => c.competence) ?? []
  const availableSkills = allBaseSkills.filter(s => !learnedSkills.includes(s))

  // Données d'inventaire
  const inventoryData = useMemo(() => {
    const equippedCustomIds = new Set(['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee']
      .map((slot) => relationId(character[slot]?.customItem)).filter(Boolean))
    const customWeapons = (character.inventaireEquipementsCustom || [])
      .filter((item: any) => item && typeof item === 'object' && item.categorieEquipement === 'arme' && !equippedCustomIds.has(relationId(item)))
      .map(asCustomWeaponGroup)
      .filter(Boolean)
    const weapons = [...(character.inventaireArmes || []), ...customWeapons]
    const armors = character.inventaireArmures || []
    const puces = character.inventairePuces || []
    const consumables = character.inventaire || []
    const mods = character.inventaireMods || []

    return [
      { id: 'weapons', label: 'Armes', items: weapons },
      { id: 'armors', label: 'Armures', items: armors },
      { id: 'mods', label: 'Mods', items: mods },
      { id: 'chips', label: 'Puces', items: puces },
      { id: 'consumables', label: 'Consommables', items: consumables },
    ]
  }, [character])

  // Valeur de stockage pour les consommables équipés
  const backpackItem = character.armureBackpack?.item || character.armureBackpack
  const storageCapacity = (typeof backpackItem === 'object' ? backpackItem?.stockage : 0) || 0
  const maxStorageUnits = storageCapacity * 2

  // Calcul des emplacements bonus par pièce d'armure
  const armorBonusSlots = useMemo(() => {
    const slots = ['armureTete', 'armureTorse', 'armureBras', 'armureJambes', 'armureBackpack']
    const result: Record<string, { category: string, quantity: number, modName: string }[]> = {}
    
    slots.forEach(slotKey => {
      const armorGroup = character[slotKey]
      if (armorGroup?.mods) {
        const bonuses: { category: string, quantity: number, modName: string }[] = []
        armorGroup.mods.forEach((mod: any) => {
          if (mod.bonusConsommables) {
            mod.bonusConsommables.forEach((b: any) => {
              bonuses.push({ category: b.categorie, quantity: b.quantite, modName: mod.nom })
            })
          }
        })
        if (bonuses.length > 0) result[slotKey] = bonuses
      }
    })
    return result
  }, [character])

  // Distribution des consommables équipés entre les slots d'armure et le backpack
  const distributedConsumables = useMemo(() => {
    const all = [...(character.consommablesEquipes || [])].map((item, index) => {
      const itemData = typeof item === 'object' ? item : { id: item }
      return { ...itemData, originalIndex: index }
    })
    
    const byArmor: Record<string, any[]> = {}
    
    // On parcourt les armures et leurs bonus
    Object.entries(armorBonusSlots).forEach(([slotKey, bonuses]) => {
      byArmor[slotKey] = []
      bonuses.forEach(bonus => {
        let remainingUnits = bonus.quantity * 2
        while (remainingUnits > 0) {
          // On cherche un item qui correspond à la catégorie et qui rentre dans ce qui reste du bonus
          const idx = all.findIndex(item => item.categorie === bonus.category && (item.taille || 2) <= remainingUnits)
          if (idx > -1) {
            const item = all.splice(idx, 1)[0]
            byArmor[slotKey].push(item)
            remainingUnits -= (item.taille || 2)
          } else {
            break
          }
        }
      })
    })
    
    return { byArmor, general: all }
  }, [character.consommablesEquipes, armorBonusSlots])

  const usedStorageUnits = useMemo(() => {
    return distributedConsumables.general.reduce((acc: number, item: any) => {
      return acc + (item?.taille || 2)
    }, 0)
  }, [distributedConsumables.general])

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

  const renderStatTooltip = (data: any) => {
    if (!data) return null
    return (
      <div className="char-stat-tooltip">
        <div className="char-stat-tooltip-header">
          <strong>Détail : {data.label}</strong>
        </div>
        <div className="char-stat-tooltip-formula">
          <div className="char-stat-tooltip-section-title">Formule</div>
          <code>{data.formula}</code>
          {data.dieFormula && <div><code>Dés : {data.dieFormula}</code></div>}
        </div>
        <div className="char-stat-tooltip-components">
          <div className="char-stat-tooltip-section-title">Composants</div>
          {data.components.map((c: any, idx: number) => (
            <div key={idx} className="char-stat-tooltip-component">
              <span className="char-stat-tooltip-component-label">{c.label}</span>
              <span className="char-stat-tooltip-component-value">{c.value >= 0 ? `+${c.value}` : c.value}</span>
              {c.sub && <div className="char-stat-tooltip-component-sub">{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Contenu détaillé d'une arme
  const renderWeaponInner = (weapon: any, mods: any[] = [], weaponGroup: any = null, slotKey: string | null = null) => {
    const isMelee = weapon.categorie === 'melee'
    const isHeavy = weapon.categorie === 'lourde'
    const isSniper = weapon.categorie === 'sniper'
    const isThermique = weapon.type?.includes('thermique')
    weapon.type?.includes('cinetique');
    const isPlasma = weapon.type?.includes('plasma')
    const structuredMods = getStructuredMods(mods.length ? mods : weaponGroup?.customItem?.mods || [])

    // Bonus des chargeurs
    const magEffet = weaponGroup?.chargeurRelie?.effet
    const magMods = magEffet ? parseModifier(magEffet) : {}

    const bonusProjectiles = structuredMods['indicator_projectiles'] || 0
    const totalProjectiles = (weapon.projectilesParTir ?? 1) + bonusProjectiles
    const showProjectiles = totalProjectiles != null && !isThermique && !isPlasma

    const damageColorClass = (weapon.type?.[0]) ? `weapon-type-${weapon.type[0]}` : ''

    // Récupérer les stats de munitions/chauffe depuis le weaponGroup (équipé)
    const munitionsActuelles = weaponGroup?.munitionsActuelles ?? 0
    const heatKey = slotKey ?? `preview:${weapon.id}`
    const currentHeat = weaponHeat[heatKey] ?? 0
    const heatSegmentPercent = Number.isFinite(Number(weapon.weaponHeatSegment)) && Number(weapon.weaponHeatSegment) >= 1
      ? Number(weapon.weaponHeatSegment)
      : 100
    const maxWeaponHeatPercent = heatSegmentPercent * WEAPON_HEAT_SEGMENT_COUNT
    const heatLevel = Math.min(WEAPON_HEAT_SEGMENT_COUNT, Math.max(1, Math.ceil(currentHeat / heatSegmentPercent)))
    const heatFillPercent = currentHeat <= 0
      ? 0
      : Math.min(100, ((currentHeat - (heatLevel - 1) * heatSegmentPercent) / heatSegmentPercent) * 100)
    
    const bonusChargeur = (structuredMods['chargeur'] || 0) + (magMods['chargeur'] || 0)
    const bonusChargeurPct = structuredMods['chargeur_pct'] || 0
    const maxAmmo = Math.ceil((weapon.tailleChargeur ?? 0) * (1 + bonusChargeurPct / 100)) + bonusChargeur

    const handleFire = async (e: React.MouseEvent) => {
      e.stopPropagation()
      let newData: any = {}
      if (isThermique) {
        const value = weapon.valeurChauffe ?? 10
        setWeaponHeat((current) => ({ ...current, [heatKey]: Math.min(maxWeaponHeatPercent, (current[heatKey] ?? 0) + value) }))
        return
      } else {
        const cost = totalProjectiles || 1
        newData = { munitionsActuelles: Math.max(0, munitionsActuelles - cost) }
      }
      
      // Mise à jour optimiste
      setCharacter((prev: any) => ({
        ...prev,
        [slotKey!]: { ...prev[slotKey!], ...newData }
      }))
      
      await updateWeaponStatus(character.id, slotKey!, newData)
    }

    const handleCool = async (e: React.MouseEvent) => {
      e.stopPropagation()
      const value = weapon.tempsRefroidissement ?? 10
      setWeaponHeat((current) => ({ ...current, [heatKey]: Math.max(0, (current[heatKey] ?? 0) - value) }))
    }

    const handleReload = async (e: React.MouseEvent) => {
      e.stopPropagation()
      let ammoType: 'chargeur' | 'balles-lourdes' | 'cartouche' | 'conteneur' = 'chargeur'
      if (isThermique) ammoType = 'cartouche'
      else if (isPlasma) ammoType = 'conteneur'
      else if (isHeavyMachineGun(weapon)) ammoType = 'balles-lourdes'

      const checkCompatibility = (item: any) => {
        if (!item || typeof item === 'string' || !ownsRoleRequiredBy(item)) return false
        if (item.typeMunition === ammoType) return true
        const nom = item.nom?.toLowerCase() || ""
        if (ammoType === 'balles-lourdes' && isHeavyBulletMagazine(item)) return true
        if (ammoType === 'chargeur' && nom.includes('chargeur')) return true
        if (ammoType === 'cartouche' && nom.includes('cartouche')) return true
        if (ammoType === 'conteneur' && nom.includes('conteneur')) return true
        return false
      }

      // 1. Chercher dans les consommables équipés (PRIORITAIRES)
      const equippedMags: any[] = []
      const equippedConsumables = character.consommablesEquipes || []
      equippedConsumables.forEach((item: any, idx: number) => {
        if (checkCompatibility(item)) {
          equippedMags.push({ 
            consommable: item, 
            quantite: 1, 
            fromEquippedIndex: idx 
          })
        }
      })

      // 2. Chercher dans l'inventaire
      const inventoryMagsById = new Map<string, any>()
      ;(character.inventaire || []).filter((invItem: any) => checkCompatibility(invItem.consommable)).forEach((invItem: any) => {
        const consumableId = relationId(invItem.consommable)
        if (!consumableId) return
        const existing = inventoryMagsById.get(consumableId)
        if (existing) existing.quantite += Number(invItem.quantite ?? 1)
        else inventoryMagsById.set(consumableId, { ...invItem, quantite: Number(invItem.quantite ?? 1) })
      })
      const inventoryMags = Array.from(inventoryMagsById.values())

      const compatibleMags = [...equippedMags, ...inventoryMags]

      if (compatibleMags.length === 0) {
        alert(`Aucun ${ammoType} compatible trouvé.`)
        return
      }

      if (compatibleMags.length > 1) {
        setReloadSelectorConfig({
          slotKey: slotKey!,
          ammoType,
          availableMags: compatibleMags
        })
        return
      }

      const mag = compatibleMags[0]
      const magConsumableId = relationId(mag.consommable)
      const plan = getReloadPlan(weaponGroup, mag.consommable, mag.fromEquippedIndex !== undefined ? 1 : mag.quantite)
      if (!plan.unitsToConsume) return
      const newAmmoCount = plan.newAmmoCount

      // Mise à jour optimiste
      const newCharacter = { ...character }

      if (mag.fromEquippedIndex !== undefined) {
        newCharacter.consommablesEquipes = (newCharacter.consommablesEquipes || []).filter((_: any, idx: number) => idx !== mag.fromEquippedIndex)
      } else {
        newCharacter.inventaire = consumeInventoryItems(newCharacter.inventaire || [], magConsumableId, plan.unitsToConsume)
      }

      setCharacter((prev: any) => ({
        ...prev,
        [slotKey!]: { 
          ...prev[slotKey!], 
          munitionsActuelles: newAmmoCount, 
          chargeurRelie: mag.consommable, 
        },
        inventaire: newCharacter.inventaire,
        consommablesEquipes: newCharacter.consommablesEquipes || prev.consommablesEquipes
      }))
      setWeaponHeat((current) => ({ ...current, [heatKey]: 0 }))

      await reloadWeapon(character.id, slotKey!, Number(magConsumableId), newAmmoCount, mag.fromEquippedIndex !== undefined ? `equipped[${mag.fromEquippedIndex}]` : undefined, plan.unitsToConsume)
    }

    const getFinalDamageData = () => {
      const baseDamage = weapon.valeurDegats
      if (!baseDamage) return null
      let bonus = 0
      const suffix = baseDamage.match(/[*!]+$/)?.[0] ?? ''
      const multiplier = suffix.includes('*') ? 2 : 1
      const cleanDamage = baseDamage.slice(0, baseDamage.length - suffix.length)

      if (isMelee) bonus = stats.forceDieMod * multiplier
      else if (!isHeavy && !isPlasma) bonus = stats.perceptionDieMod * multiplier

      bonus += (structuredMods['degats_flat'] || 0) + (magMods['degats_flat'] || 0)
      if (isMelee) bonus += (structuredMods['degats_mod_fo_x1'] || 0) * stats.forceDieMod
      if (weapon.categorie === 'shotgun') bonus += (structuredMods['degats_mod_pe_x1'] || 0) * stats.perceptionDieMod

      const finalDamageStr = bonus === 0 ? baseDamage : `${cleanDamage}${bonus > 0 ? '+' : ''}${bonus}${suffix}`
      const diceMatch = cleanDamage.match(/(\d+)d(\d+)(?:([+-]\d+))?/)
      let min = 0, avg = 0, max: number | null = 0
      const isExplosive = suffix.includes('!')
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
      const bonusPC = structuredMods['mod_portee_courte'] || 0
      const bonusPM = structuredMods['mod_portee_moyenne'] || 0
      const addPC = (structuredMods['portee_courte'] || 0) + (magMods['portee_flat'] || 0)
      const addPM = (structuredMods['portee_moyenne'] || 0) + (magMods['portee_flat'] || 0)
      const visibleRows = weaponRangeRows(weapon, {
        shortRangeBonus: bonusPC,
        mediumRangeBonus: bonusPM,
        shortRangeAdjustment: addPC,
        mediumRangeAdjustment: addPM,
        optimalRangeMultiplier: stats.weaponGravity.optimalRangeMultiplier,
      })
      if (visibleRows.length === 0) return null
      return (
        <table className="weapon-range-table">
          <thead><tr>{visibleRows.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
          <tbody><tr>{visibleRows.map((r, i) => <td key={i}>{r.mod}</td>)}</tr></tbody>
        </table>
      )
    }


    return (
      <div className="char-equip-item">
        {renderItemImage(weapon)}
        <span className="char-equip-item-name">{weapon.nom}</span>

        {weaponGroup?.chargeurRelie && (
          <div className="weapon-linked-mag">
            <span className="mag-name">🔋 {weaponGroup.chargeurRelie.nom}</span>
            {weaponGroup.chargeurRelie.effet && <span className="mag-effect">({weaponGroup.chargeurRelie.effet})</span>}
          </div>
        )}
        
        {/* Traitement spécifique Munitions / Chauffe */}
        {slotKey && !isMelee && (
          <div className="weapon-ammo-tracking">
            {!isThermique ? (
              <div className="weapon-ammo-header">
                <div className="weapon-ammo-status">
                  <span className="ammo-count">{munitionsActuelles}</span>
                  <span className="ammo-max">/ {maxAmmo}</span>
                </div>
                <div className="weapon-ammo-controls">
                  <button 
                    className="ammo-btn" 
                    onClick={handleFire} 
                    disabled={munitionsActuelles <= 0}
                    title="Tirer"
                  >
                    🔥
                  </button>
                  <button 
                    className="ammo-btn reload-btn" 
                    onClick={handleReload}
                    title="Recharger (choisir un chargeur de l'inventaire)"
                  >
                    Reload
                  </button>
                </div>
              </div>
            ) : (
              <div className="weapon-heat-tracking">
                <div className="weapon-heat-bar-container">
                  <div 
                    className={`weapon-heat-bar level-${heatLevel}`}
                    style={{ 
                      width: `${heatFillPercent}%`,
                    }}
                  />
                </div>
                <div className="weapon-heat-controls">
                  <span className="heat-value">{currentHeat}%</span>
                  <div className="heat-btn-group">
                    <button 
                      className="ammo-btn heat-btn cool" 
                      onClick={handleCool} 
                      disabled={currentHeat <= 0}
                      title="Refroidir"
                    >
                      ❄️
                    </button>
                    <button 
                      className="ammo-btn heat-btn fire" 
                      onClick={handleFire} 
                      disabled={currentHeat >= maxWeaponHeatPercent}
                      title="Tirer (chauffe)"
                    >
                      🔥
                    </button>
                    <button 
                      className="ammo-btn reload-btn" 
                      onClick={handleReload}
                      title="Changer cartouche (consomme une cartouche et reset chauffe)"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
            {weapon.tailleChargeur != null && <div className="weapon-util-item" title="Chargeur"><span className="util-icon">📦</span><span className="util-value">{maxAmmo}</span></div>}
            {showProjectiles && <div className="weapon-util-item" title="Projectiles/tir"><span className="util-icon">✴️</span><span className="util-value">{totalProjectiles}</span></div>}
            {weapon.tempsRechargement != null && <div className="weapon-util-item" title="Rechargement"><span className="util-icon">🔄</span><span className="util-value">{weapon.tempsRechargement}t</span></div>}
            {weapon.poids != null && <div className="weapon-util-item" title="Poids"><span className="util-icon">⚖️</span><span className="util-value">{Math.max(0, weapon.poids + (structuredMods['poids'] || 0))}kg</span></div>}
            {isHeavy && weapon.forceMinimum != null && <div className="weapon-util-item" title="Force minimale"><span className="util-icon">💪</span><span className="util-value">Fo {weapon.forceMinimum} min.</span></div>}
            {isThermique && weapon.valeurChauffe != null && <div className="weapon-util-item" title="Valeur de chauffe"><span className="util-icon">🔥</span><span className="util-value">{weapon.valeurChauffe}%</span></div>}
            {isThermique && <div className="weapon-util-item" title="Refroidissement (Valeur de chauffe)"><span className="util-icon">❄️</span><span className="util-value">{weapon.tempsRefroidissement}%</span></div>}
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
    const stats_bridged = getBridgedArmorStats(armorPiece, mods)
    const bonusRupture = stats_bridged.totalMods['armure_rupture'] || 0

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
              🛡️ {stats_bridged.physique}
            </span>
          )}
          {armorPiece.valeurBouclier != null && (
            <span title="Bouclier" className="stats-bouclier">
              ⚡ {stats_bridged.bouclier}
            </span>
          )}
          {armorPiece.valeurRupture != null && (
            <span title="Rupture" className="stats-rupture">
              💥 1 à {Math.max(0, armorPiece.valeurRupture + bonusRupture)}
            </span>
          )}
          <span title="Poids" className="stats-poids">
            ⚖️ {stats_bridged.poids}kg
          </span>
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
      {renderItemImage(mod)}
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
  const renderConsumableInner = (item: any) => {
    const sizeText = item.taille === 1 ? '½' : (item.taille === 4 ? 'x2' : '')
    return (
      <div className="char-equip-item">
        {renderItemImage(item)}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="char-equip-item-name">{item.nom}</span>
          {sizeText && <span style={{ fontSize: '0.8em', backgroundColor: '#444', padding: '2px 5px', borderRadius: '4px' }}>{sizeText}</span>}
        </div>
        <div className="char-equip-item-stats">
          <span className="ss-tag">{item.categorie}</span>
        </div>
        {item.effet && <div className="char-equip-item-mod-base">{item.effet}</div>}
        {item.roleSpecialRequis?.nom && <div className="char-equip-item-mod-base">Rôle requis : {item.roleSpecialRequis.nom}</div>}
        {item.epreuve && <div className="char-equip-item-mod-base">Épreuve: {item.epreuve} ({ (item.modificateurEpreuve ?? 0) >= 0 ? '+' : '' }{item.modificateurEpreuve ?? 0})</div>}
      </div>
    )
  }

  // Helper rendu armure
  const renderArmorSlot = (label: string, armor: any, mods: any[] = [], slotKey: string, category: string) => {
    const armorPiece = armor?.item || armor
    const isEquipped = !!armorPiece && typeof armorPiece !== 'string'
    
    return (
      <div 
        className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}
      >
        <div className="char-equip-slot-header">
          <span className="char-equip-slot-label">{label}</span>
          <button 
            className="char-equip-change-btn" 
            title="Changer d'équipement"
            onClick={() => handleOpenSelector({ slot: slotKey, label, type: 'armor', category })}
          >
            🔄
          </button>
        </div>
        {isEquipped ? renderArmorInner(armorPiece, mods) : (
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">🛡️</span>
            <span className="char-equip-empty-text">Non équipé</span>
          </div>
        )}
        {/* Affichage des mods d'armure interactifs */}
        {isEquipped && (
          <div className="char-equip-mods-edit">
            {[0].map(idx => {
              const mod = mods[idx]
              return (
                <div key={idx} className="char-equip-mod-slot">
                  {mod ? (
                    <div className="char-equip-mod-filled">
                      <span title={mod.effet}>🔧 {mod.nom}</span>
                      <button onClick={() => handleOpenSelector({ slot: 'armorMod', label: `Mod ${label}`, type: 'armorMod', category, armorSlot: slotKey, modIndex: idx })}>🔄</button>
                    </div>
                  ) : (
                    <button className="char-equip-mod-empty" onClick={() => handleOpenSelector({ slot: 'armorMod', label: `Mod ${label}`, type: 'armorMod', category, armorSlot: slotKey, modIndex: idx })}>
                      + Ajouter Mod
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Affichage des slots de consommables bonus fournis par les mods */}
        {isEquipped && armorBonusSlots[slotKey] && (
          <div className="char-armor-bonus-consumables" style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
            {armorBonusSlots[slotKey].map((bonus, bIdx) => {
              const items = distributedConsumables.byArmor[slotKey]?.filter(c => c.categorie === bonus.category) || []
              const totalUnits = bonus.quantity * 2
              let usedUnits = 0
              items.forEach(c => usedUnits += (c.taille || 2))
              
              return (
                <div key={bIdx} style={{ marginBottom: '5px' }}>
                  <div style={{ fontSize: '0.75em', color: '#aaa', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📦 Slots {bonus.category} ({bonus.modName})</span>
                    <span>{usedUnits/2} / {bonus.quantity}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {items.map((item, iIdx) => (
                      <div key={iIdx} className="char-mini-consumable" style={{ position: 'relative' }}>
                        {renderItemImage(item)}
                        <button 
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f44', border: 'none', borderRadius: '50%', color: 'white', width: '15px', height: '15px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleUnequipConsumable(item.originalIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {usedUnits < totalUnits && (
                      <button 
                        className="char-equip-mod-empty" 
                        style={{ padding: '2px 8px', fontSize: '0.8em' }}
                        onClick={() => handleOpenSelector({ slot: 'consommablesEquipes', label: `Ajouter ${bonus.category}`, type: 'consumable', category: bonus.category })}
                      >
                        + {bonus.category}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Helper rendu arme
  const renderWeaponSlot = (label: string, weaponGroup: any, slotKey: string, categoryConstraint: string) => {
    const weapon = weaponFromGroup(weaponGroup)
    const mods = weaponGroup?.mods || weaponGroup?.customItem?.mods || []
    const isEquipped = !!weapon && typeof weapon !== 'string'
    
    return (
      <div 
        className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}
      >
        <div className="char-equip-slot-header">
          <span className="char-equip-slot-label">{label}</span>
          <button 
            className="char-equip-change-btn" 
            title="Changer d'arme"
            onClick={() => handleOpenSelector({ slot: slotKey, label, type: 'weapon', category: categoryConstraint })}
          >
            🔄
          </button>
        </div>
        {isEquipped ? renderWeaponInner(weapon, mods, weaponGroup, slotKey) : (
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">🔫</span>
            <span className="char-equip-empty-text">Non équipé</span>
          </div>
        )}
      </div>
    )
  }

  const renderChipSlot = (label: string, chip: any, slotKey: string) => {
    const isEquipped = !!chip && typeof chip !== 'string'
    const minimumRank = minimumRankForChipSlot(slotKey) ?? 1
    const locked = !isAdmin && stats.rankInfo.level < minimumRank
    
    return (
      <div 
        className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}
      >
        <div className="char-equip-slot-header">
          <span className="char-equip-slot-label">{label}</span>
          <button 
            className="char-equip-change-btn" 
            title={locked ? `Débloqué au rang ${minimumRank}` : 'Changer de puce'}
            disabled={locked}
            onClick={() => handleOpenSelector({ slot: slotKey, label, type: 'chip' })}
          >
            🔄
          </button>
        </div>
        {isEquipped ? renderChipInner(chip) : (
          <div className="char-equip-empty">
            <span className="char-equip-empty-icon">💾</span>
            <span className="char-equip-empty-text">Non équipée</span>
          </div>
        )}
        {locked && <small className="char-rank-lock-note">Emplacement verrouillé · rang {minimumRank} requis</small>}
      </div>
    )
  }

  const renderConsumableSlot = (label: string, consumable: any, slotKey: string) => {
    const item = consumable
    const isEquipped = !!item && typeof item !== 'string'

    return (
      <div 
        className={`char-equip-slot${isEquipped ? '' : ' char-equip-slot-empty'}`}
      >
        <div className="char-equip-slot-header">
          <span className="char-equip-slot-label">{label}</span>
          <div className="char-equip-slot-actions">
            {isEquipped && (
              <button 
                className="char-equip-change-btn" 
                title="Déséquiper"
                onClick={() => {
                  const idx = parseInt(slotKey.match(/\[(\d+)\]/)?.[1] || '-1')
                  if (idx > -1) handleUnequipConsumable(idx)
                }}
              >
                ❌
              </button>
            )}
            <button 
              className="char-equip-change-btn" 
              title="Changer de consommable"
              onClick={() => handleOpenSelector({ slot: slotKey, label, type: 'consumable' })}
            >
              🔄
            </button>
          </div>
        </div>
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
      if (type === 'weapons') {
        const weaponGroup = itemObj?.customItem ? { ...itemObj, ...asCustomWeaponGroup(itemObj.customItem) } : itemObj
        item = weaponFromGroup(weaponGroup)
        mods = weaponGroup?.mods || []
      } else {
        item = itemObj.item
        mods = itemObj.mods || []
      }
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

  const handleStatMouseEnter = (e: React.MouseEvent, statKey: string) => {
    const data = (stats as any).breakdown?.[statKey]
    if (!data) return
    setHoveredItem({
      item: data,
      type: 'stats',
      x: e.clientX,
      y: e.clientY
    } as any)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoveredItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
  }

  const handleMouseLeave = () => {
    setHoveredItem(null)
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  // Helper de filtrage pour le sélecteur
  const getCompatibleItems = () => {
    if (!selectorConfig) return []
    const { type, category, slot } = selectorConfig

    if (type === 'weapon') {
      const filterFn = (w: any) => {
        if (!w) return false
        const item = weaponFromGroup(w)
        if (!item || typeof item !== 'object') return false
        return weaponAllowedInSlot(item.categorie, slot as CharacterWeaponSlot)
      }

      const inventory = (character.inventaireArmes || [])
        .map((w: any, idx: number) => ({ ...w, fromInventory: true, inventoryIndex: idx }))
        .filter(filterFn)
      const equippedCustomIds = new Set(['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee']
        .map((weaponSlot) => relationId(character[weaponSlot]?.customItem)).filter(Boolean))
      const customInventory = (character.inventaireEquipementsCustom || [])
        .filter((item: any) => item && typeof item === 'object' && item.categorieEquipement === 'arme' && !equippedCustomIds.has(relationId(item)))
        .map(asCustomWeaponGroup)
        .filter(Boolean)
        .map((group: any) => ({ ...group, fromInventory: true }))
      
      // Ajouter les armes équipées compatibles (sauf celle du slot actuel)
      const equippedSlots = ['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee']
      const equipped = equippedSlots
        .filter(s => s !== slot)
        .map(s => ({ ...character[s], item: weaponFromGroup(character[s]), fromSlot: s }))
        .filter(filterFn)

      return [...equipped, ...inventory, ...customInventory]
    }
    
    if (type === 'armor') {
      const inventory = (character.inventaireArmures || [])
        .map((a: any, idx: number) => ({ ...a, fromInventory: true, inventoryIndex: idx }))
        .filter((a: any) => getArmorCategory(a) === category)
      
      // Pour les armures, peu de chances de vouloir swap car elles sont par slot strict,
      // mais on respecte l'énoncé.
      const equippedSlots = ['armureTete', 'armureTorse', 'armureBras', 'armureJambes', 'armureBackpack']
      const equipped = equippedSlots
        .filter(s => s !== slot)
        .map(s => character[s])
        .filter(a => getArmorCategory(a) === category)
        .map(a => ({ ...a, fromSlot: equippedSlots.find(s => character[s] === a) }))

      return [...equipped, ...inventory]
    }

    if (type === 'consumable') {
      // Pour les consommables, on retourne la liste plate des objets de l'inventaire
      return (character.inventaire || [])
        .map((c: any, idx: number) => ({ ...c, fromInventory: true, inventoryIndex: idx }))
        .filter((c: any) => {
          const itemData = c.consommable || c
          const matchesCategory = !category || itemData.categorie === category
          return (c.quantite || 0) > 0 && matchesCategory && ownsRoleRequiredBy(itemData)
        })
    }

    if (type === 'armorMod') {
      return (character.inventaireMods || [])
        .map((m: any, idx: number) => ({ ...m, fromInventory: true, inventoryIndex: idx }))
        .filter((m: any) => {
          return m.categoriePrincipale === 'armures' && 
                 (m.sousCategorieArmure === 'toutes' || m.sousCategorieArmure === category)
        })
    }

    if (type === 'chip') {
      const inventory = (character.inventairePuces || []).map((p: any, idx: number) => ({ ...p, fromInventory: true, inventoryIndex: idx }))
      const equippedSlots = ['puceMk1', 'puceMk2', 'puceMk3']
      const equipped = equippedSlots
        .filter(s => s !== slot)
        .map(s => character[s])
        .filter(p => p != null)
        .map(p => ({ ...p, fromSlot: equippedSlots.find(s => character[s] === p) }))
      
      return [...equipped, ...inventory]
    }

    return []
  }

  const handleOpenSelector = (config: typeof selectorConfig) => {
    setSelectorConfig(config)
  }

  const handleUnequipConsumable = (idx: number) => {
    const newCharacter = { ...character }
    const currentEquipped = [...(newCharacter.consommablesEquipes || [])]
    const itemToUnequip = currentEquipped[idx]
    
    if (!itemToUnequip) return

    currentEquipped.splice(idx, 1)
    newCharacter.consommablesEquipes = currentEquipped

    // Remettre dans l'inventaire
    const itemData = itemToUnequip.consommable || itemToUnequip
    const itemId = typeof itemData === 'object' ? itemData.id : itemData
    const existing = (newCharacter.inventaire || []).find((c: any) => {
      const cId = typeof c.consommable === 'object' ? c.consommable.id : c.consommable
      return String(cId) === String(itemId)
    })
    
    if (existing) {
      newCharacter.inventaire = newCharacter.inventaire.map((c: any) => 
        c === existing ? { ...c, quantite: (c.quantite || 0) + 1 } : c
      )
    } else {
      newCharacter.inventaire = [...(newCharacter.inventaire || []), { consommable: itemData, quantite: 1 }]
    }

    setCharacter(newCharacter)
    setIsModified(true)
  }

  const handleEquip = (newItem: any, currentSlot: string, type: string) => {
    if (type === 'armor' && getArmorCategory(newItem) !== ARMOR_SLOT_CATEGORIES[currentSlot]) return

    const candidateWeapon = newItem?.item ?? newItem
    if (type === 'weapon' && candidateWeapon.categorie === 'lourde' && candidateWeapon.forceMinimum != null) {
      const force = (Number(character.force) || 0) + (stats.totalArmorMods.force || 0) - (Number(character.malusForce) || 0)
      if (force < candidateWeapon.forceMinimum) {
        alert(`Force insuffisante pour équiper ${candidateWeapon.nom} : Fo ${candidateWeapon.forceMinimum} minimum requise (votre Force : ${force}).`)
        return
      }
    }

    const minimumRank = type === 'chip' ? minimumRankForChipSlot(currentSlot) : null
    if (!isAdmin && minimumRank !== null && stats.rankInfo.level < minimumRank) {
      alert(`Cet emplacement se débloque au rang ${minimumRank}.`)
      setSelectorConfig(null)
      return
    }
    const newCharacter = { ...character }

    if (type === 'consumable' && (currentSlot === 'consommablesEquipes' || currentSlot.startsWith('equipped['))) {
      const itemData = newItem.consommable || newItem
      
      const checkCapacity = (itemToAdd: any, replacingIdx: number = -1) => {
        const simEquipped = [...(newCharacter.consommablesEquipes || [])]
        if (replacingIdx > -1) {
          simEquipped[replacingIdx] = itemToAdd
        } else {
          simEquipped.push(itemToAdd)
        }
        
        const allBonuses: Record<string, number> = {}
        Object.values(armorBonusSlots).forEach(bonuses => {
          bonuses.forEach(b => {
            allBonuses[b.category] = (allBonuses[b.category] || 0) + (b.quantity * 2)
          })
        })
        
        const usageByCategory: Record<string, number> = {}
        simEquipped.forEach(item => {
          const itemInfo = typeof item === 'object' ? item : item
          const cat = itemInfo.categorie
          usageByCategory[cat] = (usageByCategory[cat] || 0) + (itemInfo.taille || 2)
        })
        
        let totalExcess = 0
        Object.keys(usageByCategory).forEach(cat => {
          const used = usageByCategory[cat]
          const bonus = allBonuses[cat] || 0
          totalExcess += Math.max(0, used - bonus)
        })
        
        return totalExcess <= maxStorageUnits
      }

      if (currentSlot === 'consommablesEquipes') {
        // Ajout d'un nouveau
        if (!checkCapacity(itemData)) {
          alert(`Pas assez d'espace de stockage !`)
          return
        }
        newCharacter.consommablesEquipes = [...(newCharacter.consommablesEquipes || []), itemData]
      } else if (currentSlot.startsWith('equipped[')) {
        // Remplacement
        const idx = parseInt(currentSlot.match(/\[(\d+)\]/)?.[1] || '-1')
        const oldItem = (newCharacter.consommablesEquipes || [])[idx]
        
        if (!checkCapacity(itemData, idx)) {
          alert(`Pas assez d'espace de stockage !`)
          return
        }
        
        const newEquipped = [...(newCharacter.consommablesEquipes || [])]
        newEquipped[idx] = itemData
        newCharacter.consommablesEquipes = newEquipped
        
        // Remettre l'ancien dans l'inventaire
        if (oldItem) {
          const oldData = oldItem.consommable || oldItem
          const oldId = typeof oldData === 'object' ? oldData.id : oldData
          const existing = (newCharacter.inventaire || []).find((c: any) => {
            const cId = typeof c.consommable === 'object' ? c.consommable.id : c.consommable
            return String(cId) === String(oldId)
          })
          if (existing) {
            newCharacter.inventaire = newCharacter.inventaire.map((c: any) => 
              c === existing ? { ...c, quantite: (c.quantite || 0) + 1 } : c
            )
          } else {
            newCharacter.inventaire = [...(newCharacter.inventaire || []), { consommable: oldData, quantite: 1 }]
          }
        }
      }

      // Retirer le nouveau de l'inventaire
      if (newItem.fromInventory) {
        const newItemId = newItem.id
        const inventoryIndex = newItem.inventoryIndex
        newCharacter.inventaire = (newCharacter.inventaire || []).map((c: any, idx: number) => {
          if (inventoryIndex !== undefined ? idx === inventoryIndex : (c.id || c) === newItemId) {
            return { ...c, quantite: (c.quantite || 1) - 1 }
          }
          return c
        }).filter((c: any) => c.quantite > 0)
      }

      setCharacter(newCharacter)
      setIsModified(true)
      setSelectorConfig(null)
      return
    }

    const currentItem = character[currentSlot]

    // Gérer le swap si l'objet vient d'un autre slot
    if (newItem.fromSlot) {
      newCharacter[newItem.fromSlot] = currentItem
    } else if (newItem.fromInventory) {
      const newItemId = newItem.id
      const inventoryIndex = newItem.inventoryIndex

      // Retirer de l'inventaire
      if (type === 'weapon') {
        if (newItem.customItem) {
          const customId = relationId(newItem.customItem)
          newCharacter.inventaireEquipementsCustom = (newCharacter.inventaireEquipementsCustom || []).filter((item: any) => relationId(item) !== customId)
        } else {
          if (inventoryIndex !== undefined) {
            newCharacter.inventaireArmes = (newCharacter.inventaireArmes || []).filter((_: any, idx: number) => idx !== inventoryIndex)
          } else {
            newCharacter.inventaireArmes = (newCharacter.inventaireArmes || []).filter((i: any) => (i.id || i) !== newItemId)
          }
        }
        addWeaponToInventory(newCharacter, currentItem)
      } else if (type === 'armor') {
        if (inventoryIndex !== undefined) {
          newCharacter.inventaireArmures = (newCharacter.inventaireArmures || []).filter((_: any, idx: number) => idx !== inventoryIndex)
        } else {
          newCharacter.inventaireArmures = (newCharacter.inventaireArmures || []).filter((i: any) => (i.id || i) !== newItemId)
        }
        if (currentItem) newCharacter.inventaireArmures = [...newCharacter.inventaireArmures, currentItem]
      } else if (type === 'armorMod') {
        if (inventoryIndex !== undefined) {
          newCharacter.inventaireMods = (newCharacter.inventaireMods || []).filter((_: any, idx: number) => idx !== inventoryIndex)
        } else {
          newCharacter.inventaireMods = (newCharacter.inventaireMods || []).filter((i: any) => (i.id || i) !== newItemId)
        }
      } else if (type === 'chip') {
        if (inventoryIndex !== undefined) {
          newCharacter.inventairePuces = (newCharacter.inventairePuces || []).filter((_: any, idx: number) => idx !== inventoryIndex)
        } else {
          newCharacter.inventairePuces = (newCharacter.inventairePuces || []).filter((i: any) => (i.id || i) !== newItemId)
        }
        if (currentItem) newCharacter.inventairePuces = [...newCharacter.inventairePuces, currentItem]
      }
    } else if (currentItem) {
      // Si on remplace par quelque chose qui n'est ni du slot ni de l'inventaire
      // (théoriquement non possible avec l'UI, mais on gère par sécurité)
      if (type === 'weapon') addWeaponToInventory(newCharacter, currentItem)
      if (type === 'armor') newCharacter.inventaireArmures = [...(newCharacter.inventaireArmures || []), currentItem]
      if (type === 'chip') newCharacter.inventairePuces = [...(newCharacter.inventairePuces || []), currentItem]
    }

    // Nettoyer l'objet des propriétés temporaires
    const cleanItem = { ...newItem }
    delete cleanItem.fromSlot
    delete cleanItem.fromInventory
    delete cleanItem.inventoryIndex
    delete cleanItem.customReserve
    if (type === 'weapon' && cleanItem.customItem) {
      delete cleanItem.item
      cleanItem.mods = cleanItem.mods ?? cleanItem.customItem.mods ?? []
      cleanItem.munitionsActuelles = cleanItem.munitionsActuelles ?? cleanItem.customItem.munitionsActuelles ?? 0
      cleanItem.chargeurRelie = cleanItem.chargeurRelie ?? cleanItem.customItem.chargeurRelie ?? null
    }

    if (type === 'weapon') {
      newCharacter[currentSlot] = cleanItem
    } else if (type === 'armor') {
      newCharacter[currentSlot] = cleanItem
    } else if (type === 'chip') {
      newCharacter[currentSlot] = cleanItem
    } else if (type === 'armorMod') {
      const slot = selectorConfig?.armorSlot
      const idx = selectorConfig?.modIndex
      if (slot && idx !== undefined) {
        const armorData = { ...(newCharacter[slot] || {}) }
        const mods = [...(armorData.mods || [])]
        const oldMod = mods[idx]
        mods[idx] = cleanItem
        armorData.mods = mods
        newCharacter[slot] = armorData
        if (oldMod) newCharacter.inventaireMods = [...(newCharacter.inventaireMods || []), oldMod]
      }
    }

    setCharacter(newCharacter)
    if (type === 'weapon') {
      setWeaponHeat((current) => {
        const next = { ...current }
        delete next[currentSlot]
        if (newItem.fromSlot) delete next[newItem.fromSlot]
        return next
      })
    }
    setIsModified(true)
    setSelectorConfig(null)
    setHoveredItem(null)
  }

  const handleUnequip = (slot: string, type: string) => {
    const newCharacter = { ...character }
    const currentItem = character[slot]
    
    if (type === 'armorMod') {
      const armorSlot = selectorConfig?.armorSlot
      const idx = selectorConfig?.modIndex
      if (armorSlot && idx !== undefined) {
        const armorData = { ...(newCharacter[armorSlot] || {}) }
        const mods = [...(armorData.mods || [])]
        const oldMod = mods[idx]
        mods[idx] = null
        armorData.mods = mods.filter(m => m !== null)
        newCharacter[armorSlot] = armorData
        if (oldMod) newCharacter.inventaireMods = [...(newCharacter.inventaireMods || []), oldMod]
      }
    } else {
      newCharacter[slot] = null
      if (currentItem) {
        if (type === 'weapon') {
          addWeaponToInventory(newCharacter, currentItem)
        } else if (type === 'armor') {
          newCharacter.inventaireArmures = [...(newCharacter.inventaireArmures || []), currentItem]
        } else if (type === 'chip') {
          newCharacter.inventairePuces = [...(newCharacter.inventairePuces || []), currentItem]
        }
      }
    }

    setCharacter(newCharacter)
    if (type === 'weapon') setWeaponHeat((current) => ({ ...current, [slot]: 0 }))
    setIsModified(true)
    setSelectorConfig(null)
    setHoveredItem(null)
  }

  const handleEditModeToggle = () => {
    window.location.assign(`/characters/${character.id}${editMode ? '' : '?edit=1'}`)
  }

  return (
    <div className={`ss-root char-root${isModified ? ' is-editing' : ''}${editMode ? ' char-edit-mode' : ''}`}>
      <div className="char-layout">
        {/* ── En-tête ── */}
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">›</span>
              {isAdmin && <><Link href="/characters">Personnages</Link><span aria-hidden="true">›</span></>}
              <span>{isTemporary ? 'Fiche temporaire' : isOwner ? 'Mon personnage' : (character.nom ?? 'Personnage')}</span>
            </nav>

            <div className="char-name-container">
              <h1 className="char-name">{character.nom || 'Personnage en cours de création'}</h1>
              {isAdmin && !isTemporary && <button className="ss-btn char-mode-toggle" type="button" onClick={handleEditModeToggle}>
                {editMode ? 'Mode Lecture' : 'Mode Edition'}
              </button>}
              <button className="ss-btn ss-btn-outline" type="button" onClick={handleExport} disabled={isSaving || isExporting}>
                {isExporting ? 'Exportation…' : 'Exporter'}
              </button>
            </div>
            
            <div className="char-tags">
              {character.origine && <span className="ss-tag">{character.origine}</span>}
              {character.sexe && <span className="ss-tag">{character.sexe}</span>}
              {affiliationName && <span className={`ss-tag char-tag-affil-${affiliationName.toLowerCase()}`}>{affiliationName}</span>}
            </div>
            {!!character.rolesSpeciaux?.length && <div className="char-special-roles" aria-label="Rôles spéciaux acquis">
              {character.rolesSpeciaux.map((role: any) => typeof role === 'object' && role?.id != null
                ? <span className="ss-tag" key={role.id} title={role.description || undefined}>{role.nom}</span>
                : null)}
            </div>}
            <div className="char-gravity-control">
              <label className="char-gravity-label" htmlFor="character-gravity">Facteur de gravité</label>
              <select
                id="character-gravity"
                className="char-gravity-select"
                value={gravityLevel}
                onChange={(event) => setGravityLevel(event.target.value as GravityLevel)}
              >
                {GRAVITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {(character.origine === 'Strani' || character.origine === 'Vada') && (
                <div className="char-gravity-species-effect">
                  Catégorie appliquée à l&apos;espèce : <strong>{GRAVITY_CATEGORY_LABELS[stats.effectiveGravityLevel]}</strong>
                  <span>(décalage {character.origine === 'Strani' ? '+1' : '−1'})</span>
                </div>
              )}
              {(stats.gravity.notes.length > 0 || stats.weaponGravity.optimalRangeMultiplier === Infinity) && (
                <ul className="char-gravity-notes">
                  {stats.weaponGravity.optimalRangeMultiplier === Infinity && <li>Portée optimale des armes infinie</li>}
                  {stats.gravity.notes.map((note: string) => <li key={note}>{note}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="char-content ss-container">

          {editMode && <section className="char-card char-manager-edit-panel">
            <h2 className="char-card-title">Mode Edition · Valeurs de la fiche</h2>
            <div className="char-manager-edit-grid">
              <label>Espèce
                <select value={character.origine ?? ''} onChange={(event) => handleEditFieldChange('origine', event.target.value)}>
                  <option value="">Choisir une espèce</option>
                  <option value="Humain">Humain</option>
                  <option value="Strani">Strani</option>
                  <option value="Vada">Vada</option>
                </select>
              </label>
              <label>Sexe
                <select value={character.sexe ?? ''} onChange={(event) => handleEditFieldChange('sexe', event.target.value)}>
                  <option value="">Choisir un sexe</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="X">X</option>
                </select>
              </label>
              <label>Faction
                <select value={relationId(character.affiliation) ?? ''} onChange={(event) => handleEditFactionChange(event.target.value)}>
                  <option value="">Aucune faction</option>
                  {factions.map((faction: any) => <option key={faction.id} value={faction.id}>{faction.nom}</option>)}
                </select>
              </label>
              {[
                ['Points de rang', 'pointsDeRang'],
                ['Konis', 'konis'],
                ['Légende', 'legende'],
                ['Points de compétence', 'pointsDeCompetence'],
              ].map(([label, field]) => <label key={field}>{label}
                <input type="number" step="any" value={character[field] ?? 0} onChange={(event) => handleEditFieldChange(field, Number(event.target.value) || 0)} />
              </label>)}
            </div>
            <h3 className="char-manager-edit-subtitle">Caractéristiques</h3>
            <div className="char-manager-edit-grid char-manager-edit-grid-stats">
              {[
                ['Force', 'force'], ['Habilité', 'habilite'], ['Connaissances', 'connaissances'],
                ['Culture', 'culture'], ['Anticipation', 'anticipation'], ['Perception', 'perception'],
              ].map(([label, field]) => <label key={field}>{label}
                <input type="number" step="1" value={character[field] ?? 0} onChange={(event) => handleEditFieldChange(field, Number(event.target.value) || 0)} />
              </label>)}
            </div>
          </section>}

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
                  <dt 
                    className="char-help-cursor"
                    onMouseEnter={(e) => handleStatMouseEnter(e, 'maxHP')}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    Blessures Max
                  </dt>
                  <dd><div className="char-stat-right">
                    {isAdmin && <MalusInput characterId={character.id} field="bonusPointsDeBlessures" initialValue={character.bonusPointsDeBlessures || 0} onUpdate={handleMalusUpdate} />}
                    <span className="char-hp-value">{stats.maxHP}</span>
                  </div></dd>
                </div>
                <div className="char-dl-row char-move-row">
                  <dt 
                    className="char-help-cursor"
                    onMouseEnter={(e) => handleStatMouseEnter(e, 'movement')}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    Mouvement
                  </dt>
                  <dd><span className="char-move-value">{stats.movement} m</span></dd>
                </div>
                <div className="char-dodge-section">
                  <h3 className="char-dodge-title">Esquive</h3>
                  <table className="char-dodge-table">
                    <thead>
                      <tr>
                        <th>Dépourvue</th>
                        <th 
                          className="char-dodge-base-header char-help-cursor"
                          onMouseEnter={(e) => handleStatMouseEnter(e, 'dodge')}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          Découvert
                        </th>
                        <th>Protégé</th>
                        <th>Couvert</th>
                      </tr>
                    </thead>
                    <tbody><tr><td>{stats.dodge.depourvue}</td><td className="char-dodge-base">{stats.dodge.decouvert}</td><td>{stats.dodge.protege}</td><td>{stats.dodge.couvert}</td></tr></tbody>
                  </table>
                </div>
                <div className="char-kits-section">
                  <h3 className="char-kits-title" title="Réparation : modificateur de Connaissances. Premiers soins : modificateur de Connaissances, augmenté de Rang + 2 si ASU est équipé.">
                    Kits de survie (Usages)
                  </h3>
                  <div className="char-kits-grid">
                    <div className="char-kit-item">
                      <span className="char-kit-label">Réparation</span>
                      <KitUsageInput 
                        characterId={character.id}
                        field="utilisationsKitsReparation"
                        initialValue={character.utilisationsKitsReparation || 0}
                        maxValue={stats.maxKits}
                        onUpdate={handleMalusUpdate}
                        disabled={!isOwner && !isAdmin}
                      />
                    </div>
                    <div className="char-kit-item">
                      <span className="char-kit-label">Premiers soins</span>
                      <KitUsageInput 
                        characterId={character.id}
                        field="utilisationsKitsSoins"
                        initialValue={character.utilisationsKitsSoins || 0}
                        maxValue={maxSoins}
                        onUpdate={handleMalusUpdate}
                        disabled={!isOwner && !isAdmin}
                      />
                    </div>
                  </div>
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
                  
                  const capKey = key.charAt(0).toUpperCase() + key.slice(1)
                  const coachingLabel = character[`coaching${capKey}Label`]
                  const coachingMax = character[`coaching${capKey}Max`] || 0
                  const coachingValue = character[`coaching${capKey}Value`] || 0

                  return (
                    <div key={label} className="char-stat-item-wrapper">
                      <div className="char-stat-item">
                        <div className="char-stat-main">
                          <span 
                            className="char-stat-label char-help-cursor"
                            onMouseEnter={(e) => handleStatMouseEnter(e, key)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            {label}
                          </span>
                          <div className="char-stat-right">
                            {isAdmin && <MalusInput characterId={character.id} field={`malus${capKey}`} initialValue={currentMalus} onUpdate={handleMalusUpdate} />}
                            <span className="char-stat-value">{total} <span className="char-stat-die-mod">({dieModStr})</span></span>
                          </div>
                        </div>
                      </div>
                      {coachingLabel && (
                        <div className="char-stat-coaching">
                          <span className="char-stat-coaching-label">{coachingLabel}</span>
                          <CoachingInput 
                            characterId={character.id}
                            field={`coaching${capKey}Value`}
                            initialValue={coachingValue}
                            maxValue={coachingMax}
                            disabled={!isOwner && !isAdmin}
                          />
                        </div>
                      )}
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
                <div className="char-total-item stats-poids"><span className="char-total-label">Poids total</span><span className="char-total-value">{stats.totalArmorWeight}kg</span></div>
              </div>
            </div>
            <div className="char-equip-grid char-equip-grid-5">
              {renderArmorSlot("Tête", character.armureTete, character.armureTete?.mods, 'armureTete', 'tete')}
              {renderArmorSlot("Torse", character.armureTorse, character.armureTorse?.mods, 'armureTorse', 'torse')}
              {renderArmorSlot("Bras", character.armureBras, character.armureBras?.mods, 'armureBras', 'bras')}
              {renderArmorSlot("Jambes", character.armureJambes, character.armureJambes?.mods, 'armureJambes', 'jambes')}
              {renderArmorSlot("Back-pack", character.armureBackpack, character.armureBackpack?.mods, 'armureBackpack', 'backpack')}
            </div>
          </div>

          {/* ── Rangée 3 : Arsenal ── */}
          <div className="char-card">
            <h2 className="char-card-title">Arsenal</h2>
            <div className="char-equip-grid char-equip-grid-3">
              {renderWeaponSlot("Principale", character.armePrincipale, 'armePrincipale', 'standard')}
              {renderWeaponSlot("Secondaire", character.armeSecondaire, 'armeSecondaire', 'standard')}
              {renderWeaponSlot("Lourde", character.armeLourde, 'armeLourde', 'lourde')}
              {renderWeaponSlot("Mêlée", character.armeDeMelee, 'armeDeMelee', 'melee')}
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2em', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🧪 Consommables ({usedStorageUnits / 2} / {storageCapacity})
                </h3>
                {usedStorageUnits < maxStorageUnits && (
                  <button 
                    className="ss-button ss-button-small"
                    onClick={() => handleOpenSelector({ slot: 'consommablesEquipes', label: 'Ajouter un consommable', type: 'consumable' })}
                  >
                    + Ajouter
                  </button>
                )}
              </div>
              
              {(!character.consommablesEquipes || character.consommablesEquipes.length === 0) ? (
                <p style={{ color: '#666', fontStyle: 'italic', margin: '10px 0' }}>Aucun consommable équipé.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                  {distributedConsumables.general.map((c: any, idx: number) => (
                    renderConsumableSlot(`Consommable ${idx + 1}`, c, `equipped[${c.originalIndex}]`)
                  ))}
                </div>
              )}

              {usedStorageUnits > maxStorageUnits && (
                <p style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '10px' }}>
                  ⚠️ Capacité de stockage dépassée !
                </p>
              )}
            </div>
          </div>

          {/* ── Rangée 4 : Puces ── */}
          <div className="char-card">
            <h2 className="char-card-title">Puces Augmentées</h2>
            <div className="char-equip-grid char-equip-grid-3">
              {renderChipSlot("Slot Mk1", character.puceMk1, 'puceMk1')}
              {renderChipSlot("Slot Mk2", character.puceMk2, 'puceMk2')}
              {renderChipSlot("Slot Mk3", character.puceMk3, 'puceMk3')}
            </div>
          </div>

          {/* ── Section Vaisseaux ── */}
          <div className="char-card">
            <h2 className="char-card-title">Vaisseaux</h2>
            {relatedShips.length === 0 ? (
              <p className="char-empty-hint">Aucun vaisseau accessible.</p>
            ) : (
              <div className="char-ships-list">
                {relatedShips.map((ship: any) => {
                  const assigned = character.vaisseau && (typeof character.vaisseau === 'object' ? character.vaisseau.id : character.vaisseau) === ship.id
                  const owner = typeof ship.proprietaire === 'object' ? ship.proprietaire : null
                  const model = typeof ship.modele === 'object' ? ship.modele : null
                  const chassis = typeof model?.chassis === 'object' ? model.chassis : null
                  const shipClass = chassis?.classe ? (SHIP_CLASS_LABEL[chassis.classe] ?? chassis.classe) : null
                  const card = <>
                      <span className="char-ship-link-main"><strong>{ship.nom}</strong><span>{shipClass || 'Classe inconnue'}{model?.nom ? ` · ${model.nom}` : ''}</span></span>
                      <span className="char-ship-link-meta">{assigned ? 'Affecté' : owner?.nom ? `Propriété de ${owner.nom}` : 'Groupe'}{!isTemporary && <span aria-hidden="true">→</span>}</span>
                  </>
                  return isTemporary
                    ? <div className={`char-ship-link${assigned ? ' char-ship-link-assigned' : ''}`} key={ship.id}>{card}</div>
                    : <a className={`char-ship-link${assigned ? ' char-ship-link-assigned' : ''}`} href={`/ship/${ship.id}`} key={ship.id}>{card}</a>
                })}
              </div>
            )}
          </div>

          {/* ── Section Véhicules ── */}
          <div className="char-card">
            <h2 className="char-card-title">Véhicules de l&apos;escouade</h2>
            {relatedVehicles.length === 0 ? (
              <p className="char-empty-hint">Aucun véhicule accessible.</p>
            ) : (
              <div className="char-ships-list">
                {relatedVehicles.map((vehicle: any) => {
                  const owner = typeof vehicle.proprietaire === 'object' ? vehicle.proprietaire : null
                  const model = typeof vehicle.modele === 'object' ? vehicle.modele : null
                  const variant = typeof model?.variante === 'object' ? model.variante : null
                  const vehicleCard = <>
                    <span className="char-ship-link-main"><strong>{vehicle.nom}</strong><span>{variant?.nom ?? 'Véhicule'}{model?.nom ? ` · ${model.nom}` : ''}</span></span>
                    <span className="char-ship-link-meta">{owner?.nom ? `Propriété de ${owner.nom}` : 'Escouade'}{!isTemporary && <span aria-hidden="true">→</span>}</span>
                  </>
                  return isTemporary
                    ? <div className="char-ship-link" key={vehicle.id}>{vehicleCard}</div>
                    : <Link className="char-ship-link" href={`/vehicles/${vehicle.id}`} key={vehicle.id}>{vehicleCard}</Link>
                })}
              </div>
            )}
          </div>

          {/* ── Section Inventaire ── */}
          <div className="char-card">
            <h2 className="char-card-title">Inventaire (Possessions)</h2>
            {isOwner && !isTemporary && <Link className="char-inventory-transfer-link" href="/shop/transfert-personnages">
              Transférer du matériel ou des Konis à un membre de l’escouade
            </Link>}
            {inventoryData.length === 0 ? (
              <p className="char-empty-hint">L&apos;inventaire est vide.</p>
            ) : (
              <div className="char-inventory-categories">
                {inventoryData.map(cat => (
                  <div key={cat.id} className="char-inventory-category">
                    {editMode && <button type="button" className="char-inventory-add-button" onClick={() => handleOpenInventoryEditor(cat.id as NonNullable<typeof inventoryEditor>['section'])}>Ajouter à la section</button>}
                    <button 
                      className="char-inventory-category-header"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <span className="char-inventory-category-title">{cat.label} ({cat.items.length})</span>
                      <span className="char-inventory-category-icon">{collapsedCategories[cat.id] ? '▶' : '▼'}</span>
                    </button>
                    
                    {!collapsedCategories[cat.id] && (
                      <div className="char-inventory-list">
                        {cat.items.length === 0 && <p className="char-empty-hint">Cette section est vide.</p>}
                        <table className="char-inventory-table">
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Détails</th>
                              {cat.id === 'consumables' && <th>Qté</th>}
                              {cat.id === 'weapons' && <th>Munitions</th>}
                              {editMode && <th>Gestion</th>}
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
                                  onMouseEnter={editMode ? undefined : (e) => handleMouseEnter(e, itemObj, cat.id)}
                                  onMouseMove={editMode ? undefined : handleMouseMove}
                                  onMouseLeave={editMode ? undefined : handleMouseLeave}
                                >
                                  <td><strong>{item.nom}</strong>{itemObj.customReserve && <span className="ss-tag">Custom</span>}</td>
                                  <td>{subLabel}</td>
                                  {cat.id === 'consumables' && <td>{editMode
                                    ? <input aria-label="Quantité" className="char-inventory-quantity" type="number" min="1" step="1" value={itemObj.quantite ?? 1} onChange={(event) => handleInventoryRowChange('consumables', idx, 'quantite', Math.max(1, Number(event.target.value) || 1))} />
                                    : itemObj.quantite}</td>}
                                  {cat.id === 'weapons' && <td>{editMode && !itemObj.customReserve
                                    ? <input aria-label="Munitions" className="char-inventory-quantity" type="number" min="0" step="1" value={itemObj.munitionsActuelles ?? 0} onChange={(event) => handleInventoryRowChange('weapons', idx, 'munitionsActuelles', Math.max(0, Number(event.target.value) || 0))} />
                                    : itemObj.munitionsActuelles ?? 0}</td>}
                                  {editMode && <td className="char-inventory-actions">{!itemObj.customReserve && <>
                                    <button type="button" className="char-inventory-action-button" onClick={() => handleOpenInventoryEditor(cat.id as NonNullable<typeof inventoryEditor>['section'], idx)}>Remplacer</button>
                                    <button type="button" className="char-inventory-action-remove" onClick={() => handleRemoveInventoryItem(cat.id as NonNullable<typeof inventoryEditor>['section'], idx)}>Retirer</button>
                                  </>}</td>}
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

          {/* ── Réputation et Faction ── */}
          <div className="char-card">
            <h2 className="char-card-title">Renommée et Faction</h2>
            <div className="char-reputation-layout">
              <div className="char-reputation-section">
                <h3 className="char-reputation-subtitle">Renommée</h3>
                {editMode && <div className="char-reputation-editor">
                  {(character.reputation ?? []).map((rep: any, index: number) => <div className="char-reputation-edit-row" key={rep.id ?? index}>
                    <label>Catégorie<input value={rep.categorie ?? ''} onChange={(event) => {
                      const reputation = [...(character.reputation ?? [])]
                      reputation[index] = { ...reputation[index], categorie: event.target.value }
                      handleEditFieldChange('reputation', reputation)
                    }} /></label>
                    <label>Valeur<input type="number" step="any" value={rep.valeur ?? 0} onChange={(event) => {
                      const reputation = [...(character.reputation ?? [])]
                      reputation[index] = { ...reputation[index], valeur: Number(event.target.value) || 0 }
                      handleEditFieldChange('reputation', reputation)
                    }} /></label>
                    <button type="button" className="char-inventory-action-remove" onClick={() => handleEditFieldChange('reputation', (character.reputation ?? []).filter((_: any, rowIndex: number) => rowIndex !== index))}>Retirer</button>
                  </div>)}
                  <button type="button" className="char-inventory-add-button" onClick={() => handleEditFieldChange('reputation', [...(character.reputation ?? []), { categorie: '', valeur: 0 }])}>Ajouter une renommée</button>
                </div>}
                {(!character.reputation || character.reputation.length === 0) ? (
                  <p className="char-empty-hint">Aucune renommée enregistrée.</p>
                ) : (
                  <div className="char-reputation-list">
                    {character.reputation.map((rep: any, idx: number) => (
                      <div key={idx} className="char-reputation-item">
                        <span className="char-reputation-cat">{rep.categorie}</span>
                        <span className="char-reputation-val">{rep.valeur}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(character.affiliation || editMode) && (
                <div className="char-reputation-section">
                  <h3 className="char-reputation-subtitle">
                    Faction : {affiliationName}
                  </h3>
                  {editMode && <div className="char-faction-edit-grid">
                    <label>Points de faction<input type="number" step="any" value={character.pointsDeFaction ?? 0} onChange={(event) => handleEditFieldChange('pointsDeFaction', Number(event.target.value) || 0)} /></label>
                    <label>Rang de faction
                      <select value={character.rangDeFaction ?? ''} onChange={(event) => handleEditFieldChange('rangDeFaction', event.target.value)}>
                        <option value="">Aucun rang</option>
                        {(character.affiliation?.rangs ?? []).map((rank: any, index: number) => <option key={`${rank.nom}-${index}`} value={String(index + 1)}>{rank.nom}</option>)}
                      </select>
                    </label>
                  </div>}
                  <div className="char-faction-grid">
                    <div className="char-faction-item">
                      <span className="char-faction-label">Points de faction</span>
                      <span className="char-faction-value">{character.pointsDeFaction || 0}</span>
                    </div>
                    {factionRank && (
                      <div className="char-faction-item">
                        <span className="char-faction-label">Rang actuel</span>
                        <span className="char-faction-value">{factionRank}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
      {/* Sélecteur d'équipement */}
      {inventoryEditor && (
        <div className="char-selector-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInventoryEditor(null) }}>
          <section className="char-selector-modal char-inventory-editor-modal" role="dialog" aria-modal="true" aria-labelledby="char-inventory-editor-title">
            <div className="char-selector-header">
              <h3 id="char-inventory-editor-title">{inventoryEditor.index === undefined ? 'Ajouter à' : 'Remplacer dans'} la section {({ weapons: 'Armes', armors: 'Armures', mods: 'Mods', chips: 'Puces', consumables: 'Consommables' })[inventoryEditor.section]}</h3>
              <button type="button" className="char-selector-close" aria-label="Fermer" onClick={() => setInventoryEditor(null)}>×</button>
            </div>
            <div className="char-selector-content">
              <label className="char-inventory-search-label">Rechercher dans le catalogue
                <input type="search" value={inventorySearch} autoFocus onChange={(event) => setInventorySearch(event.target.value)} placeholder="Nom de l’objet…" />
              </label>
              {inventorySearchError && <p className="char-empty-hint">{inventorySearchError}</p>}
              {inventorySearchLoading ? <p className="char-empty-hint">Recherche…</p> : (
                <div className="char-selector-list">
                  {inventorySearchResults.length === 0
                    ? <p className="char-selector-empty">Aucun objet trouvé.</p>
                    : inventorySearchResults.map((item) => <button key={item.id} type="button" className="char-selector-item char-inventory-search-result" onClick={() => handleInventoryCatalogPick(item)}>
                      <strong>{item.nom}</strong>
                      <span>{item.categorie ?? item.categoriePrincipale ?? ''}</span>
                    </button>)}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {selectorConfig && (
        <div className="char-selector-overlay" onClick={() => { setSelectorConfig(null); setHoveredItem(null); }}>
          <div className="char-selector-modal" onClick={e => e.stopPropagation()}>
            <div className="char-selector-header">
              <h3>Changer : {selectorConfig.label}</h3>
              <button className="char-selector-close" onClick={() => { setSelectorConfig(null); setHoveredItem(null); }}>×</button>
            </div>
            <div className="char-selector-content">
              <button 
                className="char-selector-item char-selector-unequip"
                onClick={() => handleUnequip(selectorConfig.slot, selectorConfig.type)}
              >
                Retirer l&apos;objet / Vider l&apos;emplacement
              </button>
              
              <div className="char-selector-list">
                {getCompatibleItems().length === 0 ? (
                  <p className="char-selector-empty">Aucun objet compatible dans l&apos;inventaire.</p>
                ) : (
                  getCompatibleItems().map((itemObj: any, idx: number) => {
                    const item = (selectorConfig.type === 'consumable') ? itemObj.consommable : (itemObj.item || itemObj)
                    return (
                      <div 
                        key={idx} 
                        className="char-selector-item"
                        onClick={() => handleEquip(itemObj, selectorConfig.slot, selectorConfig.type)}
                        onMouseEnter={(e) => handleMouseEnter(e, itemObj, selectorConfig.type === 'armorMod' ? 'mods' : (selectorConfig.type === 'weapon' ? 'weapons' : (selectorConfig.type === 'armor' ? 'armors' : (selectorConfig.type === 'chip' ? 'chips' : 'consumables'))))}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="char-selector-item-info">
                          <strong>{item.nom}</strong>
                          {selectorConfig.type === 'consumable' && <span className="ss-tag">Qté: {itemObj.quantite}</span>}
                          {item.categorie && <span className="ss-tag">{item.categorie}</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip d'inventaire */}
      {hoveredItem && (
        <div 
          className="char-inventory-tooltip"
          style={{ 
            left: (hoveredItem as any).x + 15, 
            top: (hoveredItem as any).y + 15,
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
          {hoveredItem.type === 'stats' && renderStatTooltip(hoveredItem.item)}
        </div>
      )}

      {/* Sélecteur de recharge */}
      {reloadSelectorConfig && (
        <div className="char-selector-overlay" onClick={() => setReloadSelectorConfig(null)}>
          <div className="char-selector-modal" onClick={e => e.stopPropagation()}>
            <div className="char-selector-header">
              <h3>Choisir : {reloadSelectorConfig.ammoType}</h3>
              <button className="char-selector-close" onClick={() => setReloadSelectorConfig(null)}>×</button>
            </div>
            <div className="char-selector-content">
              <div className="char-selector-list">
                {reloadSelectorConfig.availableMags.map((itemObj: any, idx: number) => {
                  const item = itemObj.consommable
                  return (
                    <div 
                      key={idx} 
                      className="char-selector-item"
                      onClick={() => {
                        const mag = itemObj
                        const magConsumableId = relationId(mag.consommable)
                        
                        const weaponGroup = character[reloadSelectorConfig.slotKey]
                        const plan = getReloadPlan(
                          weaponGroup,
                          mag.consommable,
                          mag.fromEquippedIndex !== undefined ? 1 : mag.quantite,
                        )
                        if (!plan.unitsToConsume) return
                        const newAmmoCount = plan.newAmmoCount

                        let updatedInventory = character.inventaire
                        let updatedEquipped = character.consommablesEquipes
                        const updatedSlots: any = {}
                        let fromSlotOrIndex = mag.fromSlot

                        if (mag.fromEquippedIndex !== undefined) {
                          updatedEquipped = (updatedEquipped || []).filter((_: any, i: number) => i !== mag.fromEquippedIndex)
                          fromSlotOrIndex = `equipped[${mag.fromEquippedIndex}]`
                        } else if (mag.fromSlot) {
                          updatedSlots[mag.fromSlot] = null
                        } else {
                          updatedInventory = consumeInventoryItems(character.inventaire || [], magConsumableId, plan.unitsToConsume)
                        }

                        setCharacter((prev: any) => ({
                          ...prev,
                          [reloadSelectorConfig.slotKey]: { 
                            ...prev[reloadSelectorConfig.slotKey], 
                            munitionsActuelles: newAmmoCount, 
                            chargeurRelie: mag.consommable,
                          },
                          inventaire: updatedInventory,
                          consommablesEquipes: updatedEquipped,
                          ...updatedSlots
                        }))
                        setWeaponHeat((current) => ({ ...current, [reloadSelectorConfig.slotKey]: 0 }))

                        reloadWeapon(character.id, reloadSelectorConfig.slotKey, Number(magConsumableId), newAmmoCount, fromSlotOrIndex, plan.unitsToConsume)
                        setReloadSelectorConfig(null)
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, itemObj, 'consumables')}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="char-selector-item-info">
                        <strong>{item.nom}</strong>
                        {itemObj.fromSlot || itemObj.fromEquippedIndex !== undefined ? (
                          <span className="ss-tag tag-equipped">Équipé</span>
                        ) : (
                          <span className="ss-tag">Qté: {itemObj.quantite}</span>
                        )}
                        {item.effet && <span className="char-mag-effect-preview">{item.effet}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
