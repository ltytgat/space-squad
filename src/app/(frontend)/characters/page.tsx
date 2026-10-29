import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { CharactersClient } from './CharactersClient'
import './characters.css'
import { getActiveMode } from '@/lib/activeMode'
import { getMJGroupIds } from '@/lib/mjAccess'

export const metadata = {
  title: 'Personnages — Space Squad',
}

export default async function CharactersPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  const mode = await getActiveMode(user)
  const isAdmin = mode === 'admin'
  const isMJ = mode === 'mj'
  if (!isAdmin && !isMJ) redirect('/')

  const groupIds = isMJ ? await getMJGroupIds(payload, user) : []
  const characterWhere: any = isAdmin ? undefined : groupIds.length ? { groupe: { in: groupIds } } : { id: { equals: -1 } }

  const [{ docs: characters }, { docs: groups }, { docs: factions }] = await Promise.all([
    payload.find({
      collection: 'characters',
      ...(characterWhere ? { where: characterWhere } : {}),
      depth: 1,
      limit: 500,
      sort: 'nom',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'groups',
      ...(isMJ ? { where: { creator: { equals: user.id } } } : {}),
      depth: 0,
      limit: 100,
      sort: 'nom',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'factions',
      depth: 0,
      limit: 100,
      sort: 'nom',
    }),
  ])

  return (
    <div className="ss-root chars-root">
      <SiteHeader activePage="characters" />

      <div className="chars-layout">
        {/* ── En-tête ── */}
        <div className="chars-page-header">
          <div className="ss-container">
            <nav className="chars-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Personnages</span>
            </nav>
            <h1 className="chars-page-title">
              Personnages
              <span className="chars-page-count">{characters.length}</span>
            </h1>
          </div>
        </div>

        {/* ── Liste + filtre (client) ── */}
        <div className="chars-content ss-container">
          <CharactersClient
            canManageShop={isMJ}
            characters={characters as Parameters<typeof CharactersClient>[0]['characters']}
            groups={groups as Parameters<typeof CharactersClient>[0]['groups']}
            factions={factions as Parameters<typeof CharactersClient>[0]['factions']}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
