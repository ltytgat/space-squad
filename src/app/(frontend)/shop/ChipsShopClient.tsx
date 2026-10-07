'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { executeChipTransaction } from './chip-actions'

export type ShopChip = {
  id: number
  nom: string
  categorie: 'active' | 'passive'
  restriction: string | null
  effet: string
  cooldown: number | null
}

type ChipAction = 'buy' | 'draw' | 'recycle'
type ChipRequest = { action: ChipAction; chipId?: number; category?: 'active' | 'passive'; ownedIndex?: number }
type PendingAction = { request: ChipRequest; transactionId: string; prompt: string; success: string }

const PRICES = { active: 75_000, passive: 100_000 }
const DRAW_PRICES = { active: 30_000, passive: 50_000 }
const RECYCLE_PRICE = 10_000
const money = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(amount)} Konis`
const categoryLabel = (category: ShopChip['categorie']) => category === 'active' ? 'Active' : 'Passive'

export default function ChipsShopClient({
  character, chips, owned,
}: {
  character: { id: number; nom: string; konis: number }
  chips: ShopChip[]
  owned: { chip: ShopChip; index: number }[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<PendingAction | null>(null)
  const [retryRequest, setRetryRequest] = useState<PendingAction | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [drawnChip, setDrawnChip] = useState<ShopChip | null>(null)
  const submitting = useRef(false)

  function ask(request: ChipRequest, prompt: string, success: string) {
    setRetryRequest(null)
    setMessage(null)
    setConfirmation({ request, transactionId: crypto.randomUUID(), prompt, success })
  }

  async function run(action: PendingAction) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await executeChipTransaction({ ...action.request, transactionId: action.transactionId })
      setMessage({ kind: 'success', text: action.success })
      setRetryRequest(null)
      if (action.request.action === 'draw' && result.chip) setDrawnChip(result.chip)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'La transaction a échoué.' })
      setRetryRequest(action)
    } finally {
      setPending(false)
      submitting.current = false
    }
  }

  async function confirm() {
    if (!confirmation) return
    const selected = confirmation
    setConfirmation(null)
    await run(selected)
  }

  const activeChips = chips.filter((chip) => chip.categorie === 'active')
  const passiveChips = chips.filter((chip) => chip.categorie === 'passive')

  function chipCard(chip: ShopChip) {
    return <article className="shop-item" key={chip.id}>
      <div className="shop-item-main">
        <div className="shop-item-type">{categoryLabel(chip.categorie)}{chip.restriction ? ` · ${chip.restriction}` : ''}</div>
        <h3>{chip.nom}</h3>
        {chip.effet && <p>{chip.effet}</p>}
        {chip.categorie === 'active' && chip.cooldown !== null && <div className="shop-item-meta">Cooldown : {chip.cooldown} tour{chip.cooldown === 1 ? '' : 's'}</div>}
      </div>
      <div className="shop-item-action">
        <strong>{money(PRICES[chip.categorie])}</strong>
        <button type="button" disabled={pending} onClick={() => ask(
          { action: 'buy', chipId: chip.id },
          `Acheter ${chip.nom} pour ${money(PRICES[chip.categorie])} ?`,
          `${chip.nom} a été ajoutée à votre réserve.`,
        )}>Acheter</button>
      </div>
    </article>
  }

  return <div className="shop-app">
    <div className="shop-wallet"><span>{character.nom}</span><strong>{money(character.konis)}</strong></div>
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={() => retryRequest && run(retryRequest)}>Réessayer la même transaction</button>}</div>}

    <section className="chip-draw-panel">
      <div><h2>Tirage aléatoire</h2><p>Le coût est débité avant le tirage. La puce obtenue est ajoutée à votre réserve.</p></div>
      <div className="chip-draw-actions">
        <button type="button" disabled={pending || activeChips.length === 0} onClick={() => ask(
          { action: 'draw', category: 'active' },
          `Effectuer un tirage de puce active pour ${money(DRAW_PRICES.active)} ? Une puce active aléatoire sera ajoutée à votre réserve.`,
          'Tirage de puce active effectué.',
        )}>Tirage Active · {money(DRAW_PRICES.active)}</button>
        <button type="button" disabled={pending || passiveChips.length === 0} onClick={() => ask(
          { action: 'draw', category: 'passive' },
          `Effectuer un tirage de puce passive pour ${money(DRAW_PRICES.passive)} ? Une puce passive aléatoire sera ajoutée à votre réserve.`,
          'Tirage de puce passive effectué.',
        )}>Tirage Passive · {money(DRAW_PRICES.passive)}</button>
      </div>
    </section>

    {drawnChip && <section className="chip-draw-result" aria-live="polite">
      <div className="shop-item-type">Puce obtenue · {categoryLabel(drawnChip.categorie)}</div>
      <h2>{drawnChip.nom}</h2>
      {drawnChip.restriction && <p className="shop-item-meta">Restriction : {drawnChip.restriction}</p>}
      <p>{drawnChip.effet}</p>
      {drawnChip.categorie === 'active' && drawnChip.cooldown !== null && <p className="shop-item-meta">Cooldown : {drawnChip.cooldown} tour{drawnChip.cooldown === 1 ? '' : 's'}</p>}
    </section>}

    <div className="shop-catalog-groups chip-catalog">
      <section><h2>Puces actives</h2><div className="shop-grid">{activeChips.map(chipCard)}</div>{!activeChips.length && <p className="shop-empty">Aucune puce active dans le catalogue.</p>}</section>
      <section><h2>Puces passives</h2><div className="shop-grid">{passiveChips.map(chipCard)}</div>{!passiveChips.length && <p className="shop-empty">Aucune puce passive dans le catalogue.</p>}</section>
    </div>

    <section className="shop-catalog-groups shop-owned chip-owned">
      <h2>Mes puces · recyclage à {money(RECYCLE_PRICE)} chacune</h2>
      {!owned.length && <p className="shop-empty">Votre réserve ne contient aucune puce.</p>}
      {owned.map(({ chip, index }) => <article className="shop-inventory-item" key={`${chip.id}-${index}`}>
        <div><strong>{chip.nom}</strong><span>{categoryLabel(chip.categorie)}{chip.restriction ? ` · ${chip.restriction}` : ''}</span></div>
        <div className="shop-item-action"><strong>Recyclage : {money(RECYCLE_PRICE)}</strong><button type="button" className="shop-sell-button" disabled={pending} onClick={() => ask(
          { action: 'recycle', chipId: chip.id, ownedIndex: index },
          `Recycler ${chip.nom} contre ${money(RECYCLE_PRICE)} ? Cette puce sera retirée de votre réserve.`,
          `${chip.nom} a été recyclée. ${money(RECYCLE_PRICE)} ont été crédités.`,
        )}>Recycler</button></div>
      </article>)}
    </section>

    {confirmation && <div className="shop-confirm-backdrop" role="presentation"><section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="chip-confirm-title"><h2 id="chip-confirm-title">Confirmer la transaction</h2><p>{confirmation.prompt}</p><div><button type="button" className="shop-cancel-button" onClick={() => setConfirmation(null)}>Annuler</button><button type="button" disabled={pending} onClick={confirm}>Confirmer</button></div></section></div>}
  </div>
}
