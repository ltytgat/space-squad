'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { computeRank } from '@/lib/rankSystem'
import { purchaseFormation } from './formation-actions'
import { formationQuote, type FormationCharacterState, type FormationOffer } from './formation-pricing'
import { purchaseSpecialRole } from './special-role-actions'
import { specialRoleQuote, type SpecialRoleOffer } from './special-role-pricing'

type Character = FormationCharacterState & { id: number; nom: string }
type Confirmation = { formation: FormationOffer; transactionId: string }
type RoleConfirmation = { role: SpecialRoleOffer; transactionId: string }

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 20 })
const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} Konis`

export function FormationsClient({ character, formations, specialRoles }: { character: Character; formations: FormationOffer[]; specialRoles: SpecialRoleOffer[] }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [retryRequest, setRetryRequest] = useState<Confirmation | null>(null)
  const [roleConfirmation, setRoleConfirmation] = useState<RoleConfirmation | null>(null)
  const [roleRetryRequest, setRoleRetryRequest] = useState<RoleConfirmation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const submitting = useRef(false)

  const groups = new Map<number, { faction: string; reputation: number; offers: FormationOffer[] }>()
  for (const formation of formations) {
    const faction = formation.organisationFormation.nom
    const reputationRow = character.reputation?.find(
      (entry) => String(entry.categorie ?? '').trim().toLocaleLowerCase('fr') === faction.trim().toLocaleLowerCase('fr'),
    )
    const group = groups.get(formation.organisationFormation.id) ?? {
      faction,
      reputation: typeof reputationRow?.valeur === 'number' && Number.isFinite(reputationRow.valeur) ? reputationRow.valeur : 0,
      offers: [],
    }
    group.offers.push(formation)
    groups.set(formation.organisationFormation.id, group)
  }

  async function send(current: Confirmation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    setRoleRetryRequest(null)
    try {
      await purchaseFormation({ transactionId: current.transactionId, formationId: current.formation.id })
      setMessage({ kind: 'success', text: `Formation achetée. ${current.formation.competence} a gagné un niveau.` })
      setRetryRequest(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'L’achat de la formation a échoué.' })
      setRetryRequest(current)
    } finally {
      setPending(false)
      submitting.current = false
    }
  }

  async function confirmPurchase() {
    if (!confirmation) return
    const current = confirmation
    setConfirmation(null)
    await send(current)
  }

  async function sendRolePurchase(current: RoleConfirmation) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage(null)
    setRetryRequest(null)
    try {
      await purchaseSpecialRole({ transactionId: current.transactionId, roleId: current.role.id })
      setMessage({ kind: 'success', text: `Rôle spécial « ${current.role.nom} » acquis.` })
      setRoleRetryRequest(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'L’achat du rôle spécial a échoué.' })
      setRoleRetryRequest(current)
    } finally {
      setPending(false)
      submitting.current = false
    }
  }

  async function confirmRolePurchase() {
    if (!roleConfirmation) return
    const current = roleConfirmation
    setRoleConfirmation(null)
    await sendRolePurchase(current)
  }

  return <div className="shop-app formation-shop">
    <div className="shop-wallet formation-wallet">
      <span>{character.nom}</span>
      <div className="formation-wallet-balances">
        <strong>{money(Number(character.konis) || 0)}</strong>
        <strong>{numberFormat.format(computeRank(Number(character.pointsDeRang) || 0).pointsInRank)} points de rang</strong>
      </div>
    </div>

    {message && <div className={`shop-message ${message.kind}`} role="status">
      {message.text}
      {message.kind === 'error' && retryRequest && <button type="button" disabled={pending} onClick={() => void send(retryRequest)}>Réessayer la même transaction</button>}
      {message.kind === 'error' && roleRetryRequest && <button type="button" disabled={pending} onClick={() => void sendRolePurchase(roleRetryRequest)}>Réessayer la même transaction</button>}
    </div>}

    {!formations.length && !specialRoles.length && <p className="shop-empty">Aucune formation ni aucun rôle spécial n’est disponible.</p>}
    <div className="shop-catalog-groups formation-faction-groups">
      {[...groups.entries()].map(([factionId, group]) => <section key={factionId}>
        <h2>{group.faction}{group.offers.some((formation) => Number(formation.coutRenommee) > 0) && ` - Renommée: ${numberFormat.format(group.reputation)}`}</h2>
        <div className="shop-grid">
          {group.offers.map((formation) => {
            const quote = formationQuote(formation, character)
            const costs = [
              quote.costs.konis > 0 ? money(quote.costs.konis) : null,
              quote.costs.pointsDeRang > 0 ? `${numberFormat.format(quote.costs.pointsDeRang)} points de rang` : null,
              quote.costs.renommee > 0 ? `${numberFormat.format(quote.costs.renommee)} renommée` : null,
            ].filter(Boolean)
            return <article className="shop-item formation-item" key={formation.id}>
              <div className="shop-item-main">
                <div className="shop-item-type">{group.faction}</div>
                <h3>{formation.competence}</h3>
                <div className="shop-item-meta">Niveau {numberFormat.format(quote.level)} → {numberFormat.format(quote.level + 1)}</div>
                <div className="formation-cost-list" aria-label="Coût calculé">
                  {costs.length
                    ? costs.map((cost) => <span key={cost}>{cost}</span>)
                    : <span>Aucun coût de ressource</span>}
                </div>
              </div>
              <div className="shop-item-action formation-item-action">
                <button type="button" disabled={pending || !quote.canBuy} onClick={() => {
                  setRetryRequest(null)
                  setRoleRetryRequest(null)
                  setConfirmation({ formation, transactionId: crypto.randomUUID() })
                }}>Acheter</button>
                {!quote.canBuy && <small>{quote.reasons.join(' ')}</small>}
              </div>
            </article>
          })}
        </div>
      </section>)}
    </div>

    <section className="special-role-shop-section">
      <h2>Rôles spéciaux</h2>
      {!specialRoles.length ? <p className="shop-empty">Aucun rôle spécial n’est disponible.</p> : <div className="shop-grid">
        {specialRoles.map((role) => {
          const quote = specialRoleQuote(role, character)
          return <article className="shop-item" key={role.id}>
            <div className="shop-item-main">
              <div className="shop-item-type">Rôle spécial</div>
              <h3>{role.nom}</h3>
              {role.description && <p>{role.description}</p>}
            </div>
            <div className="shop-item-action">
              <strong>{Number.isFinite(quote.price) ? money(quote.price) : 'Prix invalide'}</strong>
              {quote.owned ? <span>Déjà acquis</span> : <button type="button" disabled={pending || !quote.canBuy} onClick={() => {
                setRoleRetryRequest(null)
                setRetryRequest(null)
                setRoleConfirmation({ role, transactionId: crypto.randomUUID() })
              }}>Acheter</button>}
              {!quote.canBuy && !quote.owned && <small>{quote.reasons.join(' ')}</small>}
            </div>
          </article>
        })}
      </div>}
    </section>

    {confirmation && (() => {
      const quote = formationQuote(confirmation.formation, character)
      const costLines = [
        quote.costs.konis > 0 ? money(quote.costs.konis) : null,
        quote.costs.pointsDeRang > 0 ? `${numberFormat.format(quote.costs.pointsDeRang)} points de rang` : null,
        quote.costs.renommee > 0 ? `${numberFormat.format(quote.costs.renommee)} renommée auprès de ${confirmation.formation.organisationFormation.nom}` : null,
      ].filter(Boolean)
      return <div className="shop-confirm-backdrop" role="presentation">
        <section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="formation-confirm-title">
          <h2 id="formation-confirm-title">Confirmer la formation</h2>
          <p>Faire passer {confirmation.formation.competence} au niveau {numberFormat.format(quote.level + 1)} ? Coût : {costLines.join(', ') || 'aucun'}.</p>
          <div>
            <button type="button" className="shop-cancel-button" onClick={() => setConfirmation(null)}>Annuler</button>
            <button type="button" disabled={pending || !quote.canBuy} onClick={() => void confirmPurchase()}>Confirmer l’achat</button>
          </div>
        </section>
      </div>
    })()}
    {roleConfirmation && (() => {
      const quote = specialRoleQuote(roleConfirmation.role, character)
      return <div className="shop-confirm-backdrop" role="presentation">
        <section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="role-confirm-title">
          <h2 id="role-confirm-title">Confirmer le rôle spécial</h2>
          <p>Acquérir « {roleConfirmation.role.nom} » pour {money(quote.price)} ?</p>
          <div>
            <button type="button" className="shop-cancel-button" onClick={() => setRoleConfirmation(null)}>Annuler</button>
            <button type="button" disabled={pending || !quote.canBuy} onClick={() => void confirmRolePurchase()}>Confirmer l’achat</button>
          </div>
        </section>
      </div>
    })()}
  </div>
}
