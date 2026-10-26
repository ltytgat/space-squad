'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyAtelierEffects, atelierModificationPoints, atelierNextPurchasePrice, atelierPurchasePrice, atelierShipSpecializationTags, atelierSpecializationTagForTarget, atelierTurretCapacities, atelierTurretPointIncrease, findAtelierCompatibility, type AtelierCompatibility, type AtelierEffect, type AtelierEquipmentKind, type AtelierPurchase } from '@/lib/atelier'
import { exactAdd } from '@/lib/shop'
import { weaponRangeRows } from '@/lib/weaponRanges'
import type { ShopItemDetail } from '../ShopItemDetails'
import { customizePersonalEquipment, customizeShip } from '../atelier-actions'

type ImageSummary = { url: string; alt: string } | null
export type AtelierItem = {
  id: number
  index: number
  kind: AtelierEquipmentKind
  nom: string
  categorie: string
  type: string[]
  classe: string | null
  prix: number
  points: number
  image: ImageSummary
  setNom: string | null
  modelNom: string | null
  description: string | null
  properties: Record<string, any>
  rangeBonuses?: Record<string, number>
  components: string[]
}
export type AtelierModification = {
  id: number
  nom: string
  description: string | null
  compatibilites: AtelierCompatibility[]
  effets: AtelierEffect[]
}

type Props = {
  kind: AtelierEquipmentKind
  character: { id: number; nom: string; konis: number }
  items: AtelierItem[]
  modifications: AtelierModification[]
}
type Preview = { properties: Record<string, any>; error: string | null }

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`
const categoryLabels: Record<string, string> = {
  'fusil-assaut': "Fusil d’assaut", shotgun: 'Shotgun', sniper: 'Sniper', pistolet: 'Pistolet',
  melee: 'Mêlée', lourde: 'Arme lourde', tete: 'Tête', torse: 'Torse', bras: 'Bras', jambes: 'Jambes',
  backpack: 'Back-pack', polyvalent: 'Polyvalent', combat: 'Combat', transport: 'Transport', exploration: 'Exploration',
}
const detailLabels: Record<string, string> = {
  fabricant: 'Fabricant', categorie: 'Catégorie', type: 'Type', poids: 'Poids', forceMinimum: 'Fo minimum',
  valeurDegats: 'Dégâts', zoneEffet: 'Zone d’effet', projectilesParTir: 'Projectiles par tir',
  tempsRechargement: 'Temps de rechargement', porteeFixe: 'Portée fixe', courtePortee: 'Courte portée',
  modCourtePortee: 'Modificateur courte portée', moyennePortee: 'Portée moyenne', modMoyennePortee: 'Modificateur moyenne portée',
  paliersSniper: 'Paliers sniper', trancheMalusLonguePortee: 'Tranche malus longue portée', malusParTranche: 'Malus par tranche',
  tailleChargeur: 'Taille du chargeur', valeurChauffe: 'Valeur de chauffe', tempsRefroidissement: 'Refroidissement',
  weaponHeatSegment: 'Seuil de chauffe',
  details: 'Détails', valeurArmurePhysique: 'Armure physique', valeurBouclier: 'Bouclier', valeurRupture: 'Rupture',
  modificateur: 'Modificateur', rang: 'Rang requis', stockage: 'Stockage', prix: 'Prix catalogue',
  blindage: 'Blindage', esquiveBase: 'Esquive de base', tourelles: 'Tourelles', pointsEmportPilote: 'Points d’emport pilote',
  pointsEmportTourelles: 'Points d’emport tourelles', modulesSupplementaires: 'Modules supplémentaires', consommables: 'Emplacements consommables',
}
const labels = (kind: AtelierEquipmentKind) => kind === 'arme' ? 'Armes de la réserve' : kind === 'armure' ? 'Armures de la réserve' : 'Vaisseaux disponibles'

function propertyValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') return ''
  if (key === 'categorie') return categoryLabels[String(value)] ?? String(value)
  if (key === 'specialisations' && Array.isArray(value)) return value.map((tag) => ({ combat: 'Combat', exploration: 'Exploration', transport: 'Transport' } as Record<string, string>)[String(tag)] ?? String(tag)).join(', ')
  if (key === 'type' && Array.isArray(value)) return value.map((type) => ({ thermique: 'Thermique', cinetique: 'Cinétique', plasma: 'Plasma', explosif: 'Explosif', melee: 'Mêlée' } as Record<string, string>)[String(type)] ?? String(type)).join(', ')
  if (Array.isArray(value)) {
    return value.map((entry) => typeof entry === 'object' ? Object.entries(entry).filter(([, child]) => child != null && child !== '').map(([name, child]) => `${name} ${child}`).join(' · ') : String(entry)).filter(Boolean).join(' · ')
  }
  if (typeof value === 'object') {
    if (value.nom) return String(value.nom)
    const meaningfulEntries = Object.entries(value).filter(([, child]) => child !== null && child !== undefined && child !== '')
    return meaningfulEntries.length ? JSON.stringify(Object.fromEntries(meaningfulEntries)) : ''
  }
  return String(value)
}

function personalDetails(item: AtelierItem, properties: Record<string, any>): ShopItemDetail[] {
  const rangeFields = new Set(['porteeFixe', 'courtePortee', 'modCourtePortee', 'moyennePortee', 'modMoyennePortee', 'paliersSniper', 'trancheMalusLonguePortee', 'malusParTranche'])
  const entries = Object.entries(properties)
    .filter(([key, value]) => key !== 'nom' && key !== 'id' && key !== 'image' && !(item.kind === 'arme' && rangeFields.has(key)) && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({ label: detailLabels[key] ?? key, value: propertyValue(key, value) }))
    .filter((entry) => entry.value !== '')
  if (item.kind === 'armure' && item.setNom) entries.push({ label: 'Set d’armure', value: item.setNom })
  return entries
}

const effectLabels: Record<string, string> = {
  poids: 'Poids', prix: 'Prix catalogue', valeurDegats: 'Dégâts', zoneEffet: 'Zone d’effet',
  projectilesParTir: 'Projectiles par tir', tempsRechargement: 'Temps de rechargement',
  porteeFixe: 'Portée', courtePortee: 'Courte portée', modCourtePortee: 'Bonus courte portée',
  moyennePortee: 'Portée moyenne', modMoyennePortee: 'Bonus portée moyenne', paliersSniper: 'Distances des paliers sniper',
  trancheMalusLonguePortee: 'Tranche longue portée', malusParTranche: 'Malus par tranche',
  tailleChargeur: 'Taille du chargeur', valeurChauffe: 'Valeur de chauffe', tempsRefroidissement: 'Refroidissement',
  weaponHeatSegment: 'Seuil de chauffe', valeurArmurePhysique: 'Armure physique', valeurBouclier: 'Bouclier',
  valeurRupture: 'Rupture', caracteristiqueBonus: 'Bonus de caractéristique', mods: 'Emplacements de Mods',
  specializationCombat: 'Spécialisation combat', specializationExploration: 'Spécialisation exploration',
  specializationTransport: 'Spécialisation transport', tourelles: 'Tourelles', pointsEmportPilote: 'Points d’emport pilote',
  pointsEmportTourelles: 'Points d’emport tourelles', blindage: 'Blindage', modulesSupplementaires: 'Modules supplémentaires',
  consommables: 'Emplacements consommables', esquiveBase: 'Esquive de base',
  specialisations: 'Tags de type',
}

function formatEffect(effect: AtelierEffect): string {
  const label = effectLabels[effect.cible] ?? effect.cible
  const specialization = atelierSpecializationTagForTarget(effect.cible)
  if (specialization) return `Tag de type ajouté : ${{ combat: 'Combat', exploration: 'Exploration', transport: 'Transport' }[specialization]}`
  if (effect.operation === 'dice-count-add') return `${label} : +${effect.valeur} dé${Number(effect.valeur) === 1 ? '' : 's'}`
  if (effect.operation === 'dice-size-step') return `${label} : +1 rang de dé`
  if (effect.cible === 'pointsEmportTourelles') return `${label} : +${effect.valeur} par achat sur une tourelle au choix`
  if (effect.operation === 'slot-add') return `${label} : ${effect.valeur} emplacement(s)`
  const amount = Number(effect.valeur)
  const displayValue = Number.isFinite(amount) && amount > 0 ? `+${effect.valeur}` : effect.valeur
  const unit = ['porteeFixe', 'courtePortee', 'moyennePortee', 'paliersSniper'].includes(effect.cible) ? ' m' : ''
  return `${label} : ${displayValue}${unit}`
}

function shipDetails(item: AtelierItem, properties: Record<string, any>): ShopItemDetail[] {
  const typeLabels: Record<string, string> = { combat: 'Combat', exploration: 'Exploration', transport: 'Transport' }
  const details: ShopItemDetail[] = [
    { label: 'Châssis', value: propertyValue('nom', properties.nom) },
    { label: 'Classe', value: String(properties.classe ?? '') },
    { label: 'Tags de type', value: atelierShipSpecializationTags(properties).map((tag) => typeLabels[tag] ?? tag).join(', ') },
    ...Object.entries(properties).filter(([key, value]) => !['nom', 'classe', 'categorie', 'specialisations'].includes(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ label: detailLabels[key] ?? key, value: propertyValue(key, value) })),
  ].filter((detail) => detail.value !== '')
  if (item.description) details.push({ label: 'Description', value: item.description })
  return details
}

function createPreview(item: AtelierItem | null, selections: AtelierPurchase[], modifications: AtelierModification[], kind: AtelierEquipmentKind): Preview {
  if (!item) return { properties: {}, error: null }
  try {
    const effects: AtelierEffect[] = []
    for (const selection of selections) {
      const modification = modifications.find((entry) => entry.id === selection.modificationId)
      const compatibility = modification && findAtelierCompatibility(modification, item)
      if (!modification || !compatibility) throw new Error('Une modification sélectionnée n’est plus compatible.')
      for (let purchase = 0; purchase < selection.quantity; purchase += 1) {
        for (const effect of modification.effets) {
          if (effect.cible === 'pointsEmportTourelles') {
            const turretIndex = selection.turretAssignments?.[purchase]
            if (turretIndex !== null && turretIndex !== undefined) effects.push({ ...effect, turretIndex })
          } else effects.push(effect)
        }
      }
    }
    return { properties: applyAtelierEffects({ nom: item.nom, ...item.properties }, effects, kind), error: null }
  } catch (error) {
    return { properties: item.properties, error: error instanceof Error ? error.message : 'L’aperçu de cette configuration est impossible.' }
  }
}

export function AtelierClient({ kind, character, items, modifications }: Props) {
  const router = useRouter()
  const submitting = useRef(false)
  const [selectedKey, setSelectedKey] = useState('')
  const [customName, setCustomName] = useState('')
  const [selections, setSelections] = useState<AtelierPurchase[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const selectedItem = items.find((item) => `${item.id}:${item.index}` === selectedKey) ?? null
  const preview = useMemo(() => createPreview(selectedItem, selections, modifications, kind), [selectedItem, selections, modifications, kind])

  useEffect(() => {
    if (!confirmOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !pending) setConfirmOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmOpen, pending])

  const availableModifications = useMemo(() => selectedItem
    ? modifications.map((modification) => ({ modification, compatibility: findAtelierCompatibility(modification, selectedItem) }))
      .filter((entry): entry is { modification: AtelierModification; compatibility: AtelierCompatibility } => {
        if (!entry.compatibility) return false
        if (selectedItem.kind !== 'vaisseau') return true
        const alreadyOwnedTags = atelierShipSpecializationTags(selectedItem.properties)
        return !entry.modification.effets.some((effect) => {
          const tag = atelierSpecializationTagForTarget(effect.cible)
          return tag !== null && alreadyOwnedTags.includes(tag)
        })
      })
    : [], [selectedItem, modifications])
  const quote = useMemo(() => {
    try {
      let points = 0
      let price = 0
      for (const entry of availableModifications) {
        const quantity = selections.find((selection) => selection.modificationId === entry.modification.id)?.quantity ?? 0
        points += atelierModificationPoints(entry.compatibility, quantity)
        if (!Number.isSafeInteger(points)) throw new Error('Le total des points dépasse la limite autorisée.')
        if (quantity) price = exactAdd(price, atelierPurchasePrice(entry.compatibility, quantity))
      }
      return { points, price, error: null as string | null }
    } catch (error) {
      return { points: 0, price: 0, error: error instanceof Error ? error.message : 'Le coût de cette configuration est invalide.' }
    }
  }, [availableModifications, selections])
  const spentPoints = quote.points
  const modificationCost = quote.price
  const totalPrice = selectedItem ? exactAdd(selectedItem.prix, modificationCost) : 0
  const remainingPoints = selectedItem ? selectedItem.points - spentPoints : 0
  const hasUnassignedTurretPurchases = kind === 'vaisseau' && selections.some((selection) => {
    const modification = modifications.find((entry) => entry.id === selection.modificationId)
    if (!modification?.effets.some((effect) => effect.cible === 'pointsEmportTourelles')) return false
    return !Array.isArray(selection.turretAssignments) || selection.turretAssignments.length !== selection.quantity || selection.turretAssignments.some((index) => !Number.isSafeInteger(index) || Number(index) < 1)
  })
  const selectedSpecializations = selections.flatMap((selection) => {
    const modification = modifications.find((entry) => entry.id === selection.modificationId)
    return Array.from({ length: selection.quantity }, () => modification?.effets.map((effect) => atelierSpecializationTagForTarget(effect.cible)).filter((tag): tag is string => tag !== null) ?? []).flat()
  })
  const hasDuplicateSpecializationPurchases = new Set(selectedSpecializations).size !== selectedSpecializations.length
    || selections.some((selection) => selection.quantity > 1 && modifications.find((entry) => entry.id === selection.modificationId)?.effets.some((effect) => atelierSpecializationTagForTarget(effect.cible)))
  const canFinalize = !!selectedItem && selections.length > 0 && !preview.error && !quote.error && !hasUnassignedTurretPurchases && !hasDuplicateSpecializationPurchases && spentPoints <= selectedItem.points && totalPrice <= character.konis && (kind === 'vaisseau' || !!customName.trim()) && !pending

  function selectItem(value: string) {
    setSelectedKey(value)
    setSelections([])
    const item = items.find((entry) => `${entry.id}:${entry.index}` === value)
    setCustomName(item && item.kind !== 'vaisseau' ? `${item.nom} Custom` : '')
    setMessage(null)
  }

  function updateQuantity(modificationId: number, quantity: number) {
    setSelections((current) => {
      const existing = current.find((entry) => entry.modificationId === modificationId)
      const next = current.filter((entry) => entry.modificationId !== modificationId)
      if (quantity > 0) {
        const modification = modifications.find((entry) => entry.id === modificationId)
        const needsAssignments = modification?.effets.some((effect) => effect.cible === 'pointsEmportTourelles') === true
        next.push({
          modificationId,
          quantity,
          ...(needsAssignments ? { turretAssignments: Array.from({ length: quantity }, (_, index) => existing?.turretAssignments?.[index] ?? null) } : {}),
        })
      }
      return next
    })
    setMessage(null)
  }

  function updateTurretAssignment(modificationId: number, purchaseIndex: number, turretIndex: number | null) {
    setSelections((current) => current.map((selection) => selection.modificationId === modificationId
      ? { ...selection, turretAssignments: (selection.turretAssignments ?? Array.from({ length: selection.quantity }, () => null)).map((value, index) => index === purchaseIndex ? turretIndex : value) }
      : selection))
    setMessage(null)
  }

  function availableTurretChoices(modificationId: number, purchaseIndex: number): number[] {
    if (!selectedItem || kind !== 'vaisseau') return []
    const modification = modifications.find((entry) => entry.id === modificationId)
    if (!modification) return []
    try {
      const increase = atelierTurretPointIncrease(modification.effets)
      const withoutThisPurchase = selections.map((selection) => selection.modificationId === modificationId
        ? { ...selection, turretAssignments: (selection.turretAssignments ?? Array.from({ length: selection.quantity }, () => null)).map((value, index) => index === purchaseIndex ? null : value) }
        : selection)
      const properties = createPreview(selectedItem, withoutThisPurchase, modifications, kind).properties
      const turretCount = Number(properties.tourelles)
      const capacities = atelierTurretCapacities(properties.pointsEmportTourelles, turretCount)
      return capacities.flatMap((capacity, index) => capacity + increase <= 4 ? [index + 1] : [])
    } catch {
      return []
    }
  }

  function addBlockReason(modification: AtelierModification, compatibility: AtelierCompatibility): string | null {
    const quantity = selections.find((entry) => entry.modificationId === modification.id)?.quantity ?? 0
    if (quantity >= Number(compatibility.maximum)) return 'Nombre maximum d’achats atteint.'
    if (modification.effets.some((effect) => atelierSpecializationTagForTarget(effect.cible)) && quantity >= 1) return 'Une spécialité ne peut être achetée qu’une fois.'
    const newTags = modification.effets.map((effect) => atelierSpecializationTagForTarget(effect.cible)).filter((tag): tag is string => tag !== null)
    const alreadySelectedTags = selections.filter((selection) => selection.modificationId !== modification.id).flatMap((selection) => {
      const selectedModification = modifications.find((entry) => entry.id === selection.modificationId)
      return selectedModification?.effets.map((effect) => atelierSpecializationTagForTarget(effect.cible)).filter((tag): tag is string => tag !== null) ?? []
    })
    if (newTags.some((tag) => alreadySelectedTags.includes(tag))) return 'Cette spécialité est déjà sélectionnée dans la configuration.'
    if (modification.effets.some((effect) => effect.cible === 'pointsEmportTourelles') && availableTurretChoices(modification.id, quantity).length === 0) return 'Aucune tourelle disponible ne peut recevoir ces points d’emport.'
    if (quantity === 0 && selections.length >= 50) return 'Limite de 50 recettes par configuration atteinte.'
    try {
      const points = atelierModificationPoints(compatibility, 1)
      if (points > remainingPoints) return 'Points de modification insuffisants.'
      const nextPrice = atelierNextPurchasePrice(compatibility, quantity)
      if (exactAdd(totalPrice, nextPrice) > character.konis) return 'Konis insuffisants pour cet achat.'
      const turretAssignments = modification.effets.some((effect) => effect.cible === 'pointsEmportTourelles')
        ? [...(selections.find((entry) => entry.modificationId === modification.id)?.turretAssignments ?? []), null]
        : undefined
      const candidate = [...selections.filter((entry) => entry.modificationId !== modification.id), { modificationId: modification.id, quantity: quantity + 1, ...(turretAssignments ? { turretAssignments } : {}) }]
      const previewError = createPreview(selectedItem, candidate, modifications, kind).error
      if (previewError) return previewError
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Cette modification ne peut pas être appliquée.'
    }
  }

  async function finalize() {
    if (!selectedItem || !canFinalize || submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    const transactionId = crypto.randomUUID()
    try {
      const result = kind === 'vaisseau'
        ? await customizeShip({ transactionId, shipId: selectedItem.id, modifications: selections })
        : await customizePersonalEquipment({
            transactionId,
            kind,
            source: { location: 'inventory', index: selectedItem.index, itemId: selectedItem.id },
            modifications: selections,
            customName: customName.trim(),
          })
      setConfirmOpen(false)
      setSelectedKey('')
      setSelections([])
      setMessage({ kind: 'success', text: `La personnalisation est terminée. ${money(result.amount)} ont été débités.` })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'La personnalisation a échoué.' })
    } finally {
      setPending(false)
      submitting.current = false
    }
  }

  const selectedById = new Map(selections.map((selection) => [selection.modificationId, selection.quantity]))
  const finalName = kind === 'vaisseau'
    ? preview.properties.nom ? String(preview.properties.nom) : selectedItem?.nom ?? ''
    : customName.trim()
  const rangeRows = selectedItem?.kind === 'arme' ? weaponRangeRows(preview.properties, {
    shortRangeBonus: selectedItem.rangeBonuses?.mod_portee_courte ?? 0,
    mediumRangeBonus: selectedItem.rangeBonuses?.mod_portee_moyenne ?? 0,
    shortRangeAdjustment: (selectedItem.rangeBonuses?.portee_courte ?? 0) + (selectedItem.rangeBonuses?.portee_flat ?? 0),
    mediumRangeAdjustment: (selectedItem.rangeBonuses?.portee_moyenne ?? 0) + (selectedItem.rangeBonuses?.portee_flat ?? 0),
  }) : []

  return <div className="atelier-page">
    <div className="atelier-intro shop-message">
      <div><strong>{character.nom}</strong><span> · {new Intl.NumberFormat('fr-FR').format(character.konis)} Konis disponibles</span></div>
      <p>Choisissez un objet admissible. Les changements restent en attente jusqu’à la confirmation finale.</p>
    </div>

    <section className="atelier-selector" aria-labelledby="atelier-item-heading">
      <div className="atelier-section-heading"><div><h2 id="atelier-item-heading">Objet à personnaliser</h2><p>{labels(kind)}</p></div></div>
      {items.length === 0
        ? <div className="shop-empty">Aucun objet de votre réserve ne remplit les conditions de cet Atelier.</div>
        : <label className="atelier-select-label">Sélectionner un objet
            <select value={selectedKey} onChange={(event) => selectItem(event.target.value)}>
              <option value="">Choisir…</option>
              {items.map((item) => <option key={`${item.id}:${item.index}`} value={`${item.id}:${item.index}`}>
                {item.nom} · {item.kind === 'vaisseau' ? item.classe?.toUpperCase() : categoryLabels[item.categorie] ?? item.categorie}
              </option>)}
            </select>
          </label>}
    </section>

    {selectedItem && <>
      <section className="atelier-item-panel" aria-labelledby="atelier-preview-heading">
        <div className="atelier-section-heading"><div><h2 id="atelier-preview-heading">{kind === 'vaisseau' ? 'Aperçu du vaisseau' : 'Caractéristiques de l’objet'}</h2>
          <p>{kind === 'vaisseau' ? `${selectedItem.modelNom} · ${selectedItem.classe?.toUpperCase()}` : `${categoryLabels[selectedItem.categorie] ?? selectedItem.categorie} · ${selectedItem.type.map((type) => type === 'cinetique' ? 'Cinétique' : type === 'thermique' ? 'Thermique' : type).join(', ')}`}</p></div>
        </div>
        {kind === 'vaisseau' ? <div className="atelier-ship-preview">
          {selectedItem.image && <img src={selectedItem.image.url} alt={selectedItem.image.alt} />}
          <div><h3>{selectedItem.nom}</h3><p>{selectedItem.modelNom} · {selectedItem.classe?.toUpperCase()}</p>
            <dl className="atelier-stats atelier-ship-details">{shipDetails(selectedItem, preview.properties).map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
          </div>
        </div> : <div className="atelier-personal-preview">
          {selectedItem.image && <img src={selectedItem.image.url} alt={selectedItem.image.alt} />}
          <div className="atelier-personal-content">
            <div className="atelier-personal-heading"><span className="shop-item-type">{categoryLabels[selectedItem.categorie] ?? selectedItem.categorie}</span><h3>{finalName}</h3>
              {kind === 'armure' && selectedItem.setNom && <p>Set {selectedItem.setNom}</p>}
            </div>
            {kind === 'arme' && rangeRows.length > 0 && <table className="weapon-range-table atelier-range-table">
              <thead><tr>{rangeRows.map((row, index) => <th key={`${row.label}-${index}`}>{row.label}</th>)}</tr></thead>
              <tbody><tr>{rangeRows.map((row, index) => <td key={`${row.label}-${index}`}>{row.mod}</td>)}</tr></tbody>
            </table>}
            <dl className="atelier-stats">{personalDetails(selectedItem, preview.properties).map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
          </div>
        </div>}
        <div className="atelier-budget">
          <div><span>Points disponibles</span><strong>{selectedItem.points}</strong></div>
          <div><span>Points utilisés</span><strong>{spentPoints}</strong></div>
          <div><span>Points restants</span><strong>{remainingPoints}</strong></div>
          <div><span>Prix de base</span><strong>{money(selectedItem.prix)}</strong></div>
          <div><span>Modifications</span><strong>{money(modificationCost)}</strong></div>
          <div className="atelier-budget-total"><span>Prix final</span><strong>{money(totalPrice)}</strong></div>
        </div>
        {(preview.error || quote.error) && <p className="atelier-inline-error" role="alert">{preview.error ?? quote.error}</p>}
        {hasUnassignedTurretPurchases && <p className="atelier-inline-error" role="alert">Choisissez une tourelle pour chaque achat de points d’emport.</p>}
        {hasDuplicateSpecializationPurchases && <p className="atelier-inline-error" role="alert">Chaque spécialité ne peut être achetée qu’une fois par vaisseau.</p>}
        {totalPrice > character.konis && <p className="atelier-inline-error" role="alert">Votre solde de Konis est insuffisant pour cette configuration.</p>}
      </section>

      <section className="atelier-recipes" aria-labelledby="atelier-recipes-heading">
        <div className="atelier-section-heading"><div><h2 id="atelier-recipes-heading">Modifications compatibles</h2><p>Chaque recette affiche son coût en Konis et en points. Les achats répétés respectent leur maximum.</p></div></div>
        {availableModifications.length === 0
          ? <div className="shop-empty">Aucune modification active n’est compatible avec cet objet.</div>
          : <div className="atelier-recipe-grid">{availableModifications.map(({ modification, compatibility }) => {
              const quantity = selectedById.get(modification.id) ?? 0
              let nextPrice: number | null = null
              let selectedCost = 0
              try {
                if (quantity < Number(compatibility.maximum)) nextPrice = atelierNextPurchasePrice(compatibility, quantity)
                selectedCost = quantity ? atelierPurchasePrice(compatibility, quantity) : 0
              } catch { /* The reason is shown next to the disabled control. */ }
              const addReason = addBlockReason(modification, compatibility)
              const addable = addReason === null
              return <article className={`atelier-recipe${quantity ? ' atelier-recipe-selected' : ''}`} key={modification.id}>
                <div className="atelier-recipe-title"><div><h3>{modification.nom}</h3>{modification.description && <p>{modification.description}</p>}</div>
                  {quantity > 0 && <span className="atelier-recipe-count">{quantity}/{compatibility.maximum}</span>}
                </div>
                <div className="atelier-recipe-cost"><span>{nextPrice === null ? quantity >= Number(compatibility.maximum) ? 'Maximum atteint' : 'Prix indisponible' : `Prochain achat : ${money(nextPrice)}`}</span><span>{atelierModificationPoints(compatibility, 1)} points par achat</span></div>
                {quantity > 0 && <small className="atelier-multiplier">Coût sélectionné : {money(selectedCost)}</small>}
                {compatibility.multiplicateurRachat && compatibility.multiplicateurRachat > 1 && <small className="atelier-multiplier">Prix multiplié par ×{compatibility.multiplicateurRachat} à chaque rachat</small>}
                {modification.effets.length > 0 && <ul>{modification.effets.map((effect, index) => <li key={`${effect.cible}-${index}`}>{formatEffect(effect)}</li>)}</ul>}
                {quantity > 0 && kind === 'vaisseau' && modification.effets.some((effect) => effect.cible === 'pointsEmportTourelles') && <div className="atelier-turret-assignments">
                  {Array.from({ length: quantity }, (_, purchaseIndex) => {
                    const assignedTurret = selections.find((entry) => entry.modificationId === modification.id)?.turretAssignments?.[purchaseIndex] ?? null
                    const turretChoices = availableTurretChoices(modification.id, purchaseIndex)
                    return <label key={purchaseIndex}>Achat {purchaseIndex + 1} · Tourelle
                      <select value={assignedTurret ?? ''} disabled={pending} onChange={(event) => updateTurretAssignment(modification.id, purchaseIndex, event.target.value ? Number(event.target.value) : null)}>
                        <option value="">Sélectionner une tourelle</option>
                        {assignedTurret !== null && !turretChoices.includes(assignedTurret) && <option value={assignedTurret} disabled>Tourelle {assignedTurret} · capacité dépassée</option>}
                        {turretChoices.map((turret) => <option key={turret} value={turret}>Tourelle {turret}</option>)}
                      </select>
                    </label>
                  })}
                </div>}
                <div className="atelier-recipe-actions">
                  <button type="button" className="atelier-recipe-remove" disabled={!quantity || pending} onClick={() => updateQuantity(modification.id, quantity - 1)} aria-label={`Retirer un achat de ${modification.nom}`}>−</button>
                  <span>{quantity} achat{quantity > 1 ? 's' : ''}</span>
                  <button type="button" disabled={!addable || pending} onClick={() => updateQuantity(modification.id, quantity + 1)} aria-label={`Ajouter un achat de ${modification.nom}`}>+</button>
                </div>
                {!addable && <small className="atelier-disabled-reason">{addReason}</small>}
              </article>
            })}</div>}
      </section>

      <section className="atelier-cart">
        <div><h2>Configuration en attente</h2><p>{selections.reduce((sum, selection) => sum + selection.quantity, 0)} modification(s) · {spentPoints}/{selectedItem.points} points · {money(totalPrice)}</p></div>
        <div className="atelier-cart-actions">
          <button type="button" className="atelier-reset-button" onClick={() => { setSelectedKey(''); setSelections([]); setMessage(null) }} disabled={pending}>Annuler la configuration</button>
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canFinalize}>Vérifier et confirmer</button>
        </div>
      </section>
    </>}

    {message && <p className={`shop-message ${message.kind}`} role="status">{message.text}</p>}

    {confirmOpen && selectedItem && <div className="shop-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setConfirmOpen(false) }}>
      <section className="shop-confirm atelier-confirm" role="dialog" aria-modal="true" aria-labelledby="atelier-confirm-title">
        <h2 id="atelier-confirm-title">Confirmer la personnalisation</h2>
        <p><strong>{finalName}</strong> sera créé comme objet unique. L’objet de réserve sera supprimé et ses composants seront transférés.</p>
        {kind !== 'vaisseau' && <label className="atelier-confirm-name">Nom de l’objet
          <input type="text" value={customName} onChange={(event) => setCustomName(event.target.value)} maxLength={120} required />
        </label>}
        <dl className="atelier-confirm-stats">{(kind === 'vaisseau' ? shipDetails(selectedItem, preview.properties) : personalDetails(selectedItem, preview.properties)).map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
        <ul>{selections.map((selection) => <li key={selection.modificationId}>{modifications.find((entry) => entry.id === selection.modificationId)?.nom} × {selection.quantity}</li>)}</ul>
        <div className="atelier-confirm-total"><span>{spentPoints} points utilisés · {remainingPoints} restants</span><strong>{money(totalPrice)}</strong></div>
        <div><button type="button" className="shop-cancel-button" disabled={pending} onClick={() => setConfirmOpen(false)}>Continuer les modifications</button>
          <button type="button" disabled={!canFinalize} onClick={finalize}>{pending ? 'Création…' : 'Confirmer la création'}</button></div>
      </section>
    </div>}
  </div>
}
