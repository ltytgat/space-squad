'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { executeShopTransaction } from './actions'
import type { ShopScope } from './shop-sections'
import { exactAdd, exactMultiply, exactSubtract, isWeaponModCompatible, readShopPrice, resalePrice, weaponModPrice } from '@/lib/shop'
import { factionCanBuyExWeapon, factionKey, isFactionDiscountCouponApplicable, type DiscountTarget, type FactionRewardUsage, type OwnedFactionReward } from '@/lib/factionRewards'

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
  types?: string[]
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
  factionName: string
  inventaireRecompensesFaction: OwnedFactionReward[]
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
const weaponModCategoryLabel: Record<string, string> = { toutes: 'Toutes les armes', 'fusils-pistolets': 'Fusils et pistolets', shotgun: 'Shotgun', snipers: 'Snipers', melee: 'Mêlée / corps à corps' }
const armorModCategoryLabel: Record<string, string> = { toutes: 'Toutes les armures', tete: 'Tête', torse: 'Torse', bras: 'Bras', jambes: 'Jambes', backpack: 'Back-pack' }
const shipTypeLabel: Record<string, string> = { thermique: 'Thermique', cinetique: 'Cinétique', explosif: 'Explosif', blindage: 'Autre' }
const shipClassLabel: Record<string, string> = { '1': 'Alpha', '2': 'Beta', '3': 'Gamma', '4': 'Delta' }
const damageTypeChoices: [string, string][] = [['thermique', 'Thermique'], ['cinetique', 'Cinétique'], ['plasma', 'Plasma'], ['explosif', 'Explosif']]
const damageTypeLabels: Record<string, string> = { cinetique: 'Cinétique', thermique: 'Thermique', explosif: 'Explosif', plasma: 'Plasma' }

const sectionForScope: Record<Exclude<ShopScope, 'tout'>, 'personal' | 'spatial' | 'mods'> = {
  'sol-armes': 'personal', 'sol-armures': 'personal', 'sol-consommables': 'personal',
  'sol-puces': 'personal',
  'espace-armes': 'spatial', 'espace-modules': 'spatial', 'espace-consommables': 'spatial',
  'mods-armes': 'mods', 'mods-armures': 'mods',
}

function itemDescription(item: ShopItem) {
  return [item.categorie ? categoryLabel[item.categorie] ?? item.categorie : null, item.famille, item.type, item.modele ? `Modèle ${item.modele}` : null, item.taille ? `Taille ${item.taille}` : null, item.degats ? `Dégâts ${item.degats}` : null, item.calibre].filter(Boolean).join(' · ')
}

function weaponDamageBadges(item: ShopItem) {
  const types = [...new Set(item.types ?? (item.type ? item.type.split(',').map((type) => type.trim()) : []))]
    .filter((type) => type in damageTypeLabels)
  if (!types.length) return null
  return <div className="shop-damage-badges" aria-label="Types de dégâts">
    {types.map((type) => <span className={`shop-damage-badge shop-damage-badge-${type}`} key={type}>{damageTypeLabels[type]}</span>)}
  </div>
}

export function ShopClient({ character, ships, catalogs, scope = 'tout' }: { character: ShopCharacter; ships: ShopShip[]; catalogs: Catalogs; scope?: ShopScope }) {
  const router = useRouter()
  const [section, setSection] = useState<'personal' | 'spatial' | 'mods' | 'inventory'>('personal')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [facet, setFacet] = useState('all')
  const [damageType, setDamageType] = useState('all')
  const [shipType, setShipType] = useState('all')
  const [shipClass, setShipClass] = useState('all')
  const [shipId, setShipId] = useState(ships[0]?.id ?? 0)
  const [targetKey, setTargetKey] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [couponSelections, setCouponSelections] = useState<Record<string, string | null>>({})
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
  const isAll = scope === 'tout'
  const activeSection = isAll ? section : sectionForScope[scope]
  const availableDamageTypeChoices = activeSection === 'spatial' ? damageTypeChoices.filter(([value]) => value !== 'plasma') : damageTypeChoices
  const availableWeapons = useMemo(() => catalogs.weapons.filter((item) => factionCanBuyExWeapon(item.nom, item.categorie, item.type, character.inventaireRecompensesFaction, character.factionName)), [catalogs.weapons, character.inventaireRecompensesFaction, character.factionName])
  const categories = useMemo(() => [...new Set([...availableWeapons, ...catalogs.armors, ...catalogs.consumables, ...catalogs.shipWeapons, ...catalogs.shipModules, ...catalogs.shipConsumables].map((item) => item.categorie ?? item.famille).filter(Boolean) as string[])].sort(), [availableWeapons, catalogs])
  const facetField: 'categorie' | 'sousCategorieArme' | 'sousCategorieArmure' | 'typeModule' | null = scope === 'sol-armes' || scope === 'sol-armures' ? 'categorie' : scope === 'mods-armes' ? 'sousCategorieArme' : scope === 'mods-armures' ? 'sousCategorieArmure' : scope === 'espace-modules' ? 'typeModule' : null
  const facetChoices: [string, string][] = scope === 'sol-armes'
    ? [['fusil-assaut', 'Fusil d’assaut'], ['shotgun', 'Shotgun'], ['sniper', 'Sniper'], ['pistolet', 'Pistolet'], ['melee', 'Mêlée'], ['lourde', 'Arme lourde']]
    : scope === 'sol-armures'
      ? [['tete', 'Tête'], ['torse', 'Torse'], ['bras', 'Bras'], ['jambes', 'Jambes'], ['backpack', 'Back-pack']]
      : scope === 'mods-armes'
        ? Object.entries(weaponModCategoryLabel)
        : scope === 'mods-armures'
          ? Object.entries(armorModCategoryLabel)
          : scope === 'espace-modules'
            ? [['base', 'Principal'], ['supplementaire', 'Optionnel'], ['tourelle', 'Tourelle']]
            : []
  const matches = (item: ShopItem, filterDamageType = false) => {
    const textMatches = !search || `${item.nom} ${itemDescription(item)} ${item.effet ?? ''}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))
    const damageTypeMatches = !filterDamageType || damageType === 'all' || (item.types ?? (item.type ? [item.type] : [])).includes(damageType)
    if (isAll) return textMatches && damageTypeMatches && (category === 'all' || item.categorie === category || item.famille === category)
    const facetMatches = !facetField || facet === 'all' || item[facetField] === facet || ((scope === 'mods-armes' || scope === 'mods-armures') && facet === 'toutes' && item[facetField] === 'toutes')
    const typeMatches = scope !== 'espace-armes' || shipType === 'all' || item.type === shipType
    const classMatches = scope !== 'espace-armes' || shipClass === 'all' || item.taille === shipClass
    return textMatches && facetMatches && typeMatches && classMatches && damageTypeMatches
  }
  const matchingOwned = (entries: Owned[], filterDamageType = false) => entries.flatMap((entry, index) => entry.item && matches(entry.item, filterDamageType) ? [{ entry, index }] : [])

  function couponsFor(kind: string, item: ShopItem) {
    if (kind !== 'weapon' && kind !== 'ship-weapon' && kind !== 'ship-module') return []
    const target: DiscountTarget = { kind, categorie: item.categorie, taille: item.taille } as DiscountTarget
    return character.inventaireRecompensesFaction.flatMap((coupon) => coupon.id && isFactionDiscountCouponApplicable(coupon, character.factionName, target) ? [{ coupon }] : [])
  }

  const couponShelfUsages: FactionRewardUsage[] = activeSection === 'personal'
    ? (isAll || scope === 'sol-armes') ? ['arme-sol'] : []
    : activeSection === 'spatial'
      ? scope === 'espace-armes' ? ['arme-espace'] : scope === 'espace-modules' ? ['module-espace']
        : isAll ? ['arme-espace', 'module-espace'] : []
      : []
  const shelfCoupons = character.inventaireRecompensesFaction.filter((coupon) => coupon.typeRecompense === 'bon-reduction' && coupon.usage && couponShelfUsages.includes(coupon.usage) && factionKey(coupon.faction) === factionKey(character.factionName) && Number(coupon.pourcentageReduction) > 0 && Number(coupon.pourcentageReduction) <= 100)

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
      if (current.args.discountRewardId !== undefined) setCouponSelections({})
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
    const coupons = couponsFor(kind, item)
    const selectedCouponId = couponSelections[key] ?? null
    const selectedCoupon = coupons.find(({ coupon }) => coupon.id === selectedCouponId)?.coupon
    const quantity = hasQuantity ? quantityFor(key) : 1
    const originalTotal = price === null ? null : exactMultiply(price, quantity)
    const discountAmount = originalTotal !== null && selectedCoupon ? exactMultiply(originalTotal, Number(selectedCoupon.pourcentageReduction) / 100) : 0
    const finalTotal = originalTotal === null ? null : exactSubtract(originalTotal, discountAmount)
    return <article className="shop-item" key={key}>
      <div className="shop-item-main"><div className="shop-item-type">{labelFor(kind)}</div><h3>{item.nom}</h3>
        {itemDescription(item) && <div className="shop-item-meta">{itemDescription(item)}</div>}
        {(kind === 'weapon' || kind === 'ship-weapon') && weaponDamageBadges(item)}
        {item.effet && <p>{item.effet}</p>}
      </div>
      <div className="shop-item-action"><strong>{finalTotal === null ? priceText(item) : selectedCoupon ? `${currency(finalTotal)} (au lieu de ${currency(originalTotal!)})` : currency(finalTotal)}</strong>
        {hasQuantity && quantityControl(key)}
        {coupons.length > 0 && <label><select className="shop-discount-select" aria-label={`Réduction pour ${item.nom}`} value={selectedCouponId ?? ''} onChange={(event) => setCouponSelections((current) => ({ ...current, [key]: event.target.value || null }))}><option value="">Sans réduction</option>{coupons.map(({ coupon }) => <option key={coupon.id} value={coupon.id}>{coupon.nom} · {coupon.pourcentageReduction} %</option>)}</select></label>}
        <button type="button" disabled={pending || price === null || (owner === 'ship' && !ship)} onClick={() => transact({ action: 'buy', kind, itemId: item.id, quantity, ...(selectedCoupon?.id ? { discountRewardId: selectedCoupon.id } : {}), ...(owner === 'ship' ? { shipId } : {}) }, `${item.nom} ajouté${quantity > 1 ? ` (${quantity})` : ''} à la réserve${selectedCoupon ? ` avec ${selectedCoupon.nom}` : ''}.`, `Acheter ${item.nom} pour ${currency(finalTotal!)}${selectedCoupon ? ` avec le bon ${selectedCoupon.nom} (${selectedCoupon.pourcentageReduction} %)` : ''} ?`)}>Acheter</button>
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
      <div><strong>{item.nom}</strong><span>{labelFor(kind)}{stack ? ` · ${entry.quantite ?? 0} possédé(s)` : ''}{mods.length ? ` · Mod : ${mods.map((mod) => mod.nom).join(', ')}` : ''}</span>{(kind === 'weapon' || kind === 'ship-weapon') && weaponDamageBadges(item)}</div>
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
    {isAll && <nav className="shop-tabs" aria-label="Espaces de la boutique">{nav.map(([value, label]) => <button key={value} type="button" className={section === value ? 'active' : ''} onClick={() => { setSection(value); setCategory('all'); setDamageType('all') }}>{label}</button>)}</nav>}
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={retryTransaction}>Réessayer la même transaction</button>}</div>}

    {activeSection !== 'inventory' && <div className="shop-filters">
      <label>Rechercher <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, catégorie, effet…" /></label>
      {isAll && <label>Catégorie <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Toutes</option>{categories.map((value) => <option key={value} value={value}>{categoryLabel[value] ?? value}</option>)}</select></label>}
      {!isAll && facetField && <label>{scope === 'mods-armes' ? 'Type d’arme compatible' : scope === 'mods-armures' ? 'Type d’armure compatible' : scope === 'espace-modules' ? 'Type de module' : 'Type'} <select value={facet} onChange={(event) => setFacet(event.target.value)}><option value="all">Tous</option>{facetChoices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {scope === 'espace-armes' && <><label>Type d’arme <select value={shipType} onChange={(event) => setShipType(event.target.value)}><option value="all">Tous</option>{Object.entries(shipTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Classe de vaisseau <select value={shipClass} onChange={(event) => setShipClass(event.target.value)}><option value="all">Toutes</option>{Object.entries(shipClassLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></>}
      {(scope === 'sol-armes' || scope === 'espace-armes' || (isAll && (activeSection === 'personal' || activeSection === 'spatial'))) && <label>Type de dégâts <select value={damageType} onChange={(event) => setDamageType(event.target.value)}><option value="all">Tous</option>{availableDamageTypeChoices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {activeSection === 'spatial' && <label>Vaisseau <select value={shipId} onChange={(event) => setShipId(Number(event.target.value))}>{ships.map((value) => <option key={value.id} value={value.id}>{value.nom}</option>)}</select></label>}
    </div>}

    {!!shelfCoupons.length && <section className="shop-catalog-groups shop-coupon-shelf">
      <h2>Bons de réduction utilisables dans cette section</h2>
      <div className="shop-grid">{shelfCoupons.map((coupon, index) => <article className="shop-item" key={`${coupon.nom}-${index}`}>
        <div className="shop-item-main"><h3>{coupon.nom}</h3><p>{coupon.effet}</p><div className="shop-item-meta">{coupon.pourcentageReduction} % · {coupon.usage === 'arme-sol' ? 'Armes Sol hors armes lourdes' : coupon.usage === 'arme-espace' ? 'Armes Espace hors armes lourdes' : 'Modules Espace'}</div></div>
      </article>)}</div>
    </section>}

    {activeSection === 'personal' && <div className="shop-catalog-groups">
      {(isAll || scope === 'sol-armes') && <section><h2>Armes</h2><div className="shop-grid">{availableWeapons.filter((item) => matches(item, true)).map((item) => card(item, 'weapon', 'personal'))}</div></section>}
      {(isAll || scope === 'sol-armures') && <section><h2>Armures</h2><div className="shop-grid">{catalogs.armors.filter(matches).map((item) => card(item, 'armor', 'personal'))}</div></section>}
      {(isAll || scope === 'sol-consommables') && <section><h2>Consommables</h2><div className="shop-grid">{catalogs.consumables.filter(matches).map((item) => card(item, 'consumable', 'personal'))}</div></section>}
    </div>}

    {activeSection === 'spatial' && <div className="shop-catalog-groups">
      {!ship && <p className="shop-empty">Aucun vaisseau modifiable n’est disponible pour votre personnage.</p>}
      {(isAll || scope === 'espace-armes') && <section><h2>Armes de vaisseau</h2><div className="shop-grid">{catalogs.shipWeapons.filter((item) => matches(item, true)).map((item) => card(item, 'ship-weapon', 'ship'))}</div></section>}
      {(isAll || scope === 'espace-modules') && <section><h2>Modules de vaisseau</h2><div className="shop-grid">{catalogs.shipModules.filter(matches).map((item) => card(item, 'ship-module', 'ship'))}</div></section>}
      {(isAll || scope === 'espace-consommables') && <section><h2>Consommables de vaisseau</h2><div className="shop-grid">{catalogs.shipConsumables.filter(matches).map((item) => card(item, 'ship-consumable', 'ship'))}</div></section>}
    </div>}

    {activeSection === 'mods' && <div className="shop-catalog-groups">
      {(isAll || scope === 'mods-armes') && <section className="shop-mod-flow"><h2>Mods d’arme</h2><p>Choisissez une arme possédée, équipée ou en réserve. Un seul Mod peut être appliqué à une arme et il devient permanent.</p>
        <label>Arme cible <select value={targetKey} onChange={(event) => setTargetKey(event.target.value)}><option value="">Sélectionner une arme…</option>{targets.filter((target) => readShopPrice(target.item.prix) !== null && target.mods.length === 0).map((target) => <option key={target.key} value={target.key}>{target.item.nom}{target.location === 'equipped' ? ' · équipée' : ' · réserve'}</option>)}</select></label>
        {!selectedTarget && <p className="shop-empty">Sélectionnez une arme compatible, en réserve ou équipée, pour afficher les Mods disponibles.</p>}
        <div className="shop-grid">{selectedTarget && catalogs.mods.filter((item) => item.categoriePrincipale === 'armes' && isWeaponModCompatible({ categorie: selectedTarget.item.categorie ?? undefined }, { categoriePrincipale: item.categoriePrincipale ?? undefined, sousCategorieArme: item.sousCategorieArme ?? undefined }) && matches(item)).map((item) => {
          const factor = readShopPrice(item.prix)
          const owned = ownedModIds.has(String(item.id))
          const total = selectedTarget && factor !== null ? weaponModPrice(readShopPrice(selectedTarget.item.prix) ?? 0, factor) : null
          return <article className="shop-item" key={`weapon-mod-${item.id}`}><div className="shop-item-main"><div className="shop-item-type">Mod d’arme compatible</div><h3>{item.nom}</h3><div className="shop-item-meta">{item.sousCategorieArme ?? 'Compatibilité à vérifier'}</div>{item.effet && <p>{item.effet}</p>}</div><div className="shop-item-action"><strong>{factor === null ? 'Non commercialisable' : `${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 }).format(factor)} du prix de l’arme`}</strong>{total !== null && <span>Coût sur cette arme : {currency(owned ? 0 : total)}</span>}<button type="button" disabled={pending || factor === null || !selectedTarget} onClick={() => selectedTarget && transact({ action: 'apply-weapon-mod', kind: 'weapon-mod', itemId: item.id, weaponTarget: { location: selectedTarget.location, index: selectedTarget.index, slot: selectedTarget.slot } }, `${item.nom} appliqué à ${selectedTarget.item.nom}.`, `${owned ? 'Appliquer' : `Acheter et appliquer`} ${item.nom} sur ${selectedTarget.item.nom} pour ${currency(owned ? 0 : total ?? 0)} ? Cette association sera permanente et ne pourra être ni retirée ni remplacée.`)}>{owned ? 'Appliquer le Mod possédé' : 'Acheter et appliquer'}</button></div></article>
        })}</div>
      </section>}
      {(isAll || scope === 'mods-armures') && <section><h2>Mods d’armure</h2><p>Les Mods d’armure achetés vont dans votre réserve et peuvent être vendus séparément.</p><div className="shop-grid">{catalogs.mods.filter((item) => item.categoriePrincipale === 'armures' && matches(item)).map((item) => card(item, 'armor-mod', 'personal'))}</div></section>}
    </div>}

    {!isAll && <div className="shop-catalog-groups shop-owned shop-section-owned">
      <h2>Votre réserve</h2>
      {scope === 'sol-armes' && <section><h3>Armes en réserve</h3>{matchingOwned(character.inventaireArmes, true).map(({ entry, index }) => inventoryCard(entry, 'weapon', index, 'personal'))}{!character.inventaireArmes.some((entry) => entry.item && matches(entry.item, true)) && <p className="shop-empty">Aucune arme correspondante dans votre réserve.</p>}</section>}
      {scope === 'sol-armures' && <section><h3>Armures en réserve</h3>{matchingOwned(character.inventaireArmures).map(({ entry, index }) => inventoryCard(entry, 'armor', index, 'personal'))}{!character.inventaireArmures.some((entry) => entry.item && matches(entry.item)) && <p className="shop-empty">Aucune armure correspondante dans votre réserve.</p>}</section>}
      {scope === 'sol-consommables' && <section><h3>Consommables personnels</h3>{matchingOwned(character.inventaire).map(({ entry, index }) => inventoryCard(entry, 'consumable', index, 'personal'))}{!character.inventaire.some((entry) => entry.item && matches(entry.item)) && <p className="shop-empty">Aucun consommable correspondant dans votre réserve.</p>}</section>}
      {scope === 'espace-armes' && <section><h3>{ship?.nom ?? 'Vaisseau'} · Armes en réserve</h3>{ship && matchingOwned(ship.inventaireArmes, true).map(({ entry, index }) => inventoryCard(entry, 'ship-weapon', index, 'ship'))}{!ship?.inventaireArmes.some((entry) => entry.item && matches(entry.item, true)) && <p className="shop-empty">Aucune arme correspondante dans la réserve du vaisseau.</p>}</section>}
      {scope === 'espace-modules' && <section><h3>{ship?.nom ?? 'Vaisseau'} · Modules en réserve</h3>{ship && matchingOwned(ship.inventaireModules).map(({ entry, index }) => inventoryCard(entry, 'ship-module', index, 'ship'))}{!ship?.inventaireModules.some((entry) => entry.item && matches(entry.item)) && <p className="shop-empty">Aucun module correspondant dans la réserve du vaisseau.</p>}</section>}
      {scope === 'espace-consommables' && <section><h3>{ship?.nom ?? 'Vaisseau'} · Consommables en réserve</h3>{ship && matchingOwned(ship.inventaireConsommables).map(({ entry, index }) => inventoryCard(entry, 'ship-consumable', index, 'ship'))}{!ship?.inventaireConsommables.some((entry) => entry.item && matches(entry.item)) && <p className="shop-empty">Aucun consommable correspondant dans la réserve du vaisseau.</p>}</section>}
      {scope === 'mods-armes' && <section><h3>Mods d’arme en réserve</h3>{character.inventaireMods.filter((item) => item.categoriePrincipale === 'armes' && matches(item)).map((item, index) => <article className="shop-inventory-item" key={`owned-weapon-mod-${item.id}-${index}`}><div><strong>{item.nom}</strong><span>À appliquer sur une arme compatible · pas de vente séparée</span></div></article>)}{!character.inventaireMods.some((item) => item.categoriePrincipale === 'armes' && matches(item)) && <p className="shop-empty">Aucun Mod d’arme correspondant dans votre réserve.</p>}</section>}
      {scope === 'mods-armures' && <section><h3>Mods d’armure en réserve</h3>{character.inventaireMods.filter((item) => item.categoriePrincipale === 'armures' && matches(item)).map((item, index) => <article className="shop-inventory-item" key={`owned-armor-mod-${item.id}-${index}`}><div><strong>{item.nom}</strong><span>Mod d’armure</span></div><div className="shop-item-action"><strong>{amountText(item) ? `Revente : ${amountText(item)}` : 'Non vendable'}</strong><button type="button" className="shop-sell-button" disabled={pending || readShopPrice(item.prix) === null} onClick={() => transact({ action: 'sell', kind: 'armor-mod', itemId: item.id }, `${item.nom} vendu.`, `Vendre ${item.nom} pour ${amountText(item)} ?`)}>Vendre</button></div></article>)}{!character.inventaireMods.some((item) => item.categoriePrincipale === 'armures' && matches(item)) && <p className="shop-empty">Aucun Mod d’armure correspondant dans votre réserve.</p>}</section>}
    </div>}

    {activeSection === 'inventory' && <div className="shop-catalog-groups shop-owned">
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
