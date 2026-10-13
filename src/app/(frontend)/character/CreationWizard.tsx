'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateStats } from '@/lib/characterStats'
import {
  ensureCharacterCreationRolls,
  saveCharacterIdentity,
  saveCharacterSpecies,
  saveCharacteristicAssignment,
  saveStartingEquipment,
} from './creation-actions'

type ShipChoice = {
  id: number
  nom: string
  prix: string
  description: string | null
  image: { url: string; alt: string } | null
  chassis: string | null
  classe: string | null
  tourelles: number
  components: [string, string][]
}
type WeaponChoice = { id: number; nom: string; categorie: string }
type AbilityRoll = { dice: number[]; kept: number[]; discarded: number; total: number }
type CreationRolls = {
  caracteristiques?: AbilityRoll[]
  competences?: { dice: number[]; total: number }
  konis?: { dice: number[]; total: number }
}

const STEPS = [
  ['caracteristiques', 'Caractéristiques'],
  ['espece', 'Espèce'],
  ['equipement', 'Équipement de départ'],
  ['identite', 'Identité'],
] as const

const ABILITIES = [
  { key: 'force', label: 'Force', die: 'forceDieMod' },
  { key: 'habilite', label: 'Habilité', die: 'habiliteDieMod' },
  { key: 'connaissances', label: 'Connaissances', die: 'connaissancesDieMod' },
  { key: 'culture', label: 'Culture', die: 'cultureDieMod' },
  { key: 'anticipation', label: 'Anticipation', die: 'anticipationDieMod' },
  { key: 'perception', label: 'Perception', die: 'perceptionDieMod' },
] as const

const SPECIES = [
  { value: 'Humain', description: 'Espèce humaine sans modificateur de caractéristique.' },
  { value: 'Strani', description: 'Perception +2, Force −2.' },
  { value: 'Vada', description: 'Force +2, Perception −2.' },
] as const

const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} Konis`

export function CharacterCreationWizard({ character, ships, weapons }: {
  character: any
  ships: ShipChoice[]
  weapons: WeaponChoice[]
}) {
  const router = useRouter()
  const [rolls, setRolls] = useState<CreationRolls>(character.creationJets ?? {})
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [species, setSpecies] = useState<string>(character.origine ?? 'Humain')
  const [saleModelId, setSaleModelId] = useState('')
  const [shipName, setShipName] = useState('')
  const [thermalWeaponId, setThermalWeaponId] = useState('')
  const [name, setName] = useState(character.nom ?? '')
  const [sex, setSex] = useState(character.sexe ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const step = character.creationEtape as string
  const stepIndex = STEPS.findIndex(([key]) => key === step)
  const currentSpecies = SPECIES.some((option) => option.value === species) ? species : 'Humain'
  const previewCharacter = useMemo(() => calculateStats({ ...character, origine: currentSpecies }), [character, currentSpecies])
  const selectedShip = ships.find((ship) => String(ship.id) === saleModelId)
  const assignmentsComplete = ABILITIES.every(({ key }) => assigned[key] !== undefined && assigned[key] !== '') &&
    new Set(Object.values(assigned)).size === 6

  useEffect(() => {
    let active = true
    ensureCharacterCreationRolls(character.id)
      .then((result) => { if (active) setRolls(result.rolls as CreationRolls) })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Impossible de préparer les jets.') })
    return () => { active = false }
  }, [character.id, step])

  useEffect(() => {
    setError('')
    setRolls(character.creationJets ?? {})
    setAssigned({})
    setSaleModelId('')
    setShipName('')
    setThermalWeaponId('')
    setSpecies(character.origine ?? 'Humain')
    setName(character.nom ?? '')
    setSex(character.sexe ?? '')
  }, [character.id, step, character.creationJets, character.origine, character.nom, character.sexe])

  async function submit(action: () => Promise<unknown>) {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await action()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La sauvegarde a échoué. Réessayez.')
    } finally {
      setPending(false)
    }
  }

  function renderRolls() {
    if (!rolls.caracteristiques?.length) return <p className="creation-loading">Préparation des dés…</p>
    return <>
      <div className="creation-roll-grid">
        {rolls.caracteristiques.map((roll, index) => <article className="creation-roll-card" key={index}>
          <h3>Résultat {index + 1}</h3>
          <div className="creation-dice" aria-label={`Quatre dés : ${roll.dice.join(', ')}`}>
            {roll.dice.map((die, dieIndex) => <span
              className={`creation-die${roll.discarded === dieIndex ? ' creation-die--discarded' : ''}`}
              key={`${index}-${dieIndex}`}
              title={roll.discarded === dieIndex ? 'Dé écarté' : 'Dé conservé'}
            >{die}</span>)}
          </div>
          <p>Trois meilleurs dés <strong>{roll.total}</strong></p>
        </article>)}
      </div>
      <p className="creation-roll-total">Total des six résultats <strong>{rolls.caracteristiques.reduce((sum, roll) => sum + roll.total, 0)}</strong></p>
      <div className="creation-assignment-grid">
        {ABILITIES.map(({ key, label }) => <label key={key}>
          <span>{label}</span>
          <select value={assigned[key] ?? ''} onChange={(event) => setAssigned((current) => ({ ...current, [key]: event.target.value }))}>
            <option value="">Affecter un résultat</option>
            {rolls.caracteristiques!.map((roll, index) => <option
              key={index}
              value={index}
              disabled={Object.entries(assigned).some(([otherKey, value]) => otherKey !== key && value === String(index))}
            >Résultat {index + 1} · {roll.total}</option>)}
          </select>
        </label>)}
      </div>
      <button className="creation-primary" type="button" disabled={pending || !assignmentsComplete} onClick={() => submit(() => saveCharacteristicAssignment(
        character.id,
        Object.fromEntries(Object.entries(assigned).map(([key, value]) => [key, Number(value)])),
      ))}>
        {pending ? 'Enregistrement…' : 'Valider mes caractéristiques'}
      </button>
    </>
  }

  function renderSpecies() {
    return <>
      <p className="creation-intro">Choisissez votre espèce. Les modificateurs et les valeurs calculées se mettent à jour avec vos caractéristiques.</p>
      <label className="creation-field creation-species-select">Espèce
        <select value={species} onChange={(event) => setSpecies(event.target.value)}>
          {SPECIES.map((option) => <option value={option.value} key={option.value}>{option.value}</option>)}
        </select>
      </label>
      <p className="creation-species-note">{SPECIES.find((option) => option.value === currentSpecies)?.description}</p>
      <section className="char-card creation-stat-preview">
        <h2 className="char-card-title">Caractéristiques · {currentSpecies}</h2>
        <div className="creation-stats-grid">
          {ABILITIES.map(({ key, label, die }) => {
            const base = Number(character[key]) || 0
            const total = base + (previewCharacter.totalArmorMods[key] || 0) - (Number(character[`malus${key[0].toUpperCase()}${key.slice(1)}`]) || 0)
            const modifier = previewCharacter[die]
            return <div className="creation-stat" key={key}>
              <span>{label}</span><strong>{total} <small>({modifier >= 0 ? `+${modifier}` : modifier})</small></strong>
            </div>
          })}
        </div>
        <div className="creation-vitals">
          <div><span>Points de blessure max.</span><strong>{previewCharacter.maxHP}</strong></div>
          <div><span>Esquive · Découvert</span><strong>{previewCharacter.dodge.decouvert}</strong></div>
          <div><span>Esquive · Dépourvue</span><strong>{previewCharacter.dodge.depourvue}</strong></div>
          <div><span>Esquive · Protégée</span><strong>{previewCharacter.dodge.protege}</strong></div>
          <div><span>Esquive · Couvert</span><strong>{previewCharacter.dodge.couvert}</strong></div>
        </div>
      </section>
      <button className="creation-primary" type="button" disabled={pending} onClick={() => submit(() => saveCharacterSpecies(character.id, species))}>
        {pending ? 'Enregistrement…' : `Valider l’espèce ${species}`}
      </button>
    </>
  }

  function renderEquipment() {
    const resourceRollsReady = !!rolls.competences && !!rolls.konis
    return <>
      <p className="creation-intro">Choisissez votre premier vaisseau et une arme thermique de rang I. Votre équipement individuel de départ est équipé sur la fiche.</p>
      {!resourceRollsReady && <p className="creation-loading">Préparation des jets de ressources…</p>}
      {resourceRollsReady && <section className="creation-resources" aria-label="Ressources de départ tirées aux dés">
        <div><span>Points de compétence · 1d4</span><strong>{rolls.competences!.dice[0]}</strong></div>
        <div><span>Konis · 10d1000</span><strong>{money(rolls.konis!.total)}</strong>
          <small>{rolls.konis!.dice.join(' · ')}</small>
        </div>
      </section>}
      <h3 className="creation-subtitle">Vaisseau de départ</h3>
      <div className="shipyard-model-grid creation-ship-grid">
        {ships.map((ship) => <article className={`shipyard-model-card creation-ship-card${saleModelId === String(ship.id) ? ' creation-choice-selected' : ''}`} key={ship.id}>
          {ship.image && <img className="shipyard-model-image" src={ship.image.url} alt={ship.image.alt} />}
          <div className="shipyard-model-heading"><h4>{ship.nom}</h4><strong>Offert</strong></div>
          <div className="shipyard-model-meta">{[ship.chassis, ship.classe, ship.tourelles ? `${ship.tourelles} tourelle(s)` : null].filter(Boolean).join(' · ')}</div>
          {ship.description && <p>{ship.description}</p>}
          <details className="shipyard-model-components"><summary>Équipement inclus ({ship.components.length})</summary><ul>{ship.components.map(([kind, item], index) => <li key={`${kind}-${item}-${index}`}><span>{kind}</span><strong>{item}</strong></li>)}</ul></details>
          <label className="creation-radio-choice"><input type="radio" name="starting-ship" value={ship.id} checked={saleModelId === String(ship.id)} onChange={() => setSaleModelId(String(ship.id))} />Choisir le {ship.nom}</label>
        </article>)}
      </div>
      <label className="shipyard-name-field creation-ship-name">Nom du vaisseau
        <input maxLength={100} value={shipName} onChange={(event) => setShipName(event.target.value)} placeholder={selectedShip?.nom ?? 'Nom de votre vaisseau'} />
      </label>
      <label className="creation-field">Arme thermique de rang I
        <select value={thermalWeaponId} onChange={(event) => setThermalWeaponId(event.target.value)}>
          <option value="">Choisir une arme</option>
          {weapons.map((weapon) => <option value={weapon.id} key={weapon.id}>{weapon.nom}</option>)}
        </select>
      </label>
      <section className="creation-starter-gear">
        <h3>Équipement personnel attribué</h3>
        <p>Casque, plastron, gantelets et jambières de Bleu · Lame carboné I · Arme thermique choisie.</p>
      </section>
      <button className="creation-primary" type="button" disabled={pending || !resourceRollsReady || !saleModelId || !thermalWeaponId} onClick={() => submit(() => saveStartingEquipment(character.id, {
        saleModelId: Number(saleModelId),
        shipName,
        thermalWeaponId: Number(thermalWeaponId),
      }))}>
        {pending ? 'Enregistrement…' : 'Valider mon équipement'}
      </button>
    </>
  }

  function renderIdentity() {
    return <>
      <p className="creation-intro">Dernière étape : choisissez le nom et le sexe de votre personnage.</p>
      <label className="creation-field">Nom du personnage
        <input autoComplete="off" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="creation-field">Sexe
        <select value={sex} onChange={(event) => setSex(event.target.value)}>
          <option value="">Choisir</option><option value="M">M</option><option value="F">F</option><option value="X">X</option>
        </select>
      </label>
      <p className="creation-lore-link">Besoin d’inspiration ? <Link href="/lore/noms">Consultez l’article du lore sur les noms.</Link></p>
      <button className="creation-primary" type="button" disabled={pending || !name.trim() || !sex} onClick={() => submit(() => saveCharacterIdentity(character.id, { nom: name, sexe: sex }))}>
        {pending ? 'Enregistrement…' : 'Terminer la création'}
      </button>
    </>
  }

  const content = step === 'caracteristiques' ? renderRolls()
    : step === 'espece' ? renderSpecies()
      : step === 'equipement' ? renderEquipment()
        : step === 'identite' ? renderIdentity()
          : <p className="creation-error">L’étape de création de cette fiche n’est pas reconnue. Contactez un administrateur.</p>

  return <div className="char-layout">
      <section className="char-page-header"><div className="ss-container">
        <nav className="char-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><span>Création du personnage</span></nav>
        <h1 className="char-name">Création du personnage</h1>
        <p className="char-empty-hint">Chaque étape validée est enregistrée et ne pourra plus être modifiée depuis votre compte.</p>
      </div></section>
      <main className="char-content ss-container">
        <nav className="creation-progress" aria-label="Étapes de création">
          {STEPS.map(([key, label], index) => <div className={`creation-progress-step${index === stepIndex ? ' is-current' : ''}${index < stepIndex ? ' is-complete' : ''}`} key={key}>
            <span>{index + 1}</span><strong>{label}</strong>
          </div>)}
        </nav>
        <section className="char-card creation-panel">
          <header><span>Étape {Math.max(stepIndex + 1, 1)} sur {STEPS.length}</span><h2>{STEPS[stepIndex]?.[1] ?? 'Création'}</h2></header>
          {error && <p className="creation-error" role="alert">{error}</p>}
          {content}
        </section>
      </main>
  </div>
}
