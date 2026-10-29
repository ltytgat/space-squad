'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { readShopPrice } from '@/lib/shop'
import { normalizeShopCatalogText, ShopCatalogFilters } from '../ShopCatalogFilters'
import { groupVehicleCatalog, minimumRankForVehicleClass, vehicleCatalogClasses, vehicleSalePrice, type VehicleCatalogEntry } from '@/lib/vehicleGarage'
import { executeVehicleGarageTransaction } from '../vehicle-garage-actions'

type VehicleModel = VehicleCatalogEntry & {
  policyPercentage?: number
  image: { url: string; alt: string } | null
  places: number
  emportsArmesPersonnages: number
  blindageMax: number
  bouclierMax: number
  rechargeBouclier: number
  mouvement: number
  options: string[]
}
type OwnedVehicle = {
  id: number
  nom: string
  modelName: string
  modelPrice: number | string | null
  blindageActuel: number
  blindageMax: number
  weaponName: string | null
  magazineName: string | null
  ammunition: number
}
type Request = Parameters<typeof executeVehicleGarageTransaction>[0]
type Confirmation = { request: Omit<Request, 'transactionId'>; transactionId: string; text: string; success: string }

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`
const priceLabel = (value: number | string | null | undefined) => {
  const price = readShopPrice(value)
  return price === null ? 'Non commercialisable' : money(price)
}

export function GarageClient({
  character,
  models,
  vehicles,
  activeShipName,
  activeShipCanReceive,
}: {
  character: { id: number; nom: string; konis: number; rang: number }
  models: VehicleModel[]
  vehicles: OwnedVehicle[]
  activeShipName: string | null
  activeShipCanReceive: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [vehicleNames, setVehicleNames] = useState<Record<number, string>>({})
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? 0)
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [retryRequest, setRetryRequest] = useState<Confirmation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogClass, setCatalogClass] = useState('all')
  const [catalogVariant, setCatalogVariant] = useState('all')
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(() => new Set())
  const submitting = useRef(false)

  const catalogSections = useMemo(() => groupVehicleCatalog(models), [models])
  const variantOptions = useMemo(() => [...new Map(catalogSections.flatMap((vehicleClass) => vehicleClass.variants.map(({ value, label }) => [value, { value, label }] as const))).values()], [catalogSections])
  const hasCatalogFilters = Boolean(catalogQuery.trim()) || catalogClass !== 'all' || catalogVariant !== 'all'
  const filteredCatalogSections = useMemo(() => {
    const query = normalizeShopCatalogText(catalogQuery.trim())
    return catalogSections
      .filter((vehicleClass) => catalogClass === 'all' || vehicleClass.value === catalogClass)
      .map((vehicleClass) => ({
        ...vehicleClass,
        variants: vehicleClass.variants
          .filter((variant) => catalogVariant === 'all' || variant.value === catalogVariant)
          .map((variant) => ({
            ...variant,
            models: variant.models.filter((model) => !query || normalizeShopCatalogText(model.nom).includes(query)),
          }))
          .filter((variant) => variant.models.length > 0),
      }))
      .filter((vehicleClass) => vehicleClass.variants.length > 0)
  }, [catalogClass, catalogQuery, catalogSections, catalogVariant])
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId)
  const salePrice = selectedVehicle ? vehicleSalePrice(selectedVehicle.modelPrice) : null
  const armedVehicle = Boolean(selectedVehicle?.weaponName)

  useEffect(() => {
    if (!vehicles.some((vehicle) => vehicle.id === vehicleId)) setVehicleId(vehicles[0]?.id ?? 0)
  }, [vehicles, vehicleId])

  function requestTransaction(request: Omit<Request, 'transactionId'>, text: string, success: string) {
    setRetryRequest(null)
    setConfirmation({ request, transactionId: crypto.randomUUID(), text, success })
  }

  async function send(current: Confirmation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await executeVehicleGarageTransaction({ ...current.request, transactionId: current.transactionId })
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

  function buy(model: VehicleModel) {
    const name = vehicleNames[model.id]?.trim() || model.nom
    const price = readShopPrice(model.prix)
    if (price === null) return
    requestTransaction(
      { action: 'buy', saleModelId: model.id, vehicleName: name },
      `Acheter ${model.nom}${name !== model.nom ? ` sous le nom « ${name} »` : ''} pour ${money(price)} ?`,
      `${name} a été acheté`,
    )
  }

  function sell() {
    if (!selectedVehicle || salePrice === null || (armedVehicle && !activeShipCanReceive)) return
    const cargoText = armedVehicle
      ? ` L’arme${selectedVehicle.magazineName ? `, ${selectedVehicle.magazineName} et ses ${selectedVehicle.ammunition} munition(s) restante(s)` : ''} sera transférée dans la soute de ${activeShipName}.`
      : ''
    requestTransaction(
      { action: 'sell', vehicleId: selectedVehicle.id },
      `Revendre ${selectedVehicle.nom} pour ${money(salePrice)} ?${cargoText}`,
      `${selectedVehicle.nom} a été vendu`,
    )
  }

  return <div className="shop-app garage-app">
    <div className="shop-wallet"><span>{character.nom} · Rang {character.rang}</span><strong>{money(character.konis)}</strong></div>
    <nav className="shop-tabs" aria-label="Opérations du Garage">
      <button type="button" className={tab === 'buy' ? 'active' : ''} onClick={() => setTab('buy')}>Acheter</button>
      <button type="button" className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>Vendre</button>
    </nav>
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={() => send(retryRequest)}>Réessayer la même opération</button>}</div>}

    {tab === 'buy' && <section className="shop-catalog-groups garage-purchase-catalog">
      <div><h2>Modèles disponibles</h2><p>Le rang requis dépend de la classe du véhicule : rang 1 pour les Légers, 3 pour les Intermédiaires, 5 pour les Poids Lourds et 7 pour les Blindés.</p></div>
      {!!models.length && <ShopCatalogFilters
        query={catalogQuery}
        onQueryChange={setCatalogQuery}
        classValue={catalogClass}
        onClassChange={setCatalogClass}
        classOptions={vehicleCatalogClasses.map(({ value, label }) => ({ value, label }))}
        typeValue={catalogVariant}
        onTypeChange={setCatalogVariant}
        typeLabel="Variante"
        allTypesLabel="Toutes les variantes"
        typeOptions={variantOptions}
        hasFilters={hasCatalogFilters}
        onReset={() => { setCatalogQuery(''); setCatalogClass('all'); setCatalogVariant('all') }}
      />}
      {!models.length && <p className="shop-empty">Aucun modèle de vente n’est disponible.</p>}
      {!!models.length && !filteredCatalogSections.length && <div className="shop-empty shop-catalog-no-results" role="status">Aucun modèle ne correspond à ces filtres. <button type="button" onClick={() => { setCatalogQuery(''); setCatalogClass('all'); setCatalogVariant('all') }}>Effacer les filtres</button></div>}
      {filteredCatalogSections.map((vehicleClass) => {
        const collapsed = !hasCatalogFilters && collapsedClasses.has(vehicleClass.value)
        const contentId = `garage-class-content-${vehicleClass.value}`
        return <section className="shipyard-class-section" key={vehicleClass.value}>
        <header className="shipyard-class-heading"><h2>{vehicleClass.label}</h2><button type="button" className="shipyard-class-toggle" aria-expanded={!collapsed} aria-controls={contentId} disabled={hasCatalogFilters} title={hasCatalogFilters ? 'Les classes avec des résultats restent ouvertes pendant le filtrage.' : undefined} onClick={() => setCollapsedClasses((current) => {
          const next = new Set(current)
          if (next.has(vehicleClass.value)) next.delete(vehicleClass.value)
          else next.add(vehicleClass.value)
          return next
        })}>{collapsed ? 'Déplier' : 'Replier'}</button></header>
        <div id={contentId} className="shipyard-class-content" hidden={collapsed}>
        {vehicleClass.variants.map((variant) => <section className="garage-variant-section" key={variant.value}>
          <h3>{variant.label}</h3>
          <div className="shipyard-model-grid">{variant.models.map((model) => {
            const price = readShopPrice(model.prix)
            const minimumRank = minimumRankForVehicleClass(model.classe)
            const locked = minimumRank !== null && character.rang < minimumRank
            return <article className={`shipyard-model-card garage-model-card${locked ? ' shipyard-model-card--locked' : ''}`} key={model.id}>
              {model.image && <img className="shipyard-model-image" src={model.image.url} alt={model.image.alt} />}
              <div className="shipyard-model-heading"><div><span className="shop-item-type">{vehicleClass.label} · {variant.label}</span><h3>{model.nom}</h3></div><strong>{priceLabel(model.prix)}{model.policyPercentage ? <small className="group-shop-price-note">Tarif escouade {model.policyPercentage > 0 ? '+' : ''}{model.policyPercentage}%</small> : null}</strong></div>
              {locked && <p className="shipyard-rank-lock">Verrouillé · Rang {minimumRank} requis pour acheter ce véhicule.</p>}
              <dl className="garage-stats">
                <div><dt>Places</dt><dd>{model.places}</dd></div>
                <div><dt>Emports d’armes</dt><dd>{model.emportsArmesPersonnages}</dd></div>
                <div><dt>Blindage</dt><dd>{model.blindageMax}</dd></div>
                <div><dt>Bouclier</dt><dd>{model.bouclierMax}</dd></div>
                <div><dt>Recharge</dt><dd>{model.rechargeBouclier}</dd></div>
                <div><dt>Mouvement</dt><dd>{model.mouvement}</dd></div>
              </dl>
              {model.options.length > 0 && <ul className="garage-options">{model.options.map((option) => <li key={option}>{option}</li>)}</ul>}
              <div className="shipyard-model-actions">
                <label className="shipyard-name-field">Nom du véhicule<input maxLength={100} value={vehicleNames[model.id] ?? ''} placeholder={model.nom} onChange={(event) => setVehicleNames((current) => ({ ...current, [model.id]: event.target.value }))} /></label>
                <button type="button" disabled={pending || locked || price === null || (vehicleNames[model.id]?.trim().length ?? 0) > 100} onClick={() => buy(model)}>Acheter</button>
              </div>
            </article>
          })}</div>
        </section>)}
        </div>
      </section>
      })}
    </section>}

    {tab === 'sell' && <section className="shop-catalog-groups garage-sale-section">
      <div><h2>Vos véhicules</h2><p>La revente crédite 25 % du prix du modèle. Un véhicule équipé d’une arme de tourelle nécessite un vaisseau actif modifiable pour récupérer l’arme et ses munitions.</p></div>
      {!vehicles.length ? <p className="shop-empty">Vous ne possédez aucun véhicule à vendre.</p> : <>
        <label className="shipyard-select">Véhicule à revendre<select value={vehicleId} onChange={(event) => setVehicleId(Number(event.target.value))}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nom} · {vehicle.modelName}</option>)}</select></label>
        {selectedVehicle && <article className="shop-item garage-owned-card">
          <div className="shop-item-main"><span className="shop-item-type">{selectedVehicle.modelName}</span><h3>{selectedVehicle.nom}</h3>
            <p>Blindage actuel : {selectedVehicle.blindageActuel} / {selectedVehicle.blindageMax}</p>
            {selectedVehicle.weaponName && <p>Arme de tourelle : {selectedVehicle.weaponName}{selectedVehicle.magazineName ? ` · ${selectedVehicle.magazineName} · ${selectedVehicle.ammunition} munition(s) restante(s)` : ''}</p>}
          </div>
          <div className="shop-item-action"><strong>{salePrice === null ? 'Non commercialisable' : money(salePrice)}</strong><span>25 % du prix du modèle</span></div>
        </article>}
        {armedVehicle && !activeShipCanReceive && <p className="shop-message error">Un vaisseau actif modifiable est nécessaire pour récupérer l’arme de tourelle.{activeShipName ? ` ${activeShipName} ne peut pas recevoir cet équipement.` : ''}</p>}
        {armedVehicle && activeShipCanReceive && <p className="garage-cargo-note">L’arme et ses munitions seront transférées dans la soute de {activeShipName}.</p>}
        <button className="shipyard-operation-button shipyard-danger-action" type="button" disabled={pending || !selectedVehicle || salePrice === null || (armedVehicle && !activeShipCanReceive)} onClick={sell}>Revendre le véhicule</button>
      </>}
    </section>}

    {confirmation && <div className="shop-confirm-overlay" role="presentation"><section className="shop-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="garage-confirm-title"><h2 id="garage-confirm-title">Confirmer l’opération</h2><p>{confirmation.text}</p><div className="shop-confirm-actions"><button type="button" onClick={() => setConfirmation(null)}>Annuler</button><button type="button" disabled={pending} onClick={confirm}>Confirmer</button></div></section></div>}
  </div>
}
