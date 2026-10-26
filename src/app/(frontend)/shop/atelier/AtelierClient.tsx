'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyAtelierEffects, atelierModificationPoints, atelierPurchasePrice, findAtelierCompatibility, type AtelierCompatibility, type AtelierEffect, type AtelierEquipmentKind, type AtelierPurchase } from '@/lib/atelier'
import { exactAdd } from '@/lib/shop'
import type { ShopItemDetail } from '../ShopItemDetails'
import { ShopItemDetailsButton } from '../ShopItemDetails'
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
  details: 'Détails', valeurArmurePhysique: 'Armure physique', valeurBouclier: 'Bouclier', valeurRupture: 'Rupture',
  modificateur: 'Modificateur', rang: 'Rang requis', stockage: 'Stockage', prix: 'Prix catalogue',
  blindage: 'Blindage', esquiveBase: 'Esquive de base', tourelles: 'Tourelles', pointsEmportPilote: 'Points d’emport pilote',
  pointsEmportTourelles: 'Points d’emport tourelles', modulesSupplementaires: 'Modules supplémentaires', consommables: 'Emplacements consommables',
}
const labels = (kind: AtelierEquipmentKind) => kind === 'arme' ? 'Armes de la réserve' : kind === 'armure' ? 'Armures de la réserve' : 'Vaisseaux disponibles'

function propertyValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') return ''
  if (key === 'categorie') return categoryLabels[String(value)] ?? String(value)
  if (key === 'type' && Array.isArray(value)) return value.map((type) => ({ thermique: 'Thermique', cinetique: 'Cinétique', plasma: 'Plasma', explosif: 'Explosif', melee: 'Mêlée' } as Record<string, string>)[String(type)] ?? String(type)).join(', ')
  if (Array.isArray(value)) {
    return value.map((entry) => typeof entry === 'object' ? Object.entries(entry).filter(([, child]) => child != null && child !== '').map(([name, child]) => `${name} ${child}`).join(' · ') : String(entry)).filter(Boolean).join(' · ')
  }
  if (typeof value === 'object') return value.nom ?? JSON.stringify(value)
  return String(value)
}

function personalDetails(item: AtelierItem, properties: Record<string, any>): ShopItemDetail[] {
  const entries = Object.entries(properties)
    .filter(([key, value]) => key !== 'nom' && key !== 'id' && key !== 'image' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({ label: detailLabels[key] ?? key, value: propertyValue(key, value) }))
  if (item.kind === 'armure' && item.setNom) entries.push({ label: 'Set d’armure', value: item.setNom })
  return entries
}

function shipDetails(item: AtelierItem, properties: Record<string, any>): ShopItemDetail[] {
  const details: ShopItemDetail[] = [
    { label: 'Châssis', value: propertyValue('nom', properties.nom) },
    { label: 'Classe', value: String(properties.classe ?? '') },
    ...Object.entries(properties).filter(([key, value]) => !['nom', 'classe', 'categorie'].includes(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ label: detailLabels[key] ?? key, value: propertyValue(key, value) })),
  ].filter((detail) => detail.value !== '')
  if (item.components.length) details.push({ label: 'Équipements inclus', value: item.components.join(' · ') })
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
      for (let purchase = 0; purchase < selection.quantity; purchase += 1) effects.push(...modification.effets)
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
      .filter((entry): entry is { modification: AtelierModification; compatibility: AtelierCompatibility } => entry.compatibility !== null)
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
  const canFinalize = !!selectedItem && selections.length > 0 && !preview.error && !quote.error && spentPoints <= selectedItem.points && totalPrice <= character.konis && !pending

  function selectItem(value: string) {
    setSelectedKey(value)
    setSelections([])
    setMessage(null)
  }

  function updateQuantity(modificationId: number, quantity: number) {
    setSelections((current) => {
      const next = current.filter((entry) => entry.modificationId !== modificationId)
      if (quantity > 0) next.push({ modificationId, quantity })
      return next
    })
    setMessage(null)
  }

  function canAdd(modification: AtelierModification, compatibility: AtelierCompatibility) {
    const quantity = selections.find((entry) => entry.modificationId === modification.id)?.quantity ?? 0
    if (quantity >= Number(compatibility.maximum)) return false
    if (quantity === 0 && selections.length >= 50) return false
    try {
      if (atelierModificationPoints(compatibility, 1) > remainingPoints) return false
      atelierPurchasePrice(compatibility, quantity + 1)
      const candidate = [...selections.filter((entry) => entry.modificationId !== modification.id), { modificationId: modification.id, quantity: quantity + 1 }]
      return !createPreview(selectedItem, candidate, modifications, kind).error
    } catch { return false }
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
  const finalName = preview.properties.nom ? String(preview.properties.nom) : selectedItem?.nom ?? ''

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
            <ShopItemDetailsButton name={selectedItem.modelNom ?? selectedItem.nom} category="Modèle de vaisseau" image={selectedItem.image} details={shipDetails(selectedItem, preview.properties)} />
          </div>
        </div> : <div className="atelier-personal-preview">
          {selectedItem.image && <img src={selectedItem.image.url} alt={selectedItem.image.alt} />}
          <div className="atelier-personal-heading"><span className="shop-item-type">{categoryLabels[selectedItem.categorie] ?? selectedItem.categorie}</span><h3>{finalName}</h3>
            {kind === 'armure' && selectedItem.setNom && <p>Set {selectedItem.setNom}</p>}
          </div>
          <dl className="atelier-stats">{personalDetails(selectedItem, preview.properties).map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
        </div>}
        <div className="atelier-budget">
          <div><span>Points disponibles</span><strong>{selectedItem.points}</strong></div>
          <div><span>Points utilisés</span><strong>{spentPoints}</strong></div>
          <div><span>Points restants</span><strong>{remainingPoints}</strong></div>
          <div><span>Prix de base</span><strong>{money(selectedItem.prix)}</strong></div>
          <div><span>Modifications</span><strong>{money(modificationCost)}</strong></div>
          <div className="atelier-budget-total"><span>Prix final</span><strong>{money(totalPrice)}</strong></div>
        </div>
        {selectedItem.components.length > 0 && <p className="atelier-components">Composants conservés : {selectedItem.components.join(', ')}</p>}
        {(preview.error || quote.error) && <p className="atelier-inline-error" role="alert">{preview.error ?? quote.error}</p>}
        {totalPrice > character.konis && <p className="atelier-inline-error" role="alert">Votre solde de Konis est insuffisant pour cette configuration.</p>}
      </section>

      <section className="atelier-recipes" aria-labelledby="atelier-recipes-heading">
        <div className="atelier-section-heading"><div><h2 id="atelier-recipes-heading">Modifications compatibles</h2><p>Chaque recette affiche son coût en Konis et en points. Les achats répétés respectent leur maximum.</p></div></div>
        {availableModifications.length === 0
          ? <div className="shop-empty">Aucune modification active n’est compatible avec cet objet.</div>
          : <div className="atelier-recipe-grid">{availableModifications.map(({ modification, compatibility }) => {
              const quantity = selectedById.get(modification.id) ?? 0
              let unitPrice = Number(compatibility.prix)
              if (quantity > 0) {
                try { unitPrice = atelierPurchasePrice(compatibility, quantity) }
                catch { unitPrice = Number(compatibility.prix) }
              }
              const addable = canAdd(modification, compatibility)
              return <article className={`atelier-recipe${quantity ? ' atelier-recipe-selected' : ''}`} key={modification.id}>
                <div className="atelier-recipe-title"><div><h3>{modification.nom}</h3>{modification.description && <p>{modification.description}</p>}</div>
                  {quantity > 0 && <span className="atelier-recipe-count">{quantity}/{compatibility.maximum}</span>}
                </div>
                <div className="atelier-recipe-cost"><span>{money(Number(compatibility.prix))} le premier achat</span><span>{atelierModificationPoints(compatibility, 1)} points par achat</span></div>
                {compatibility.multiplicateurRachat && compatibility.multiplicateurRachat > 1 && <small className="atelier-multiplier">Rachats suivants ×{compatibility.multiplicateurRachat} · total actuel {money(unitPrice)}</small>}
                {modification.effets.length > 0 && <ul>{modification.effets.map((effect, index) => <li key={`${effect.cible}-${index}`}>{effect.cible} : {effect.valeur}</li>)}</ul>}
                <div className="atelier-recipe-actions">
                  <button type="button" className="atelier-recipe-remove" disabled={!quantity || pending} onClick={() => updateQuantity(modification.id, quantity - 1)} aria-label={`Retirer un achat de ${modification.nom}`}>−</button>
                  <span>{quantity} achat{quantity > 1 ? 's' : ''}</span>
                  <button type="button" disabled={!addable || pending} onClick={() => updateQuantity(modification.id, quantity + 1)} aria-label={`Ajouter un achat de ${modification.nom}`}>+</button>
                </div>
                {!addable && quantity < Number(compatibility.maximum) && remainingPoints < atelierModificationPoints(compatibility, 1) && <small className="atelier-disabled-reason">Points insuffisants</small>}
                {!addable && quantity === 0 && selections.length >= 50 && <small className="atelier-disabled-reason">Limite de 50 recettes par configuration atteinte</small>}
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
        <dl className="atelier-confirm-stats">{(kind === 'vaisseau' ? shipDetails(selectedItem, preview.properties) : personalDetails(selectedItem, preview.properties)).map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
        <ul>{selections.map((selection) => <li key={selection.modificationId}>{modifications.find((entry) => entry.id === selection.modificationId)?.nom} × {selection.quantity}</li>)}</ul>
        <div className="atelier-confirm-total"><span>{spentPoints} points utilisés · {remainingPoints} restants</span><strong>{money(totalPrice)}</strong></div>
        <div><button type="button" className="shop-cancel-button" disabled={pending} onClick={() => setConfirmOpen(false)}>Continuer les modifications</button>
          <button type="button" disabled={!canFinalize} onClick={finalize}>{pending ? 'Création…' : 'Confirmer la création'}</button></div>
      </section>
    </div>}
  </div>
}
