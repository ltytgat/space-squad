'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renameShip } from './actions'

export function ShipNameEditor({ shipId, initialName, readOnly }: {
  shipId: number
  initialName: string
  readOnly: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      const result = await renameShip(shipId, draft)
      setName(result.nom)
      setDraft(result.nom)
      setEditing(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de renommer le vaisseau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="ship-name-editor">
      <div className="ship-name-heading">
        <h1 className="ship-name">{name}</h1>
        {!readOnly && !editing && (
          <button type="button" className="ship-rename-button" onClick={() => setEditing(true)}>
            Renommer
          </button>
        )}
      </div>
      {editing && (
        <form className="ship-rename-form" onSubmit={save}>
          <label htmlFor={`ship-name-${shipId}`}>Nom du vaisseau</label>
          <input
            id={`ship-name-${shipId}`}
            autoFocus
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={pending}
          />
          <button type="submit" className="ship-rename-button" disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="ship-rename-cancel" disabled={pending} onClick={() => {
            setDraft(name)
            setEditing(false)
            setError('')
          }}>
            Annuler
          </button>
          {error && <p className="ship-rename-error" role="alert">{error}</p>}
        </form>
      )}
    </div>
  )
}
