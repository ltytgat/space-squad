'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { executeCharacterTransfer } from './actions'

export type TransferItem = { key: string; nom: string; kind: string; label: string; quantity: number }
type Recipient = { id: number; nom: string }
type Request = { transactionId: string; action: 'item' | 'konis'; destinationCharacterId: number; sourceKey?: string; quantity?: number; amount?: number }
type Confirmation = { request: Omit<Request, 'transactionId'>; transactionId: string; description: string }

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`

export function CharacterTransferClient({ character, recipients, items }: {
  character: { id: number; nom: string; konis: number }
  recipients: Recipient[]
  items: TransferItem[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'item' | 'konis'>('item')
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? 0)
  const [sourceKey, setSourceKey] = useState(items[0]?.key ?? '')
  const [quantity, setQuantity] = useState(1)
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [retryRequest, setRetryRequest] = useState<Confirmation | null>(null)
  const selectedItem = items.find((item) => item.key === sourceKey)
  const recipient = recipients.find((entry) => entry.id === recipientId)

  function requestTransfer(request: Omit<Request, 'transactionId'>, description: string) {
    setRetryRequest(null)
    setConfirmation({ request, transactionId: crypto.randomUUID(), description })
  }

  async function send(current: Confirmation) {
    setPending(true)
    setMessage(null)
    try {
      await executeCharacterTransfer({ ...current.request, transactionId: current.transactionId })
      setMessage({ kind: 'success', text: 'Transfert effectué.' })
      setRetryRequest(null)
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Le transfert a échoué.' })
      setRetryRequest(current)
    } finally {
      setPending(false)
    }
  }

  async function confirm() {
    if (!confirmation) return
    const current = confirmation
    setConfirmation(null)
    await send(current)
  }

  const parsedAmount = Number(amount)
  const canTransferMoney = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= character.konis && /^\d+(?:\.\d{1,4})?$/.test(amount)

  return <div className="shop-app">
    <div className="shop-wallet"><span>{character.nom}</span><strong>{money(character.konis)}</strong></div>
    <div className="shop-tabs" role="tablist" aria-label="Type de transfert">
      <button type="button" role="tab" aria-selected={tab === 'item'} className={tab === 'item' ? 'active' : ''} onClick={() => setTab('item')}>Matériel</button>
      <button type="button" role="tab" aria-selected={tab === 'konis'} className={tab === 'konis' ? 'active' : ''} onClick={() => setTab('konis')}>Konis</button>
    </div>
    {message && <div className={`shop-message ${message.kind}`} role="status">{message.text}{retryRequest && <button type="button" disabled={pending} onClick={() => void send(retryRequest)}>Réessayer</button>}</div>}
    {!recipients.length ? <p className="shop-empty">Aucun autre personnage n’appartient à votre escouade.</p> : <section className="shop-catalog-groups shipyard-operation">
      <label className="shipyard-select">Destinataire<select value={recipientId} onChange={(event) => setRecipientId(Number(event.target.value))}>{recipients.map((entry) => <option key={entry.id} value={entry.id}>{entry.nom}</option>)}</select></label>
      {tab === 'item' ? <>
        {!items.length ? <p className="shop-empty">Votre inventaire ne contient aucun matériel transférable.</p> : <>
          <label className="shipyard-select">Matériel à envoyer<select value={sourceKey} onChange={(event) => { setSourceKey(event.target.value); setQuantity(1) }}>{items.map((item) => <option key={item.key} value={item.key}>{item.nom} · {item.label}{item.quantity > 1 ? ` · ${item.quantity} en réserve` : ''}</option>)}</select></label>
          {selectedItem && <div className="shop-empty shipyard-transfer-detail"><strong>{selectedItem.nom}</strong><span>{selectedItem.label} · {selectedItem.quantity} disponible(s) dans la réserve</span>{selectedItem.quantity > 1 && <label className="shop-quantity">Quantité à transférer<input type="number" min={1} max={selectedItem.quantity} step={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(selectedItem.quantity, Number(event.target.value) || 1)))} /></label>}</div>}
          <button type="button" disabled={pending || !recipient || !selectedItem} onClick={() => selectedItem && recipient && requestTransfer({ action: 'item', destinationCharacterId: recipient.id, sourceKey, quantity: selectedItem.quantity > 1 ? quantity : 1 }, `Envoyer ${quantity} × ${selectedItem.nom} à ${recipient.nom} ?`)}>Transférer le matériel</button>
        </>}
      </> : <>
        <label className="shipyard-select">Montant à envoyer<input type="number" min="0.0001" max={character.konis} step="0.0001" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <p className="shop-empty">Solde disponible : {money(character.konis)}.</p>
        <button type="button" disabled={pending || !recipient || !canTransferMoney} onClick={() => recipient && requestTransfer({ action: 'konis', destinationCharacterId: recipient.id, amount: parsedAmount }, `Envoyer ${money(parsedAmount)} à ${recipient.nom} ?`)}>Effectuer le virement</button>
      </>}
    </section>}
    {confirmation && <div className="shop-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmation(null) }}><section className="shop-confirm" role="dialog" aria-modal="true" aria-labelledby="character-transfer-title"><h2 id="character-transfer-title">Confirmer le transfert</h2><p>{confirmation.description}</p><div><button type="button" className="shop-cancel-button" onClick={() => setConfirmation(null)}>Annuler</button><button type="button" disabled={pending} onClick={() => void confirm()}>Confirmer</button></div></section></div>}
  </div>
}
