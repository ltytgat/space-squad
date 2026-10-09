'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { factionGrade } from '@/app/(frontend)/characters/session-rewards-formula'
import { performFactionRewardAction } from './faction-reward-actions'
import { factionPromotionQuote, factionRewardQuote, type FactionRewardCharacter, type FactionRewardOffer } from './faction-reward-pricing'

type Operation = { action: 'promote'; transactionId: string } | { action: 'purchase'; rewardId: number; transactionId: string; offer: FactionRewardOffer }
const formatNumber = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 20 })
const money = (value: number) => `${formatNumber.format(value)} Konis`
const usageLabel = { 'arme-sol': 'Arme Sol (hors armes lourdes)', 'arme-espace': 'Arme Espace (hors armes lourdes)', 'module-espace': 'Module Espace' } as const
const applicationLabel = { sol: 'Sol', espace: 'Espace', module: 'Module' } as const
const compareNames = (a: { nom: string }, b: { nom: string }) => a.nom.localeCompare(b.nom, 'fr', { numeric: true, sensitivity: 'base' })

function groupRewardsByType<T extends { nom: string; typeRecompense?: string | null }>(rewards: T[]) {
  return {
    coupons: rewards.filter((reward) => reward.typeRecompense === 'bon-reduction').sort(compareNames),
    others: rewards.filter((reward) => reward.typeRecompense !== 'bon-reduction').sort(compareNames),
  }
}

export function FactionRewardsClient({ character, offers }: { character: FactionRewardCharacter; offers: FactionRewardOffer[] }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Operation | null>(null)
  const [retry, setRetry] = useState<Operation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const submitting = useRef(false)
  const quote = factionPromotionQuote(character)
  const currentGradeName = character.affiliation.rangs[quote.grade - 1]?.nom ?? 'Aucun grade'
  const offerGroups = groupRewardsByType(offers)
  const inventoryGroups = groupRewardsByType(character.inventaireRecompensesFaction)

  async function send(operation: Operation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    try {
      await performFactionRewardAction(operation.action === 'promote'
        ? { action: 'promote', transactionId: operation.transactionId }
        : { action: 'purchase', transactionId: operation.transactionId, rewardId: operation.rewardId })
      setMessage({ kind: 'success', text: operation.action === 'promote' ? `Grade ${quote.nextRankName} obtenu. Vos points de faction ont été remis à zéro.` : `${operation.offer.nom} ajouté à votre inventaire.` })
      setRetry(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'L’opération a échoué.' })
      setRetry(operation)
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  function requestPromotion() {
    setConfirmation({ action: 'promote', transactionId: crypto.randomUUID() })
  }

  function requestPurchase(offer: FactionRewardOffer) {
    setConfirmation({ action: 'purchase', rewardId: offer.id, transactionId: crypto.randomUUID(), offer })
  }

  async function confirm() {
    if (!confirmation) return
    const current = confirmation
    setConfirmation(null)
    await send(current)
  }

  const costsFor = (offer: FactionRewardOffer) => [
    offer.coutPointsFaction > 0 ? `${formatNumber.format(offer.coutPointsFaction)} points de faction` : null,
  ].filter(Boolean)

  const renderOffer = (offer: FactionRewardOffer) => {
    const quoteForOffer = factionRewardQuote(offer, character)
    const costs = costsFor(offer)
    const unlocked = quote.grade >= offer.gradeRequis
    return <article className="shop-item" key={offer.id}>
      <div className="shop-item-main">
        <div className="shop-item-type">{offer.gradeName}</div>
        <h3>{offer.nom}</h3>
        <p>{offer.description}</p>
        {offer.typeRecompense === 'acces-armes-ex' && <div className="shop-item-meta">Permis d’achat des armes de rang supérieur autorisées par cette faction</div>}
        {offer.typeRecompense === 'bon-reduction' && offer.pourcentageReduction !== null && <div className="shop-item-meta">Réduction de {formatNumber.format(offer.pourcentageReduction)} % · {offer.application ? applicationLabel[offer.application] : 'Application à configurer'}</div>}
        {!unlocked && <div className="shop-item-meta">Grade {offer.gradeName} requis</div>}
      </div>
      <div className="shop-item-action">
        <strong>{costs.length ? costs.join(' · ') : 'Gratuit'}</strong>
        <button type="button" disabled={pending || !quoteForOffer.canBuy} onClick={() => requestPurchase(offer)}>Acheter</button>
        {quoteForOffer.permitAlreadyOwned && <small>Ce permis est déjà possédé et ne peut être acheté qu’une seule fois.</small>}
        {unlocked && !quoteForOffer.canBuy && !quoteForOffer.permitAlreadyOwned && <small>Solde insuffisant.</small>}
      </div>
    </article>
  }

  const renderInventoryItem = (item: (typeof character.inventaireRecompensesFaction)[number], index: number) => <article className="shop-item" key={item.id ?? `${item.nom}-${index}`}>
    <div className="shop-item-main"><div className="shop-item-type">{item.faction} · {item.grade}</div><h3>{item.nom}</h3><p>{item.effet}</p>
      {item.typeRecompense === 'acces-armes-ex' && <div className="shop-item-meta">Permis d’achat des armes de rang supérieur autorisées</div>}
      {item.typeRecompense === 'bon-reduction' && item.pourcentageReduction != null && <div className="shop-item-meta">Bon de réduction : {formatNumber.format(item.pourcentageReduction)} % · {item.usage ? usageLabel[item.usage] : 'Usage à configurer'}</div>}
    </div>
  </article>

  return <div className="shop-app faction-rewards-app">
    <div className="shop-wallet formation-wallet">
      <span>{character.nom} · {currentGradeName}</span>
      <div className="formation-wallet-balances">
        <strong>{money(character.konis)}</strong>
        <strong>{formatNumber.format(character.pointsDeFaction)} points de faction</strong>
      </div>
    </div>

    {message && <div className={`shop-message ${message.kind}`} role="status">
      {message.text}{message.kind === 'error' && retry && <button type="button" disabled={pending} onClick={() => void send(retry)}>Réessayer la même opération</button>}
    </div>}

    <section className="faction-promotion shop-item">
      <div className="shop-item-main">
        <div className="shop-item-type">Progression dans la faction</div>
        <h2>{quote.nextRankName ? `Grade suivant : ${quote.nextRankName}` : 'Grade maximal atteint'}</h2>
        {quote.nextRankName
          ? <p>Minimum requis : {formatNumber.format(quote.minimumPoints ?? 0)} points de faction. La promotion consomme tous vos points actuels ({formatNumber.format(quote.pointsToSpend)}).</p>
          : <p>Votre personnage a atteint le dernier grade disponible dans cette faction.</p>}
      </div>
      {quote.nextRankName && <div className="shop-item-action">
        <strong>Seuil : {formatNumber.format(quote.minimumPoints ?? 0)} points</strong>
        <button type="button" disabled={pending || !quote.canPromote} onClick={requestPromotion}>Monter en grade</button>
        {!quote.canPromote && <small>Il vous manque des points de faction.</small>}
      </div>}
    </section>

    <section className="shop-catalog-groups faction-reward-catalog">
      <h2>Objets de la faction</h2>
      {!offers.length && <p className="shop-empty">Aucune récompense n'est encore configurée pour cette faction.</p>}
      {!!offerGroups.coupons.length && <section className="faction-reward-category">
        <h3>Bons de réduction</h3>
        <div className="shop-grid">{offerGroups.coupons.map(renderOffer)}</div>
      </section>}
      {!!offerGroups.others.length && <section className="faction-reward-category">
        <h3>Autres récompenses</h3>
        <div className="shop-grid">{offerGroups.others.map(renderOffer)}</div>
      </section>}
    </section>

    <section className="shop-catalog-groups faction-owned-rewards">
      <h2>Vos récompenses</h2>
      {!character.inventaireRecompensesFaction.length && <p className="shop-empty">Vous n'avez pas encore acheté de récompense de faction.</p>}
      {!!inventoryGroups.coupons.length && <section className="faction-reward-category">
        <h3>Bons de réduction</h3>
        <div className="shop-grid">{inventoryGroups.coupons.map(renderInventoryItem)}</div>
      </section>}
      {!!inventoryGroups.others.length && <section className="faction-reward-category">
        <h3>Autres récompenses</h3>
        <div className="shop-grid">{inventoryGroups.others.map(renderInventoryItem)}</div>
      </section>}
    </section>

    {confirmation && <div className="shop-confirm-overlay" role="presentation" onClick={() => !pending && setConfirmation(null)}>
      <section className="shop-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="faction-confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="faction-confirm-title">Confirmer l’opération</h2>
        {confirmation.action === 'promote'
          ? <p>Obtenir le grade {quote.nextRankName} consommera tous vos points de faction : {formatNumber.format(quote.pointsToSpend)}.</p>
          : <p>Acheter {confirmation.offer.nom} pour {costsFor(confirmation.offer).join(' et ') || 'gratuitement'} ?</p>}
        <div className="shop-confirm-actions">
          <button type="button" disabled={pending} onClick={() => setConfirmation(null)}>Annuler</button>
          <button type="button" disabled={pending} onClick={() => void confirm()}>{pending ? 'Opération…' : 'Confirmer'}</button>
        </div>
      </section>
    </div>}
  </div>
}
