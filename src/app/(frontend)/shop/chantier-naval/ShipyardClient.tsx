'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { readShopPrice, resalePrice } from '@/lib/shop'
import { groupShipCatalog, listShipTransferItems, shipPurchasePrice, shipSalePrice, type ShipCatalogEntry, type ShipSaleComponent, type ShipTransferItem } from '@/lib/shipyard'
import { executeShipyardTransaction } from '../shipyard-actions'

type ShipModel = ShipCatalogEntry & {
  description: string | null
  chassis: string | null
  tourelles: number
  components: [string, string][]
}
type ShipSummary = {
  id: number
  nom: string
  proprietaire: number | null
  modele: { id: number; nom: string; prix: number | string | null } | null
  moduleGenerateur: unknown
  modulePropulseurs: unknown
  moduleSurvie: unknown
  moduleBoucliers: unknown
  modulesSupplementaires: unknown[]
  armesPilote: unknown[]
  armesTourelles: unknown[]
  consommablesVaisseau: unknown[]
  inventaireModules: unknown[]
  inventaireArmes: unknown[]
  inventaireConsommables: unknown[]
  components: ShipSaleComponent[]
  transferItems: ShipTransferItem[]
}
type Request = Parameters<typeof executeShipyardTransaction>[0]
type Confirmation = { request: Omit<Request, 'transactionId'>; transactionId: string; text: string; success: string }

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`
const priceLabel = (value: number | string | null | undefined) => {
  const price = readShopPrice(value)
  return price === null ? 'Non commercialisable' : money(price)
}
const typeLabels: Record<string, string> = { module: 'Module', weapon: 'Arme', consumable: 'Consommable' }

export function ShipyardClient({
  character,
  models,
  ownedShips,
  writableShips,
  activeShipId,
}: {
  character: { id: number; nom: string; konis: number }
  models: ShipModel[]
  ownedShips: ShipSummary[]
  writableShips: ShipSummary[]
  activeShipId: number | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'buy' | 'sell' | 'transfer'>('buy')
  const [shipNames, setShipNames] = useState<Record<number, string>>({})
  const [sellShipId, setSellShipId] = useState(ownedShips[0]?.id ?? 0)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [sourceShipId, setSourceShipId] = useState(writableShips[0]?.id ?? 0)
  const [destinationShipId, setDestinationShipId] = useState(writableShips.find((ship) => ship.id !== writableShips[0]?.id)?.id ?? 0)
  const [sourceKey, setSourceKey] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [retryRequest, setRetryRequest] = useState<Confirmation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const submitting = useRef(false)

  const sellShip = ownedShips.find((ship) => ship.id === sellShipId)
  const activeDestination = writableShips.find((ship) => ship.id === activeShipId)
  const transferSource = writableShips.find((ship) => ship.id === sourceShipId)
  const transferDestinationOptions = writableShips.filter((ship) => ship.id !== sourceShipId)
  const transferDestination = writableShips.find((ship) => ship.id === destinationShipId && ship.id !== sourceShipId)
  const transferItems = useMemo(() => transferSource ? listShipTransferItems(transferSource).filter((item) => item.quantity > 0) : [], [transferSource])
  const transferItem = transferItems.find((item) => item.key === sourceKey)

  useEffect(() => {
    if (!ownedShips.some((ship) => ship.id === sellShipId)) setSellShipId(ownedShips[0]?.id ?? 0)
  }, [ownedShips, sellShipId])
  useEffect(() => {
    if (!sellShip) { setSelectedComponents([]); return }
    setSelectedComponents(sellShip.components.filter((component) => readShopPrice(component.prix) !== null).map((component) => component.key))
  }, [sellShip])
  useEffect(() => {
    if (!writableShips.some((ship) => ship.id === sourceShipId)) setSourceShipId(writableShips[0]?.id ?? 0)
    const nextSource = writableShips.find((ship) => ship.id === sourceShipId)
    if (!nextSource || destinationShipId === sourceShipId || !writableShips.some((ship) => ship.id === destinationShipId)) {
      setDestinationShipId(writableShips.find((ship) => ship.id !== nextSource?.id)?.id ?? 0)
    }
  }, [writableShips, sourceShipId, destinationShipId])
  useEffect(() => {
    if (!transferItems.some((item) => item.key === sourceKey)) setSourceKey(transferItems[0]?.key ?? '')
  }, [transferItems, sourceKey])
  useEffect(() => setQuantity(transferItem?.equipe ? transferItem.quantity : 1), [transferItem?.key, transferItem?.equipe, transferItem?.quantity])

  const chassisOnly = (model: ShipModel) => shipPurchasePrice(model.prix, true)
  const fullPrice = (model: ShipModel) => shipPurchasePrice(model.prix, false)
  const catalogSections = useMemo(() => groupShipCatalog(models), [models])
  const saleTotal = sellShip?.modele
    ? shipSalePrice(sellShip.modele.prix, sellShip.components.filter((component) => selectedComponents.includes(component.key)).map((component) => component.prix))
    : null
  const chassisSalePrice = sellShip?.modele ? readShopPrice(sellShip.modele.prix) : null

  function toggleComponent(key: string) {
    setSelectedComponents((selected) => selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key])
  }

  function requestTransaction(request: Omit<Request, 'transactionId'>, text: string, success: string) {
    const confirmation = { request, transactionId: crypto.randomUUID(), text, success }
    setRetryRequest(null)
    setConfirmation(confirmation)
  }

  async function send(current: Confirmation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await executeShipyardTransaction({ ...current.request, transactionId: current.transactionId })
      setMessage({ kind: 'success', text: `${current.success} (${money(Math.abs(result.amount))}).` })
      setRetryRequest(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'La transaction a échoué.' })
      setRetryRequest(current)
    } finally {
      setPending(false)
      submitting.current = false
    }
  }

  async function confirm() {
    if (!confirmation) return
    const current = confirmation
    setConfirmation(null)
    await send(current)
  }

  function buy(model: ShipModel, onlyChassis: boolean) {
    const name = shipNames[model.id]?.trim() || model.nom
    const price = onlyChassis ? chassisOnly(model) : fullPrice(model)
    if (price === null) return
    requestTransaction(
      { action: 'buy', saleModelId: model.id, chassisOnly: onlyChassis, shipName: name },
      `Acheter ${onlyChassis ? 'le châssis seul' : 'le modèle complet'} ${model.nom} pour ${money(price)} ?`,
      `${name} a été acheté`,
    )
  }

  function sell() {
    if (!sellShip || !activeDestination || saleTotal === null) return
    requestTransaction(
      { action: 'sell', shipId: sellShip.id, destinationShipId: activeDestination.id, componentKeys: selectedComponents },
      `Vendre le châssis de ${sellShip.nom} et les composants sélectionnés pour ${money(saleTotal)} ? La soute et les éléments non vendus seront transférés vers ${activeDestination.nom}. L’équipage de ${sellShip.nom} sera débarqué.`,
      `${sellShip.nom} a été vendu et sa soute transférée`,
    )
  }

  function transfer() {
    if (!transferSource || !transferDestination || !transferItem) return
    requestTransaction(
      { action: 'transfer', shipId: transferSource.id, destinationShipId: transferDestination.id, sourceKey: transferItem.key, quantity: transferItem.equipe ? transferItem.quantity : quantity },
      `Transférer ${transferItem.equipe ? 'tout' : quantity} × ${transferItem.nom} de ${transferSource.nom} vers ${transferDestination.nom}${transferItem.ammoQuantity ? `, avec ${transferItem.ammoQuantity} munition(s)` : ''} ?`,
      `${transferItem.nom} a été transféré dans la soute de ${transferDestination.nom}`,
    )
  }

  return <div className="shop-app shipyard-app">
    <div className="shop-wallet"><span>{character.nom}</span><strong>{money(character.konis)}</strong></div>
    <nav className="shop-tabs" aria-label="Opérations du chantier naval">
      <button type="button" className={tab === 'buy' ? 'active' : ''} onClick={() => setTab('buy')}>Acheter</button>
      <button type="button" className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>Vendre</button>
      <button type="button" className={tab === 'transfer' ? 'active' : ''} onClick={() => setTab('transfer')}>Transférer du matériel</button>
    </nav>
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={() => send(retryRequest)}>Réessayer la même opération</button>}</div>}

    {tab === 'buy' && <section className="shop-catalog-groups shipyard-purchase-catalog">
      <div><h2>Modèles disponibles</h2><p>Le modèle complet reprend le châssis, les modules et les armes définis dans sa fiche. L’achat du châssis seul n’inclut aucun de ces équipements.</p></div>
      {!models.length && <p className="shop-empty">Aucun modèle de vente n’est disponible.</p>}
      {catalogSections.map((shipClass) => <section className="shipyard-class-section" key={shipClass.value}>
        <header className="shipyard-class-heading"><h2>Classe {shipClass.label}</h2><span>Taille {shipClass.size}</span></header>
        {!shipClass.categories.length && <p className="shop-empty">Aucun modèle de cette classe n’est disponible.</p>}
        {shipClass.categories.map((category) => <section className="shipyard-category-section" key={category.value}>
          <h3><span className={`shipyard-category-label shipyard-category-${category.value}`}>{category.label}</span></h3>
          <div className="shipyard-model-grid">{category.models.map((model) => {
            const full = fullPrice(model)
            const hull = chassisOnly(model)
            return <article className="shipyard-model-card" key={model.id}>
              <div className="shipyard-model-heading"><h3>{model.nom}</h3><strong>{priceLabel(model.prix)}</strong></div>
              <div className="shipyard-model-meta">{[model.chassis, model.tourelles ? `${model.tourelles} tourelle(s)` : null].filter(Boolean).join(' · ')}</div>
              {model.description && <p>{model.description}</p>}
              <details className="shipyard-model-components"><summary>Équipement inclus ({model.components.length})</summary><ul>{model.components.map(([kind, name], index) => <li key={`${kind}-${name}-${index}`}><span>{kind}</span><strong>{name}</strong></li>)}</ul></details>
              <label className="shipyard-name-field">Nom du vaisseau<input maxLength={100} value={shipNames[model.id] ?? ''} onChange={(event) => setShipNames((current) => ({ ...current, [model.id]: event.target.value }))} placeholder={model.nom} /></label>
              <div className="shipyard-model-actions">
                <button type="button" disabled={pending || full === null} onClick={() => buy(model, false)}>Acheter le modèle · {full === null ? 'Non commercialisable' : money(full)}</button>
                <button type="button" className="shipyard-secondary-action" disabled={pending || hull === null} onClick={() => buy(model, true)}>Acheter le châssis seul · {hull === null ? 'Non commercialisable' : money(hull)}</button>
              </div>
            </article>
          })}</div>
        </section>)}
      </section>)}
    </section>}

    {tab === 'sell' && <section className="shop-catalog-groups shipyard-operation">
      <div><h2>Vendre un vaisseau</h2><p>Le châssis est toujours vendu. Choisissez les modules et armes installés à vendre en plus; les éléments exclus, les consommables embarqués et la soute sont transférés vers le vaisseau actif.</p></div>
      {!ownedShips.length && <p className="shop-empty">Vous ne possédez aucun vaisseau à vendre.</p>}
      {!!ownedShips.length && <>
        <label className="shop-mod-flow shipyard-select">Vaisseau à vendre<select value={sellShipId} onChange={(event) => setSellShipId(Number(event.target.value))}>{ownedShips.map((ship) => <option value={ship.id} key={ship.id}>{ship.nom} · {ship.modele?.nom ?? 'Modèle inconnu'}</option>)}</select></label>
        {!activeDestination && <p className="shop-empty">La vente nécessite un autre vaisseau actif sur lequel vous avez les droits d’écriture.</p>}
        {activeDestination && <p className="shop-empty shipyard-destination-note">La soute sera transférée vers votre vaisseau actif : <strong>{activeDestination.nom}</strong>.</p>}
        {sellShip && <>
          <section className="shipyard-sale-components"><h3>Éléments installés</h3>
          <div className="shop-inventory-item shipyard-component-row shipyard-chassis-row"><div><strong>Châssis · {sellShip.modele?.nom ?? 'Modèle inconnu'}</strong><span>Vendu obligatoirement à 25 % du prix du modèle de vente</span></div><strong>{chassisSalePrice === null ? 'Prix indisponible' : money(chassisSalePrice * 0.25)}</strong></div>
            {sellShip.components.map((component) => {
              const price = readShopPrice(component.prix)
              const selected = selectedComponents.includes(component.key)
              return <label className="shop-inventory-item shipyard-component-row" key={component.key}>
                <span className="shipyard-component-check"><input type="checkbox" checked={selected} disabled={pending || price === null} onChange={() => toggleComponent(component.key)} /><span><strong>{component.nom}</strong><small>{component.emplacement} · {component.kind === 'module' ? 'Module' : 'Arme'}</small></span></span>
                <strong>{price === null ? 'Sans prix · sera transféré' : `Revente : ${money(resalePrice(price))}`}</strong>
              </label>
            })}
            {!sellShip.components.length && <p className="shop-empty">Aucun module ou arme n’est installé sur ce vaisseau.</p>}
          </section>
          <div className="shipyard-sale-total"><span>Produit de la vente</span><strong>{saleTotal === null ? 'Montant indisponible' : money(saleTotal)}</strong></div>
          <button className="shipyard-danger-action" type="button" disabled={pending || !activeDestination || activeDestination.id === sellShip.id || saleTotal === null} onClick={sell}>Vendre le vaisseau et transférer son contenu</button>
        </>}
      </>}
    </section>}

    {tab === 'transfer' && <section className="shop-catalog-groups shipyard-operation">
      <div><h2>Transférer du matériel</h2><p>La destination doit être différente de la source. Un élément équipé arrive toujours dans la soute; les munitions d’une arme équipée sont ajoutées à la soute de destination.</p></div>
      {writableShips.length < 2 && <p className="shop-empty">Il faut avoir les droits d’écriture sur au moins deux vaisseaux pour transférer du matériel.</p>}
      {writableShips.length >= 2 && <>
        <div className="shipyard-transfer-selects">
          <label>Vaisseau source<select value={sourceShipId} onChange={(event) => setSourceShipId(Number(event.target.value))}>{writableShips.map((ship) => <option value={ship.id} key={ship.id}>{ship.nom}</option>)}</select></label>
          <label>Vaisseau destination<select value={destinationShipId} onChange={(event) => setDestinationShipId(Number(event.target.value))}>{transferDestinationOptions.map((ship) => <option value={ship.id} key={ship.id}>{ship.nom}</option>)}</select></label>
        </div>
        {transferSource && <>
          {!transferItems.length && <p className="shop-empty">Aucun matériel transférable n’est présent sur ce vaisseau.</p>}
          {!!transferItems.length && <>
            <label className="shop-mod-flow shipyard-select">Élément à transférer<select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)}>{transferItems.map((item) => <option value={item.key} key={item.key}>{item.nom} · {typeLabels[item.kind]} · {item.emplacement}{item.equipe ? '' : ` · ${item.quantity} en soute`}</option>)}</select></label>
            {transferItem && <div className="shop-empty shipyard-transfer-detail">
              <strong>{transferItem.nom}</strong><span>{transferItem.emplacement}{transferItem.equipe ? ' · équipement installé' : ` · ${transferItem.quantity} en soute`}</span>
              {transferItem.ammoQuantity ? <span>{transferItem.ammoQuantity} munition(s) ({transferItem.ammoNom}) seront aussi transférées.</span> : null}
              {!transferItem.equipe && transferItem.quantity > 1 && <label className="shop-quantity">Quantité à transférer<input type="number" min={1} max={transferItem.quantity} step={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(transferItem.quantity, Number(event.target.value) || 1)))} /></label>}
            </div>}
            <button type="button" disabled={pending || !transferItem || !transferDestination} onClick={transfer}>Transférer vers la soute</button>
          </>}
        </>}
      </>}
    </section>}

    {confirmation && <div className="shop-confirm-backdrop" role="presentation"><section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="shipyard-confirm-title"><h2 id="shipyard-confirm-title">Confirmer l’opération</h2><p>{confirmation.text}</p><div><button type="button" className="shop-cancel-button" onClick={() => setConfirmation(null)}>Annuler</button><button type="button" disabled={pending} onClick={confirm}>Confirmer</button></div></section></div>}
  </div>
}
