'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { executeShopTransaction } from './actions'
import { exactAdd, exactMultiply, isWeaponModCompatible, readShopPrice, resalePrice, weaponModPrice } from '@/lib/shop'

export type ShopItem = {
  id: number
  nom: string
  prix: number | string | null
  categorie?: string | null
  famille?: string | null
  categoriePrincipale?: string | null
  sousCategorieArme?: string | null
  sousCategorieArmure?: string | null
  type?: string | null
  typeModule?: string | null
  modele?: string | null
  taille?: string | null
  degats?: string | null
  calibre?: string | null
  effet?: string | null
}
type Owned = { item: ShopItem | null; quantite?: number; mods?: ShopItem[] }
export type ShopCharacter = {
  id: number
  nom: string
  konis: number
  inventaireArmes: Owned[]
  inventaireArmures: Owned[]
  inventaireMods: ShopItem[]
  inventaire: Owned[]
  armesEquipees: { slot: 'armePrincipale' | 'armeSecondaire' | 'armeLourde' | 'armeDeMelee'; item: ShopItem | null; mods: ShopItem[] }[]
}
export type ShopShip = {
  id: number
  nom: string
  inventaireArmes: Owned[]
  inventaireModules: Owned[]
  inventaireConsommables: Owned[]
}
type Catalogs = {
  weapons: ShopItem[]; armors: ShopItem[]; consumables: ShopItem[]; mods: ShopItem[]
  shipWeapons: ShopItem[]; shipModules: ShopItem[]; shipConsumables: ShopItem[]
}
type Target = { key: string; location: 'inventory' | 'equipped'; index?: number; slot?: ShopCharacter['armesEquipees'][number]['slot']; item: ShopItem; mods: ShopItem[] }
type TransactionArgs = Parameters<typeof executeShopTransaction>[0]
type Confirmation = { args: TransactionArgs; successText: string; text: string; transactionId: string }

const currency = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`
const labelFor = (kind: string) => ({ weapon: 'Arme', armor: 'Armure', consumable: 'Consommable', 'ship-weapon': 'Arme spatiale', 'ship-module': 'Module spatial', 'ship-consumable': 'Consommable spatial', 'weapon-mod': 'Mod d’arme', 'armor-mod': 'Mod d’armure' }[kind] ?? kind)
const categoryLabel: Record<string, string> = { 'fusil-assaut': 'Fusil d’assaut', shotgun: 'Shotgun', sniper: 'Sniper', pistolet: 'Pistolet', melee: 'Mêlée', lourde: 'Arme lourde', tete: 'Tête', torse: 'Torse', bras: 'Bras', jambes: 'Jambes', backpack: 'Back-pack' }

function itemDescription(item: ShopItem) {
  return [item.categorie ? categoryLabel[item.categorie] ?? item.categorie : null, item.famille, item.type, item.modele ? `Modèle ${item.modele}` : null, item.taille ? `Taille ${item.taille}` : null, item.degats ? `Dégâts ${item.degats}` : null, item.calibre].filter(Boolean).join(' · ')
}

export function ShopClient({ character, ships, catalogs }: { character: ShopCharacter; ships: ShopShip[]; catalogs: Catalogs }) {
  const router = useRouter()
  const [section, setSection] = useState<'personal' | 'spatial' | 'mods' | 'inventory'>('personal')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [shipId, setShipId] = useState(ships[0]?.id ?? 0)
  const [targetKey, setTargetKey] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [retryRequest, setRetryRequest] = useState<Confirmation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const submitting = useRef(false)
  const ship = ships.find((value) => value.id === shipId)

  const targets = useMemo<Target[]>(() => [
    ...character.inventaireArmes.flatMap((entry, index) => entry.item ? [{ key: `inventory:${index}`, location: 'inventory' as const, index, item: entry.item, mods: entry.mods ?? [] }] : []),
    ...character.armesEquipees.flatMap((entry) => entry.item ? [{ key: `equipped:${entry.slot}`, location: 'equipped' as const, slot: entry.slot, item: entry.item, mods: entry.mods ?? [] }] : []),
  ], [character])
  const selectedTarget = targets.find((target) => target.key === targetKey)
  const ownedModIds = new Set(character.inventaireMods.map((mod) => String(mod.id)))
  const categories = useMemo(() => [...new Set([...catalogs.weapons, ...catalogs.armors, ...catalogs.consumables, ...catalogs.shipWeapons, ...catalogs.shipModules, ...catalogs.shipConsumables].map((item) => item.categorie ?? item.famille).filter(Boolean) as string[])].sort(), [catalogs])
  const matches = (item: ShopItem) => (!search || `${item.nom} ${itemDescription(item)} ${item.effet ?? ''}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) && (category === 'all' || item.categorie === category || item.famille === category)

  const quantityFor = (key: string) => quantities[key] ?? 1
  const changeQuantity = (key: string, value: number) => setQuantities((current) => ({ ...current, [key]: Number.isSafeInteger(value) && value > 0 ? value : 1 }))
  function transact(args: Omit<TransactionArgs, 'transactionId'>, successText: string, text: string) {
    setRetryRequest(null)
    setConfirmation({ args: args as TransactionArgs, successText, text, transactionId: crypto.randomUUID() })
  }

  async function sendTransaction(current: Confirmation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true); setMessage(null)
    try {
      await executeShopTransaction({ ...current.args, transactionId: current.transactionId })
      setMessage({ kind: 'success', text: current.successText })
      setRetryRequest(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'La transaction a échoué.' })
      setRetryRequest(current)
    } finally { setPending(false) }
    submitting.current = false
  }

  async function confirmTransaction() {
    if (!confirmation) return
    const current = confirmation
    setConfirmation(null)
    await sendTransaction(current)
  }

  async function retryTransaction() {
    if (retryRequest) await sendTransaction(retryRequest)
  }

  const priceText = (item: ShopItem) => {
    const price = readShopPrice(item.prix)
    return price === null ? 'Non commercialisable' : currency(price)
  }
  const amountText = (item: ShopItem) => {
    const price = readShopPrice(item.prix)
    return price === null ? null : currency(resalePrice(price))
  }

  function quantityControl(key: string) {
    return <label className="shop-quantity">Qté <input type="number" min={1} step={1} value={quantityFor(key)} onChange={(event) => changeQuantity(key, Number(event.target.value))} /></label>
  }

  function card(item: ShopItem, kind: Parameters<typeof executeShopTransaction>[0]['kind'], owner: 'personal' | 'ship') {
    const price = readShopPrice(item.prix)
    const key = `${kind}:${item.id}`
    const hasQuantity = ['consumable', 'ship-weapon', 'ship-module', 'ship-consumable'].includes(kind)
    return <article className="shop-item" key={key}>
      <div className="shop-item-main"><div className="shop-item-type">{labelFor(kind)}</div><h3>{item.nom}</h3>
        {itemDescription(item) && <div className="shop-item-meta">{itemDescription(item)}</div>}
        {item.effet && <p>{item.effet}</p>}
      </div>
      <div className="shop-item-action"><strong>{priceText(item)}</strong>
        {hasQuantity && quantityControl(key)}
        <button type="button" disabled={pending || price === null || (owner === 'ship' && !ship)} onClick={() => transact({ action: 'buy', kind, itemId: item.id, quantity: hasQuantity ? quantityFor(key) : 1, ...(owner === 'ship' ? { shipId } : {}) }, `${item.nom} ajouté${quantityFor(key) > 1 ? ` (${quantityFor(key)})` : ''} à la réserve.`, `Acheter ${item.nom} pour ${currency(exactMultiply(price!, hasQuantity ? quantityFor(key) : 1))} ?`)}>Acheter</button>
      </div>
    </article>
  }

  function inventoryCard(entry: Owned, kind: 'weapon' | 'armor' | 'consumable' | 'ship-weapon' | 'ship-module' | 'ship-consumable', index: number, owner: 'personal' | 'ship') {
    const item = entry.item
    if (!item) return null
    const amount = readShopPrice(item.prix)
    const key = `sell:${kind}:${item.id}:${index}`
    const stack = ['consumable', 'ship-weapon', 'ship-module', 'ship-consumable'].includes(kind)
    const resale = amount === null ? null : exactMultiply(resalePrice(amount), stack ? quantityFor(key) : 1)
    const mods = entry.mods ?? []
    let resaleTotal = amount
    if (kind === 'weapon' && mods.length === 1 && resaleTotal !== null) {
      const factor = readShopPrice(mods[0].prix)
      resaleTotal = factor === null ? null : exactAdd(resaleTotal, weaponModPrice(resaleTotal, factor))
    }
    const saleAmount = kind === 'weapon' && (mods.length > 1 || resaleTotal === null) ? null : kind === 'weapon' ? resalePrice(resaleTotal!) : resale
    return <article className="shop-inventory-item" key={key}>
      <div><strong>{item.nom}</strong><span>{labelFor(kind)}{stack ? ` · ${entry.quantite ?? 0} possédé(s)` : ''}{mods.length ? ` · Mod : ${mods.map((mod) => mod.nom).join(', ')}` : ''}</span></div>
      <div className="shop-item-action">{stack && quantityControl(key)}<strong>{saleAmount === null ? 'Non vendable' : `Revente : ${currency(saleAmount)}`}</strong>
        <button type="button" className="shop-sell-button" disabled={pending || saleAmount === null || (stack && quantityFor(key) > (entry.quantite ?? 0))} onClick={() => transact({ action: 'sell', kind, itemId: item.id, quantity: stack ? quantityFor(key) : 1, ...(owner === 'ship' ? { shipId, ownedIndex: undefined } : { ownedIndex: index }) }, `${item.nom} vendu${stack ? ` (${quantityFor(key)})` : ''}.`, `Vendre ${item.nom} pour ${currency(saleAmount!)} ?${kind === 'armor' && mods.length ? ' Les Mods retourneront dans votre réserve.' : ''}`)}>Vendre</button>
      </div>
    </article>
  }

  const nav = [
    ['personal', 'Équipement personnel'], ['spatial', 'Équipement spatial'], ['mods', 'Mods'], ['inventory', 'Mes réserves'],
  ] as const

  return <div className="shop-app">
    <div className="shop-wallet"><span>{character.nom}</span><strong>{currency(character.konis)}</strong></div>
    <nav className="shop-tabs" aria-label="Espaces de la boutique">{nav.map(([value, label]) => <button key={value} type="button" className={section === value ? 'active' : ''} onClick={() => { setSection(value); setCategory('all') }}>{label}</button>)}</nav>
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={retryTransaction}>Réessayer la même transaction</button>}</div>}

    {section !== 'inventory' && <div className="shop-filters">
      <label>Rechercher <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, catégorie, effet…" /></label>
      <label>Catégorie <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Toutes</option>{categories.map((value) => <option key={value} value={value}>{categoryLabel[value] ?? value}</option>)}</select></label>
      {section === 'spatial' && <label>Vaisseau <select value={shipId} onChange={(event) => setShipId(Number(event.target.value))}>{ships.map((value) => <option key={value.id} value={value.id}>{value.nom}</option>)}</select></label>}
    </div>}

    {section === 'personal' && <div className="shop-catalog-groups">
      <section><h2>Armes</h2><div className="shop-grid">{catalogs.weapons.filter(matches).map((item) => card(item, 'weapon', 'personal'))}</div></section>
      <section><h2>Armures</h2><div className="shop-grid">{catalogs.armors.filter(matches).map((item) => card(item, 'armor', 'personal'))}</div></section>
      <section><h2>Consommables</h2><div className="shop-grid">{catalogs.consumables.filter(matches).map((item) => card(item, 'consumable', 'personal'))}</div></section>
    </div>}

    {section === 'spatial' && <div className="shop-catalog-groups">
      {!ship && <p className="shop-empty">Aucun vaisseau modifiable n’est disponible pour votre personnage.</p>}
      <section><h2>Armes de vaisseau</h2><div className="shop-grid">{catalogs.shipWeapons.filter(matches).map((item) => card(item, 'ship-weapon', 'ship'))}</div></section>
      <section><h2>Modules de vaisseau</h2><div className="shop-grid">{catalogs.shipModules.filter(matches).map((item) => card(item, 'ship-module', 'ship'))}</div></section>
      <section><h2>Consommables de vaisseau</h2><div className="shop-grid">{catalogs.shipConsumables.filter(matches).map((item) => card(item, 'ship-consumable', 'ship'))}</div></section>
    </div>}

    {section === 'mods' && <div className="shop-catalog-groups">
      <section className="shop-mod-flow"><h2>Mods d’arme</h2><p>Choisissez une arme possédée, équipée ou en réserve. Un seul Mod peut être appliqué à une arme et il devient permanent.</p>
        <label>Arme cible <select value={targetKey} onChange={(event) => setTargetKey(event.target.value)}><option value="">Sélectionner une arme…</option>{targets.filter((target) => readShopPrice(target.item.prix) !== null && target.mods.length === 0).map((target) => <option key={target.key} value={target.key}>{target.item.nom}{target.location === 'equipped' ? ' · équipée' : ' · réserve'}</option>)}</select></label>
        {!selectedTarget && <p className="shop-empty">Sélectionnez une arme compatible, en réserve ou équipée, pour afficher les Mods disponibles.</p>}
        <div className="shop-grid">{selectedTarget && catalogs.mods.filter((item) => item.categoriePrincipale === 'armes' && isWeaponModCompatible({ categorie: selectedTarget.item.categorie ?? undefined }, { categoriePrincipale: item.categoriePrincipale ?? undefined, sousCategorieArme: item.sousCategorieArme ?? undefined }) && matches(item)).map((item) => {
          const factor = readShopPrice(item.prix)
          const owned = ownedModIds.has(String(item.id))
          const total = selectedTarget && factor !== null ? weaponModPrice(readShopPrice(selectedTarget.item.prix) ?? 0, factor) : null
          return <article className="shop-item" key={`weapon-mod-${item.id}`}><div className="shop-item-main"><div className="shop-item-type">Mod d’arme compatible</div><h3>{item.nom}</h3><div className="shop-item-meta">{item.sousCategorieArme ?? 'Compatibilité à vérifier'}</div>{item.effet && <p>{item.effet}</p>}</div><div className="shop-item-action"><strong>{factor === null ? 'Non commercialisable' : `${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 }).format(factor)} du prix de l’arme`}</strong>{total !== null && <span>Coût sur cette arme : {currency(owned ? 0 : total)}</span>}<button type="button" disabled={pending || factor === null || !selectedTarget} onClick={() => selectedTarget && transact({ action: 'apply-weapon-mod', kind: 'weapon-mod', itemId: item.id, weaponTarget: { location: selectedTarget.location, index: selectedTarget.index, slot: selectedTarget.slot } }, `${item.nom} appliqué à ${selectedTarget.item.nom}.`, `${owned ? 'Appliquer' : `Acheter et appliquer`} ${item.nom} sur ${selectedTarget.item.nom} pour ${currency(owned ? 0 : total ?? 0)} ? Cette association sera permanente et ne pourra être ni retirée ni remplacée.`)}>{owned ? 'Appliquer le Mod possédé' : 'Acheter et appliquer'}</button></div></article>
        })}</div>
      </section>
      <section><h2>Mods d’armure</h2><p>Les Mods d’armure achetés vont dans votre réserve et peuvent être vendus séparément.</p><div className="shop-grid">{catalogs.mods.filter((item) => item.categoriePrincipale === 'armures' && matches(item)).map((item) => card(item, 'armor-mod', 'personal'))}</div></section>
    </div>}

    {section === 'inventory' && <div className="shop-catalog-groups shop-owned">
      <section><h2>Armes en réserve</h2>{character.inventaireArmes.map((entry, index) => inventoryCard(entry, 'weapon', index, 'personal'))}</section>
      <section><h2>Armures en réserve</h2>{character.inventaireArmures.map((entry, index) => inventoryCard(entry, 'armor', index, 'personal'))}</section>
      <section><h2>Consommables personnels</h2>{character.inventaire.map((entry, index) => inventoryCard(entry, 'consumable', index, 'personal'))}</section>
      <section><h2>Mods d’arme en réserve</h2>{character.inventaireMods.filter((item) => item.categoriePrincipale === 'armes').map((item, index) => <article className="shop-inventory-item" key={`owned-weapon-mod-${item.id}-${index}`}><div><strong>{item.nom}</strong><span>À appliquer depuis l’onglet Mods · pas de vente séparée</span></div></article>)}</section>
      <section><h2>Mods d’armure en réserve</h2>{character.inventaireMods.filter((item) => item.categoriePrincipale === 'armures').map((item, index) => <article className="shop-inventory-item" key={`owned-mod-${item.id}-${index}`}><div><strong>{item.nom}</strong><span>Mod d’armure</span></div><div className="shop-item-action"><strong>{amountText(item) ? `Revente : ${amountText(item)}` : 'Non vendable'}</strong><button type="button" className="shop-sell-button" disabled={pending || readShopPrice(item.prix) === null} onClick={() => transact({ action: 'sell', kind: 'armor-mod', itemId: item.id }, `${item.nom} vendu.`, `Vendre ${item.nom} pour ${amountText(item)} ?`)}>Vendre</button></div></article>)}</section>
      {ship && <><section><h2>{ship.nom} · Armes en réserve</h2>{ship.inventaireArmes.map((entry, index) => inventoryCard(entry, 'ship-weapon', index, 'ship'))}</section><section><h2>{ship.nom} · Modules en réserve</h2>{ship.inventaireModules.map((entry, index) => inventoryCard(entry, 'ship-module', index, 'ship'))}</section><section><h2>{ship.nom} · Consommables en réserve</h2>{ship.inventaireConsommables.map((entry, index) => inventoryCard(entry, 'ship-consumable', index, 'ship'))}</section></>}
      {!character.inventaireArmes.length && !character.inventaireArmures.length && !character.inventaire.length && !character.inventaireMods.length && !ship && <p className="shop-empty">Vos réserves sont vides.</p>}
    </div>}
    {confirmation && <div className="shop-confirm-backdrop" role="presentation"><section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="shop-confirm-title"><h2 id="shop-confirm-title">Confirmer la transaction</h2><p>{confirmation.text}</p><div><button type="button" className="shop-cancel-button" onClick={() => setConfirmation(null)}>Annuler</button><button type="button" disabled={pending} onClick={confirmTransaction}>Confirmer</button></div></section></div>}
  </div>
}
