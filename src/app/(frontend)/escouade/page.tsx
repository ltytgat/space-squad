import { headers } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import { getActiveMode } from '@/lib/activeMode'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { SquadClient } from './SquadClient'
import './escouade.css'

export const metadata = { title: 'Escouade — Space Squad' }

export default async function SquadPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  if (user.role === 'admin') redirect('/characters')
  const mode = await getActiveMode(user)
  const isMJ = mode === 'mj'

  if (isMJ) {
    const { docs } = await payload.find({
      collection: 'groups', where: { creator: { equals: user.id } },
      depth: 0, limit: 5, sort: 'nom', overrideAccess: true,
    })
    const squads = await Promise.all((docs as any[]).map(async (group) => {
      const { docs: characters } = await payload.find({
        collection: 'characters', where: { groupe: { equals: group.id } },
        depth: 0, limit: 500, sort: 'nom', select: { nom: true }, overrideAccess: true,
      })
      return { id: Number(group.id), nom: group.nom, inviteCode: group.inviteCode ?? null, members: characters.map((c: any) => c.nom || `Personnage ${c.id}`) }
    }))
    return <div className="ss-root squad-root"><SiteHeader activePage="squad" /><header className="squad-page-header"><div className="ss-container"><h1>Mes escouades</h1><p>Créez vos escouades et transmettez leur code d’invitation aux joueurs.</p></div></header><SquadClient mode="mj" squads={squads} currentSquad={null} /><SiteFooter /></div>
  }

  const character = await getActiveCharacter(payload, user, { depth: 1 })
  const currentGroup = character?.groupe && typeof character.groupe === 'object' ? character.groupe.nom : null
  return <div className="ss-root squad-root"><SiteHeader activePage="squad" /><header className="squad-page-header"><div className="ss-container"><h1>Mon escouade</h1><p>Utilisez le code communiqué par le MJ pour rejoindre une escouade.</p></div></header><SquadClient mode="player" squads={[]} currentSquad={currentGroup} /><SiteFooter /></div>
}
