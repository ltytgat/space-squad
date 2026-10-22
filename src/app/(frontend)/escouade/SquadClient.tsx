'use client'

import { useState, useTransition } from 'react'
import { createSquad, joinSquadWithCode } from './actions'

type Squad = { id: number; nom: string; inviteCode?: string | null; members?: string[] }

export function SquadClient({ mode, squads, currentSquad }: {
  mode: 'player' | 'mj'
  squads: Squad[]
  currentSquad: string | null
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function create(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createSquad(name)
      setMessage(result.success ? `Escouade créée. Code : ${result.group?.inviteCode}` : result.error ?? 'Échec de la création.')
      if (result.success) window.location.reload()
    })
  }

  function join(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await joinSquadWithCode(code)
      setMessage(result.success ? (result.unchanged ? 'Vous faites déjà partie de cette escouade.' : 'Votre escouade a été mise à jour.') : result.error ?? 'Échec du changement d’escouade.')
      if (result.success && !result.unchanged) window.location.reload()
    })
  }

  return <section className="ss-container squad-content">
    {message && <p role="status" className="squad-message">{message}</p>}
    {mode === 'mj' ? <>
      <section className="squad-card">
        <h2>Créer une escouade</h2>
        <p>{squads.length} / 5 escouades créées</p>
        {squads.length < 5 && <form onSubmit={create} className="squad-form">
          <label>Nom de l’escouade<input value={name} required onChange={(event) => setName(event.target.value)} /></label>
          <button className="ss-btn ss-btn-primary" disabled={isPending}>Créer</button>
        </form>}
      </section>
      {squads.map((squad) => <article className="squad-card" key={squad.id}>
        <h2>{squad.nom}</h2>
        <p>Code d’invitation : <strong className="squad-code">{squad.inviteCode}</strong></p>
        <h3>Membres</h3>
        {squad.members?.length ? <ul>{squad.members.map((member) => <li key={member}>{member}</li>)}</ul> : <p>Aucun membre pour le moment.</p>}
      </article>)}
    </> : <section className="squad-card">
      <h2>{currentSquad ? `Votre escouade : ${currentSquad}` : 'Rejoindre une escouade'}</h2>
      <p>Saisissez le code transmis par le MJ pour rejoindre ou changer d’escouade.</p>
      <form onSubmit={join} className="squad-form">
        <label>Code d’invitation<input value={code} minLength={8} maxLength={8} required autoCapitalize="characters" onChange={(event) => setCode(event.target.value.toUpperCase())} /></label>
        <button className="ss-btn ss-btn-primary" disabled={isPending}>Rejoindre</button>
      </form>
    </section>}
  </section>
}
