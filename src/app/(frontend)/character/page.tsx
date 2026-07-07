import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './character.css'

export const metadata = {
  title: 'Mon personnage — Space Squad',
}

// ── Types locaux pour les relations populées (depth: 1) ──────────────────────

type Weapon = {
  id: number
  nom: string
  poids?: number
  tailleChargeur?: number
  valeurDegats?: number
  projectilesParTir?: number
  valeurRechargement?: number
}

type Armor = {
  id: number
  nom: string
  valeurArmurePhysique?: number
  valeurBouclier?: number
  modificateur?: number
  valeurRupture?: number
}

type Ship = { id: number; nom: string; classe?: string; modele?: string }
type Group = { id: number; nom: string }

type Character = {
  id: number
  nom?: string
  sexe?: string
  origine?: string
  affiliation?: string
  pointsDeRang?: number
  konis?: number
  legende?: number
  force?: number
  habilite?: number
  connaissances?: number
  culture?: number
  anticipation?: number
  perception?: number
  armureTete?: Armor | string | null
  armureTorse?: Armor | string | null
  armureBras?: Armor | string | null
  armureJambes?: Armor | string | null
  armePrincipale?: Weapon | string | null
  armeSecondaire?: Weapon | string | null
  armeLourde?: Weapon | string | null
  armeDeMelee?: Weapon | string | null
  consommableEquipe1?: any
  consommableEquipe2?: any
  consommableEquipe3?: any
  backpack?: string | null
  vaisseau?: Ship | string | null
  roleVaisseau?: string | null
  groupe?: Group | string | null
  competences?: { competence: string; valeur: number; id?: string }[]
  competencesSpeciales?: { nom: string; valeur: number; id?: string }[]
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CharacterPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 1,
    limit: 1,
  })

  const character = docs[0] ?? null
  if (character) redirect(`/characters/${character.id}`)

  return (
    <div className="ss-root char-root">
      <SiteHeader activePage="character" />

      <div className="char-layout">
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Mon personnage</span>
            </nav>

            <h1 className="char-name char-name-empty">Personnage en cours de création</h1>
            <p className="char-empty-hint">
              Un administrateur remplira votre fiche prochainement.
            </p>
          </div>
        </div>

        <div className="char-content ss-container">
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
