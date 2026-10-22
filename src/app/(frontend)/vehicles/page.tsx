import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { findVehicleOwnerIds, getUserCharacter } from '@/lib/vehicleAccess'
import { getActiveMode } from '@/lib/activeMode'
import { getMJVehicleIds } from '@/lib/mjAccess'
import './vehicles.css'

export const metadata = { title: 'Véhicules de l’escouade — Space Squad' }

export default async function VehiclesPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')

  const mode = await getActiveMode(user)
  const isAdmin = mode === 'admin'
  const isMJ = mode === 'mj'
  const character = await getUserCharacter(payload, user)
  if (!character && !isAdmin && !isMJ) redirect('/character')
  const ownerIds = character ? await findVehicleOwnerIds(payload, character) : []
  const mjVehicleIds = isMJ ? await getMJVehicleIds(payload, user) : []
  const { docs } = await payload.find({
    collection: 'vehicles',
    ...(isAdmin ? {} : isMJ
      ? { where: { id: { in: mjVehicleIds.length ? mjVehicleIds : [-1] } } }
      : { where: { proprietaire: { in: ownerIds } } }),
    depth: 2,
    limit: 500,
    sort: 'nom',
    overrideAccess: true,
  })

  return <div className="ss-root vehicle-root">
    <SiteHeader activePage="vehicles" />
    <main className="vehicle-layout">
      <header className="vehicle-page-header"><div className="ss-container">
        <nav className="vehicle-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><span>Véhicules</span></nav>
        <h1>Véhicules de l’escouade</h1>
        <p>Les membres de l’escouade peuvent consulter les véhicules. Seul leur propriétaire peut modifier leur état et leur équipement.</p>
      </div></header>
      <section className="ss-container vehicle-list-content">
        {!docs.length ? <p className="vehicle-empty">Aucun véhicule accessible pour l’instant.</p> :
          <div className="vehicle-list-grid">{(docs as any[]).map((vehicle) => {
            const model = vehicle.modele && typeof vehicle.modele === 'object' ? vehicle.modele : null
            const owner = vehicle.proprietaire && typeof vehicle.proprietaire === 'object' ? vehicle.proprietaire : null
            const variant = model?.variante && typeof model.variante === 'object' ? model.variante : null
            const weapon = vehicle.armeTourelle && typeof vehicle.armeTourelle === 'object' ? vehicle.armeTourelle : null
            return <Link className="vehicle-list-card" href={`/vehicles/${vehicle.id}`} key={vehicle.id}>
              <div className="vehicle-list-card-heading"><div><span className="vehicle-eyebrow">{variant?.nom ?? 'Véhicule'}</span><h2>{vehicle.nom}</h2></div><span className="vehicle-card-arrow" aria-hidden="true">→</span></div>
              <p>{model?.nom ?? 'Modèle inconnu'}{owner?.nom ? ` · Propriété de ${owner.nom}` : ''}</p>
              <div className="vehicle-list-card-stats"><span>Blindage {Number(vehicle.blindageActuel) || 0} / {Number(model?.blindageMax) || 0}</span><span>{weapon?.nom ?? 'Tourelle vide'}</span></div>
            </Link>
          })}</div>}
      </section>
    </main>
    <SiteFooter />
  </div>
}
