import { headers } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getActiveMode } from '@/lib/activeMode'
import { getActiveCharacter, getOwnedCharacters } from '@/lib/activeCharacter'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { computeRank } from '@/lib/rankSystem'
import { MyCharactersClient } from './MyCharactersClient'
import '../characters/characters.css'
import './my-characters.css'

export const metadata = { title: 'Mes personnages — Space Squad' }

export default async function MyCharactersPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')

  const characters = await getOwnedCharacters(payload, user, { depth: 1 })
  const activeCharacter = await getActiveCharacter(payload, user)
  const characterIds = characters.map((character) => Number(character.id))
  const [shipsResult, vehiclesResult] = characterIds.length
    ? await Promise.all([
        payload.find({
          collection: 'ships', where: { proprietaire: { in: characterIds } },
          depth: 0, pagination: false, select: { id: true, proprietaire: true }, overrideAccess: true,
        }),
        payload.find({
          collection: 'vehicles', where: { proprietaire: { in: characterIds } },
          depth: 0, pagination: false, select: { id: true, proprietaire: true }, overrideAccess: true,
        }),
      ])
    : [{ docs: [] }, { docs: [] }]

  const countByOwner = (docs: any[]) => {
    const counts = new Map<number, number>()
    for (const doc of docs) {
      const ownerId = typeof doc.proprietaire === 'object' ? doc.proprietaire?.id : doc.proprietaire
      if (ownerId != null) counts.set(Number(ownerId), (counts.get(Number(ownerId)) ?? 0) + 1)
    }
    return counts
  }
  const shipCounts = countByOwner(shipsResult.docs as any[])
  const vehicleCounts = countByOwner(vehiclesResult.docs as any[])
  const viewCharacters = characters.map((character) => ({
    id: Number(character.id),
    nom: character.nom ?? null,
    sexe: character.sexe ?? null,
    origine: character.origine ?? null,
    affiliation: typeof character.affiliation === 'object' && character.affiliation
      ? { nom: character.affiliation.nom ?? '' }
      : null,
    rank: computeRank(character.pointsDeRang ?? 0).level,
    konis: character.konis ?? 0,
    creationComplete: isCharacterCreationComplete(character),
    shipsCount: shipCounts.get(Number(character.id)) ?? 0,
    vehiclesCount: vehicleCounts.get(Number(character.id)) ?? 0,
  }))

  return (
    <div className="ss-root chars-root">
      <SiteHeader activePage="myCharacters" />
      <main className="chars-layout">
        <header className="chars-page-header my-characters-heading">
          <div className="ss-container">
            <nav className="chars-breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link><span aria-hidden="true">›</span><span>Mes personnages</span>
            </nav>
            <h1 className="chars-page-title">
              Mes personnages <span className="chars-page-count">{characters.length} / 5</span>
            </h1>
            <p>Choisissez le personnage qui vous représente dans l’escouade, les vaisseaux et la boutique.</p>
          </div>
        </header>
        <section className="chars-content ss-container my-characters-content">
          <MyCharactersClient
            characters={viewCharacters}
            activeCharacterId={activeCharacter ? Number(activeCharacter.id) : null}
            canCreate={user.role !== 'player' || await getActiveMode(user) !== 'mj'}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
