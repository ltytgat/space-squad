'use client'

import { useEffect, useMemo, useRef, useState, useId } from 'react'
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
type SaveCreationResult = { success: true; nextStep: string } | { success: false; error: string }

const STEPS = [
  ['caracteristiques', 'Caractéristiques'],
  ['espece', 'Espèce'],
  ['equipement', 'Équipement de départ'],
  ['identite', 'Identité'],
] as const

const ABILITIES = [
  { key: 'force', label: 'Force', die: 'forceDieMod', description: 'Utilisée dans les combats au sol, elle permet de manier des armes lourdes, renforce les points de blessure, réduit le malus des armures et augmente les dégâts au corps-à-corps.' },
  { key: 'habilite', label: 'Habilité', die: 'habiliteDieMod', description: 'Liée au pilotage, elle permet de tenter des actions plus osées en vaisseau et de combattre au corps-à-corps.' },
  { key: 'connaissances', label: 'Connaissances', die: 'connaissancesDieMod', description: 'Elles servent à décrypter, réparer et prodiguer les premiers soins.' },
  { key: 'culture', label: 'Culture', die: 'cultureDieMod', description: 'Elle permet d’influencer les autres, de négocier et de reconnaître des éléments de civilisation comme les armes, les armures, les vaisseaux, les blasons ou les bâtiments.' },
  { key: 'anticipation', label: 'Anticipation', die: 'anticipationDieMod', description: 'Liée à l’esquive et à l’initiative, au sol comme en vaisseau, elle aide à prévoir les actions et à réagir en conséquence.' },
  { key: 'perception', label: 'Perception', die: 'perceptionDieMod', description: 'Liée à la visée, elle est utile pour tous les tirs, en vaisseau comme au fusil.' },
] as const

const ABILITY_VALUE_DESCRIPTION = 'La valeur affichée tient compte du score de base, de l’espèce, de l’équipement et des malus. Le modificateur entre parenthèses s’applique aux jets avec le dé associé.'

const SPECIES = [
  { value: 'Humain', description: 'Espèce humaine sans modificateur de caractéristique.' },
  { value: 'Strani', description: 'Perception +2, Force −2.' },
  { value: 'Vada', description: 'Force +2, Perception −2.' },
] as const

const SPECIES_NAME_ANCHORS: Record<string, string> = {
  Humain: 'noms-humains',
  Strani: 'noms-stranis',
  Vada: 'noms-vadas',
}

const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} Konis`

function CreationTooltip({ label, description }: { label: string; description: string }) {
  const id = useId()
  return <span className="creation-help">
    <button type="button" className="creation-help-trigger" aria-label={`Aide : ${label}`} aria-describedby={id}>?</button>
    <span className="creation-help-tooltip" id={id} role="tooltip">{description}</span>
  </span>
}

export function CharacterCreationWizard({ character, ships, weapons }: {
  character: any
  ships: ShipChoice[]
  weapons: WeaponChoice[]
}) {
  const router = useRouter()
  const step = character.creationEtape as string
  const [rolls, setRolls] = useState<CreationRolls>(character.creationJets ?? {})
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [species, setSpecies] = useState<string>(character.origine ?? 'Humain')
  const [saleModelId, setSaleModelId] = useState('')
  const [shipName, setShipName] = useState('')
  const [thermalWeaponId, setThermalWeaponId] = useState('')
  const [name, setName] = useState(character.nom ?? '')
  const [sex, setSex] = useState(character.sexe ?? '')
  const [pending, setPending] = useState(false)
  const [pendingStep, setPendingStep] = useState<string | null>(null)
  const [error, setError] = useState('')
  const previousStep = useRef(step)
  const stepIndex = STEPS.findIndex(([key]) => key === step)
  const currentSpecies = SPECIES.some((option) => option.value === species) ? species : 'Humain'
  const previewCharacter = useMemo(() => calculateStats({ ...character, origine: currentSpecies }), [character, currentSpecies])
  const selectedShip = ships.find((ship) => String(ship.id) === saleModelId)
  const assignmentsComplete = ABILITIES.every(({ key }) => assigned[key] !== undefined && assigned[key] !== '') &&
    new Set(Object.values(assigned)).size === 6

  useEffect(() => {
    const creationRolls = character.creationJets as CreationRolls | undefined
    const needsRolls = step === 'caracteristiques'
      ? !Array.isArray(creationRolls?.caracteristiques)
      : step === 'equipement'
        ? !creationRolls?.competences || !creationRolls?.konis
        : false

    // Avoid opening a Payload transaction when this step doesn't need dice
    // or the server-rendered character already has them.
    if (!needsRolls) return

    let active = true
    ensureCharacterCreationRolls(character.id)
      .then((result) => {
        if (!active) return
        if (!result.success) setError(result.error)
        else setRolls(result.rolls as CreationRolls)
      })
      .catch(() => { if (active) setError('Impossible de préparer cette étape. Vérifiez votre connexion puis réessayez.') })
    return () => { active = false }
  }, [character.id, character.creationJets, step])

  useEffect(() => {
    setRolls(character.creationJets ?? {})
  }, [character.creationJets])

  useEffect(() => {
    const stepChanged = previousStep.current !== step
    previousStep.current = step
    if (stepChanged) {
      setError('')
      setPending(false)
      setPendingStep(null)
    }
    setAssigned({})
    setSaleModelId('')
    setShipName('')
    setThermalWeaponId('')
    setSpecies(character.origine ?? 'Humain')
    setName(character.nom ?? '')
    setSex(character.sexe ?? '')
  }, [character.id, step, character.origine, character.nom, character.sexe])

  useEffect(() => {
    if (pendingStep && step === pendingStep) {
      setPending(false)
      setPendingStep(null)
    }
  }, [pendingStep, step])

  async function submit(action: () => Promise<SaveCreationResult>, nextStep: string) {
    if (pending) return
    setPending(true)
    setPendingStep(nextStep)
    setError('')
    try {
      const result = await action()
      if (!result.success) {
        setError(result.error)
        setPending(false)
        setPendingStep(null)
        return
      }
      if (result.nextStep !== nextStep) {
        setError('La fiche n’a pas confirmé le passage à l’étape suivante. Réessayez.')
        setPending(false)
        setPendingStep(null)
        return
      }
      router.refresh()
    } catch {
      setError('La sauvegarde n’a pas abouti. Vérifiez votre connexion puis réessayez.')
      setPending(false)
      setPendingStep(null)
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
          <select value={assigned[key] ?? ''} disabled={pending} onChange={(event) => setAssigned((current) => ({ ...current, [key]: event.target.value }))}>
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
      ), 'espece')}>
        {pending ? 'Enregistrement…' : 'Valider mes caractéristiques'}
      </button>
    </>
  }

  function renderSpecies() {
    return <>
      <p className="creation-intro">Choisissez votre espèce. Les modificateurs et les valeurs calculées se mettent à jour avec vos caractéristiques.</p>
      <label className="creation-field creation-species-select">Espèce
        <select value={species} disabled={pending} onChange={(event) => setSpecies(event.target.value)}>
          {SPECIES.map((option) => <option value={option.value} key={option.value}>{option.value}</option>)}
        </select>
      </label>
      <p className="creation-species-note">{SPECIES.find((option) => option.value === currentSpecies)?.description}</p>
      <section className="char-card creation-stat-preview">
        <h2 className="char-card-title">Caractéristiques · {currentSpecies}</h2>
        <div className="creation-stats-grid">
          {ABILITIES.map(({ key, label, die, description }) => {
            const base = Number(character[key]) || 0
            const total = base + (previewCharacter.totalArmorMods[key] || 0) - (Number(character[`malus${key[0].toUpperCase()}${key.slice(1)}`]) || 0)
            const modifier = previewCharacter[die]
            return <div className="creation-stat" key={key}>
              <span>{label}<CreationTooltip label={label} description={`${description} ${ABILITY_VALUE_DESCRIPTION}`} /></span>
              <strong>{total} <small>({modifier >= 0 ? `+${modifier}` : modifier})</small></strong>
            </div>
          })}
        </div>
        <div className="creation-vitals">
          <div><span>Points de blessure max.<CreationTooltip label="Points de blessure maximum" description="Le nombre maximal de points de dégâts que votre personnage peut encaisser avant d'être blessé." /></span><strong>{previewCharacter.maxHP}</strong></div>
          <div><span>Esquive · Découvert<CreationTooltip label="Esquive à découvert" description="Votre valeur d’esquive lorsque vous n’êtes pas à couvert." /></span><strong>{previewCharacter.dodge.decouvert}</strong></div>
          <div><span>Esquive · Dépourvue<CreationTooltip label="Esquive dépourvue" description="Votre valeur d’esquive lorsque vous êtes pris par surprise ou de dos." /></span><strong>{previewCharacter.dodge.depourvue}</strong></div>
          <div><span>Esquive · Protégée<CreationTooltip label="Esquive protégée" description="Votre valeur d’esquive lorsque vous bénéficiez d’une protection partielle." /></span><strong>{previewCharacter.dodge.protege}</strong></div>
          <div><span>Esquive · Couvert<CreationTooltip label="Esquive à couvert" description="Votre valeur d’esquive lorsque vous êtes à couvert." /></span><strong>{previewCharacter.dodge.couvert}</strong></div>
        </div>
      </section>
      <button className="creation-primary" type="button" disabled={pending} onClick={() => submit(() => saveCharacterSpecies(character.id, species), 'equipement')}>
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
        <div><span>Points de compétence · 1d4<CreationTooltip label="Points de compétence" description="Un dé à 4 faces est lancé. Son résultat donne vos points de compétence de départ." /></span><strong>{rolls.competences!.dice[0]}</strong></div>
        <div><span>Konis · 10d1000<CreationTooltip label="Konis de départ" description="Dix dés à 1 000 faces sont lancés. Leurs résultats sont additionnés pour obtenir votre total de Konis." /></span><strong>{money(rolls.konis!.total)}</strong>
          <details className="creation-dice-breakdown">
            <summary>Voir le détail des 10 dés</summary>
            <small>{rolls.konis!.dice.join(' · ')}</small>
          </details>
        </div>
      </section>}
      <h3 className="creation-subtitle">Vaisseau de départ</h3>
      <div className="shipyard-model-grid creation-ship-grid">
        {ships.map((ship) => <article
          className={`shipyard-model-card creation-ship-card${saleModelId === String(ship.id) ? ' creation-choice-selected' : ''}`}
          key={ship.id}
          onClick={(event) => {
            if (pending) return
            const target = event.target
            if (target instanceof Element && target.closest('details, summary, input, label, button, a')) return
            setSaleModelId(String(ship.id))
          }}
        >
          {ship.image && <img className="shipyard-model-image" src={ship.image.url} alt={ship.image.alt} />}
          <div className="shipyard-model-heading"><h4>{ship.nom}</h4><strong>Offert</strong></div>
          <div className="shipyard-model-meta">{[ship.chassis, ship.classe, ship.tourelles ? `${ship.tourelles} tourelle(s)` : null].filter(Boolean).join(' · ')}</div>
          {ship.description && <p>{ship.description}</p>}
          <details className="shipyard-model-components"><summary>Équipement inclus ({ship.components.length})</summary><ul>{ship.components.map(([kind, item], index) => <li key={`${kind}-${item}-${index}`}><span>{kind}</span><strong>{item}</strong></li>)}</ul></details>
          <label className="creation-radio-choice"><input type="radio" name="starting-ship" value={ship.id} checked={saleModelId === String(ship.id)} disabled={pending} onChange={() => setSaleModelId(String(ship.id))} />Choisir le {ship.nom}</label>
        </article>)}
      </div>
      <label className="shipyard-name-field creation-ship-name">Nom du vaisseau
        <input maxLength={100} value={shipName} disabled={pending} onChange={(event) => setShipName(event.target.value)} placeholder={selectedShip?.nom ?? 'Nom de votre vaisseau'} />
      </label>
      <label className="creation-field">Arme thermique de rang I
        <select value={thermalWeaponId} disabled={pending} onChange={(event) => setThermalWeaponId(event.target.value)}>
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
      }), 'identite')}>
        {pending ? 'Enregistrement…' : 'Valider mon équipement'}
      </button>
    </>
  }

  function renderIdentity() {
    return <>
      <p className="creation-intro">Dernière étape : choisissez le nom et le sexe de votre personnage.</p>
      <label className="creation-field">Nom du personnage
        <input autoComplete="off" maxLength={100} value={name} disabled={pending} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="creation-field">Sexe
        <select value={sex} disabled={pending} onChange={(event) => setSex(event.target.value)}>
          <option value="">Choisir</option><option value="M">M</option><option value="F">F</option><option value="X">X</option>
        </select>
      </label>
      <p className="creation-lore-link">Besoin d’inspiration ? <Link href={`/lore/noms#${SPECIES_NAME_ANCHORS[currentSpecies] ?? ''}`}>Consultez l’article du lore sur les noms {currentSpecies}.</Link></p>
      <button className="creation-primary" type="button" disabled={pending || !name.trim() || !sex} onClick={() => submit(() => saveCharacterIdentity(character.id, { nom: name, sexe: sex }), 'termine')}>
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
          {pending && <p className="creation-pending" role="status" aria-live="polite">
            Enregistrement en cours{pendingStep ? ` avant l’étape « ${STEPS.find(([key]) => key === pendingStep)?.[1] ?? pendingStep} »` : ''}. La mise à jour peut prendre quelques instants.
          </p>}
          {content}
          <p className="creation-lore-link"><a href="/docs/R%C3%A8gles.pdf" download="Règles.pdf">Télécharger les règles (PDF)</a></p>
        </section>
      </main>
  </div>
}
