import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { listSeats, seatOf } from '@/lib/shipCrew'
import './ships.css'

export const metadata = {
  title: 'Vaisseaux — Space Squad',
}

type ShipModel = { id: number; nom: string; classe?: string; categorie?: string }
type Ship = {
  id: number
  nom: string
  modele?: ShipModel | number | null
  pilote?: unknown
  copilote?: unknown
  canonniers?: unknown[]
}
type CrewMember = { id: number; nom?: string }

const CATEGORIE_LABEL: Record<string, string> = {
  polyvalent: 'Polyvalent',
  combat: 'Combat',
  exploration: 'Exploration',
  transport: 'Transport',
}

const ROLE_LABEL: Record<string, string> = {
  pilote: 'Pilote',
  copilote: 'Copilote',
  canonnier: 'Canonnier',
  passager: 'Passager',
}

const CLASSE_LABEL: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma',
  delta: 'Delta',
}

export default async function ShipsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')
  if ((user as { role?: string }).role !== 'admin') redirect('/')

  const [{ docs: ships }, { docs: characters }] = await Promise.all([
    // depth 2 : le châssis du modèle porte le nombre de tourelles (donc de places).
    payload.find({ collection: 'ships', depth: 2, limit: 200, sort: 'nom' }),
    payload.find({
      collection: 'characters',
      depth: 0,
      limit: 500,
      sort: 'nom',
    }),
  ])

  // Regroupe les personnages par vaisseau
  const crewByShip = new Map<number, CrewMember[]>()
  for (const c of characters as unknown as CrewMember[]) {
    const shipId = (c as unknown as { vaisseau?: number | { id: number } }).vaisseau
    const id = typeof shipId === 'number' ? shipId : shipId?.id
    if (!id) continue
    const list = crewByShip.get(id) ?? []
    list.push(c)
    crewByShip.set(id, list)
  }

  return (
    <div className="ss-root ships-root">
      <SiteHeader activePage="ships" />

      <div className="ships-layout">
        {/* ── En-tête ── */}
        <div className="ships-page-header">
          <div className="ss-container">
            <nav className="ships-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Vaisseaux</span>
            </nav>
            <h1 className="ships-page-title">
              Vaisseaux
              <span className="ships-page-count">{ships.length}</span>
            </h1>
          </div>
        </div>

        {/* ── Liste ── */}
        <div className="ships-content ss-container">
          {ships.length === 0 ? (
            <p className="ships-empty">Aucun vaisseau enregistré pour l&apos;instant.</p>
          ) : (
            <div className="ships-grid">
              {(ships as Ship[]).map((ship) => {
                const crew = crewByShip.get(ship.id) ?? []
                // Les places du vaisseau font foi ; le reste de l'équipage est passager.
                const byId = new Map(crew.map((member) => [String(member.id), member]))
                const crewGroups = [
                  ...listSeats(ship).map((seat) => ({
                    label: seat.label,
                    members: [byId.get(String(seat.occupantId))].filter(Boolean) as CrewMember[],
                  })),
                  {
                    label: 'Passagers',
                    members: crew.filter((member) => seatOf(ship, member.id) === 'passager'),
                  },
                ]
                const model = (ship.modele && typeof ship.modele !== 'number') ? ship.modele : null

                return (
                  <div key={ship.id} className="ships-card">
                    <div className="ships-card-header">
                      <h3 className="ships-card-name"><a href={`/ships/${ship.id}`}>{ship.nom}</a></h3>
                      <div className="ships-card-tags">
                        {model?.classe && (
                          <span className="ships-tag ships-tag-classe">
                            Classe {CLASSE_LABEL[model.classe] ?? model.classe}
                          </span>
                        )}
                        {model?.categorie && (
                          <span className="ships-tag">{CATEGORIE_LABEL[model.categorie] ?? model.categorie}</span>
                        )}
                        {model?.nom && <span className="ships-tag">{model.nom}</span>}
                      </div>
                    </div>

                    <a className="ships-card-link" href={`/ships/${ship.id}`}>Ouvrir la fiche <span aria-hidden="true">→</span></a>

                    <div className="ships-crew">
                      {crew.length === 0 ? (
                        <p className="ships-crew-empty">Aucun équipage assigné</p>
                      ) : (
                        <>
                          {crewGroups.filter(g => g.members.length > 0).map(g => (
                            <div key={g.label} className="ships-crew-group">
                              <span className="ships-crew-group-label">{g.label}</span>
                              <ul className="ships-crew-list">
                                {g.members.map((m) => (
                                  <li key={m.id}>{m.nom || 'Sans nom'}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
