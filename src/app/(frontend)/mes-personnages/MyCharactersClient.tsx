'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CharacterType } from '@/lib/characterType'
import { countCharacterTypes, MAX_PLAYER_CHARACTERS, MAX_NPC_CHARACTERS } from '@/lib/characterLimits'
import { createOwnedCharacter, deleteOwnedCharacter, selectOwnedCharacter } from './actions'

type Character = {
  id: number
  typePersonnage: CharacterType
  nom: string | null
  sexe: string | null
  origine: string | null
  affiliation: { nom: string } | null
  rank: number
  konis: number
  creationComplete: boolean
  shipsCount: number
  vehiclesCount: number
}

export function MyCharactersClient({
  characters,
  activeCharacterId,
  canCreate,
  canCreateNPC,
}: {
  characters: Character[]
  activeCharacterId: number | null
  canCreate: boolean
  canCreateNPC: boolean
}) {
  const counts = countCharacterTypes(characters)
  const playerSlotsFull = canCreateNPC ? counts.joueur >= MAX_PLAYER_CHARACTERS : characters.length >= MAX_PLAYER_CHARACTERS
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState<Character | null>(null)

  async function createCharacter(typePersonnage: CharacterType = 'joueur') {
    setPending(true)
    setMessage('')
    const result = await createOwnedCharacter(typePersonnage)
    setPending(false)
    if (!result.success) {
      setMessage(result.error ?? 'La création du personnage a échoué.')
      return
    }
    window.location.assign(result.href ?? '/character')
  }

  async function selectCharacter(character: Character) {
    setPending(true)
    setMessage('')
    const result = await selectOwnedCharacter(character.id)
    setPending(false)
    if (!result.success) {
      setMessage(result.error ?? 'Impossible de sélectionner ce personnage.')
      return
    }
    window.location.assign(result.href)
  }

  async function confirmDelete() {
    if (!deleting) return
    setPending(true)
    setMessage('')
    const result = await deleteOwnedCharacter(deleting.id)
    setPending(false)
    if (!result.success) {
      setMessage(result.error ?? 'La suppression du personnage a échoué.')
      setDeleting(null)
      return
    }
    window.location.assign('/mes-personnages')
  }

  return (
    <div className="my-characters-client">
      <div className="my-characters-toolbar">
        <p>{canCreateNPC
          ? `Joueur : ${counts.joueur} / ${MAX_PLAYER_CHARACTERS} · PNJ : ${counts.pnj} / ${MAX_NPC_CHARACTERS}`
          : `${characters.length} personnage${characters.length !== 1 ? 's' : ''} sur ${MAX_PLAYER_CHARACTERS} maximum`}</p>
        <div className="my-character-actions">
          <button
            type="button"
            className="ss-btn ss-btn-primary"
            disabled={pending || !canCreate || playerSlotsFull}
            onClick={() => void createCharacter()}
          >
            Créer un personnage
          </button>
          {canCreateNPC && <button
            type="button"
            className="ss-btn ss-btn-outline"
            disabled={pending || counts.pnj >= MAX_NPC_CHARACTERS}
            onClick={() => void createCharacter('pnj')}
          >Créer un PNJ vierge</button>}
        </div>
      </div>
      {canCreateNPC && <p className="my-characters-notice">Un PNJ démarre avec une fiche vierge à remplir en mode édition et peut rejoindre vos propres escouades. Le parcours habituel crée un personnage Joueur.</p>}
      {!canCreate && <p className="my-characters-notice">Passez en mode joueur pour créer un personnage via le parcours habituel.</p>}
      {message && <p className="my-characters-message" role="status">{message}</p>}

      {characters.length === 0 ? (
        <p className="chars-empty">Aucun personnage n’est associé à votre compte. Créez-en un pour commencer.</p>
      ) : (
        <div className="chars-grid">
          {characters.map((character) => {
            const active = character.id === activeCharacterId
            return (
              <article className={`chars-card my-character-card${active ? ' my-character-card-active' : ''}`} key={character.id}>
                <div className="chars-card-header">
                  <div className="my-character-title-row">
                    <h2 className="chars-card-name">{character.nom || <em>Sans nom</em>}</h2>
                    {active && <span className="my-character-active-tag">Actif</span>}
                  </div>
                  <div className="chars-card-tags">
                    <span className="chars-tag">{character.typePersonnage === 'pnj' ? 'PNJ' : 'Joueur'}</span>
                    {character.origine && <span className="chars-tag chars-tag-origine">{character.origine}</span>}
                    {character.sexe && <span className="chars-tag">{character.sexe}</span>}
                    {character.affiliation?.nom && <span className="chars-tag">{character.affiliation.nom}</span>}
                  </div>
                </div>

                <dl className="chars-card-dl">
                  <div className="chars-card-dl-row"><dt>Vaisseaux</dt><dd>{character.shipsCount}</dd></div>
                  <div className="chars-card-dl-row"><dt>Véhicules</dt><dd>{character.vehiclesCount}</dd></div>
                </dl>
                <div className="chars-card-stats">
                  <div className="chars-stat"><span className="chars-stat-label">Rang</span><span className="chars-stat-value">{character.rank}</span></div>
                  <div className="chars-stat"><span className="chars-stat-label">Konis</span><span className="chars-stat-value">{character.konis}</span></div>
                </div>

                <div className="my-character-actions">
                  {active ? (
                    character.creationComplete
                      ? <Link className="ss-btn ss-btn-outline" href={`/characters/${character.id}`}>Ouvrir la fiche</Link>
                      : <Link className="ss-btn ss-btn-outline" href="/character">Reprendre la création</Link>
                  ) : (
                    <button type="button" className="ss-btn ss-btn-outline" disabled={pending} onClick={() => void selectCharacter(character)}>
                      {character.creationComplete ? 'Choisir ce personnage' : 'Choisir et reprendre la création'}
                    </button>
                  )}
                  <button type="button" className="my-character-delete" disabled={pending} onClick={() => setDeleting(character)}>
                    Supprimer
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {deleting && (
        <div className="my-character-confirm-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !pending) setDeleting(null)
        }}>
          <section className="my-character-confirm" role="dialog" aria-modal="true" aria-labelledby="my-character-confirm-title">
            <h2 id="my-character-confirm-title">Supprimer {deleting.nom || 'ce personnage'} ?</h2>
            <p>Cette suppression est définitive. Elle supprimera aussi {deleting.shipsCount} vaisseau{deleting.shipsCount !== 1 ? 'x' : ''} et {deleting.vehiclesCount} véhicule{deleting.vehiclesCount !== 1 ? 's' : ''} appartenant à ce personnage.</p>
            {deleting.shipsCount > 0 && <p>L’équipage de ces vaisseaux sera débarqué.</p>}
            <p>Les historiques de transactions et de récompenses resteront conservés.</p>
            <div className="my-character-confirm-actions">
              <button type="button" className="ss-btn ss-btn-outline" disabled={pending} onClick={() => setDeleting(null)}>Annuler</button>
              <button type="button" className="ss-btn my-character-confirm-delete" disabled={pending} onClick={() => void confirmDelete()}>
                {pending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
