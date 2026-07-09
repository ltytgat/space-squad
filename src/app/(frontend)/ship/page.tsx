import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './ship.css'

export const metadata = {
  title: 'Mon vaisseau — Space Squad',
}

type ShipModel = {
  id: number
  nom: string
  classe?: string
  categorie?: string
  tourelles?: number
  blindage?: number
  generateur?: string
  prix?: string
}

type Ship = { id: number; nom: string; modele?: ShipModel | number | null }

type CrewMember = {
  id: number
  nom?: string
  origine?: string
  affiliation?: string
  roleVaisseau?: string
  user?: { id: number; email: string } | string | null
}

const ROLE_LABEL: Record<string, string> = {
  pilote: 'Pilote',
  copilote: 'Copilote',
  canonnier: 'Canonnier',
  passager: 'Passager',
}

const CATEGORIE_LABEL: Record<string, string> = {
  polyvalent: 'Polyvalent',
  combat: 'Combat',
  exploration: 'Exploration',
  transport: 'Transport',
}

const CLASSE_LABEL: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma',
  delta: 'Delta',
}

export default async function ShipPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  // Récupère le personnage du joueur (avec son vaisseau et le modèle)
  const { docs: charDocs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 2,
    limit: 1,
  })

  const character = charDocs[0] ?? null
  const ship = (character?.vaisseau && typeof character.vaisseau !== 'string'
    ? character.vaisseau
    : null) as Ship | null
  const shipModel = (ship?.modele && typeof ship.modele !== 'number'
    ? ship.modele
    : null) as ShipModel | null

  // Récupère tous les membres à bord
  const crew: CrewMember[] = []
  if (ship) {
    const { docs: crewDocs } = await payload.find({
      collection: 'characters',
      where: { vaisseau: { equals: ship.id } },
      depth: 1,
      limit: 50,
    })
    crew.push(...(crewDocs as CrewMember[]))
  }

  return (
    <div className="ss-root ship-root">
      <SiteHeader activePage="ship" />

      <div className="ship-layout">
        {/* ── En-tête ── */}
        <div className="ship-page-header">
          <div className="ss-container">
            <nav className="ship-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Mon vaisseau</span>
            </nav>

            {ship ? (
              <>
                <h1 className="ship-name">{ship.nom}</h1>
                <div className="ship-tags">
                  {shipModel?.classe && (
                    <span className="ss-tag">Classe {CLASSE_LABEL[shipModel.classe] ?? shipModel.classe}</span>
                  )}
                  {shipModel?.categorie && (
                    <span className="ss-tag">{CATEGORIE_LABEL[shipModel.categorie] ?? shipModel.categorie}</span>
                  )}
                  {shipModel?.nom && <span className="ss-tag">{shipModel.nom}</span>}
                  {character?.roleVaisseau && (
                    <span className={`ss-tag ship-tag-role-${character.roleVaisseau}`}>
                      {ROLE_LABEL[character.roleVaisseau] ?? character.roleVaisseau}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="ship-name ship-name-empty">Aucun vaisseau assigné</h1>
                <p className="ship-empty-hint">
                  Votre personnage n&apos;est pas encore assigné à un vaisseau.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Contenu ── */}
        {ship && (
          <div className="ship-content ss-container">

            {/* Informations */}
            <div className="ship-card">
              <h2 className="ship-card-title">Informations</h2>
              <dl className="ship-dl">
                <div className="ship-dl-row">
                  <dt>Nom</dt>
                  <dd>{ship.nom}</dd>
                </div>
                {shipModel?.classe && (
                  <div className="ship-dl-row">
                    <dt>Classe</dt>
                    <dd>{CLASSE_LABEL[shipModel.classe] ?? shipModel.classe}</dd>
                  </div>
                )}
                {shipModel?.categorie && (
                  <div className="ship-dl-row">
                    <dt>Catégorie</dt>
                    <dd>{CATEGORIE_LABEL[shipModel.categorie] ?? shipModel.categorie}</dd>
                  </div>
                )}
                {shipModel?.nom && (
                  <div className="ship-dl-row">
                    <dt>Modèle</dt>
                    <dd>{shipModel.nom}</dd>
                  </div>
                )}
                {shipModel?.blindage != null && (
                  <div className="ship-dl-row">
                    <dt>Blindage</dt>
                    <dd>{shipModel.blindage}</dd>
                  </div>
                )}
                {shipModel?.tourelles != null && (
                  <div className="ship-dl-row">
                    <dt>Tourelles</dt>
                    <dd>{shipModel.tourelles}</dd>
                  </div>
                )}
                {shipModel?.generateur && (
                  <div className="ship-dl-row">
                    <dt>Générateur</dt>
                    <dd>{shipModel.generateur}</dd>
                  </div>
                )}
                {shipModel?.prix && (
                  <div className="ship-dl-row">
                    <dt>Prix</dt>
                    <dd>{shipModel.prix}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Équipage */}
            {crew.length > 0 && (
              <div className="ship-card">
                <h2 className="ship-card-title">Équipage ({crew.length})</h2>
                <div className="ship-crew-list">
                  {crew.map((member) => (
                    <div
                      key={member.id}
                      className={`ship-crew-item${member.id === character?.id ? ' ship-crew-item-self' : ''}`}
                    >
                      <div className="ship-crew-info">
                        <span className="ship-crew-name">
                          {member.nom || 'Sans nom'}
                          {member.id === character?.id && (
                            <span className="ship-crew-you"> (vous)</span>
                          )}
                        </span>
                        <div className="ship-crew-meta">
                          {member.origine && <span>{member.origine}</span>}
                          {member.affiliation && <span>{member.affiliation}</span>}
                        </div>
                      </div>
                      <span
                        className={`ship-crew-role ship-crew-role-${member.roleVaisseau ?? 'passager'}`}
                      >
                        {ROLE_LABEL[member.roleVaisseau ?? 'passager'] ?? member.roleVaisseau}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
