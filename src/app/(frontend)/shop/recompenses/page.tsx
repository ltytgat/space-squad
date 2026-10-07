import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { relationId } from '@/lib/shop'
import { factionRewardsTitle } from '@/lib/factionRewards'
import { FactionRewardsClient } from '../FactionRewardsClient'
import type { FactionRewardCharacter, FactionRewardOffer } from '../faction-reward-pricing'
import '../shop.css'

export const metadata = { title: 'Récompenses de faction — Space Squad' }

export default async function FactionRewardsPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')

  const { docs } = await payload.find({
    collection: 'characters', where: { user: { equals: user.id }, affiliation: { exists: true } },
    depth: 2, limit: 1, overrideAccess: true,
  })
  const rawCharacter: any = docs[0]
  if (!rawCharacter) redirect('/shop')
  const faction = rawCharacter.affiliation && typeof rawCharacter.affiliation === 'object'
    ? rawCharacter.affiliation
    : await payload.findByID({ collection: 'factions', id: Number(relationId(rawCharacter.affiliation)), depth: 1, overrideAccess: true })
  if (!faction?.nom) redirect('/shop')

  const { docs: tiers } = await payload.find({ collection: 'faction-reward-tiers', depth: 2, limit: 500, sort: 'gradeRequis', overrideAccess: true })
  const offers: FactionRewardOffer[] = (tiers as any[]).flatMap((reward) => {
    const variant = (reward.factions ?? []).find((entry: any) => relationId(entry.faction) === String(faction.id))
    if (!variant || !reward.nom) return []
    const gradeRequis = Number(reward.gradeRequis)
    return [{
      id: Number(reward.id),
      nom: String(reward.nom),
      description: String(variant.description ?? ''),
      gradeRequis,
      gradeName: String(faction.rangs?.[gradeRequis - 1]?.nom ?? 'Grade non configuré'),
      coutPointsFaction: Number(reward.coutPointsFaction ?? 0),
      typeRecompense: reward.typeRecompense === 'acces-armes-ex' ? 'acces-armes-ex' : 'bon-reduction',
      pourcentageReduction: reward.pourcentageReduction == null ? null : Number(reward.pourcentageReduction),
      application: ['sol', 'espace', 'module'].includes(variant.application) ? variant.application : null,
    }]
  })
  const character: FactionRewardCharacter = {
    id: Number(rawCharacter.id),
    nom: String(rawCharacter.nom ?? 'Personnage'),
    konis: Number(rawCharacter.konis ?? 0),
    pointsDeFaction: Number(rawCharacter.pointsDeFaction ?? 0),
    rangDeFaction: rawCharacter.rangDeFaction == null ? null : String(rawCharacter.rangDeFaction),
    affiliation: {
      id: Number(faction.id),
      nom: String(faction.nom),
      rangs: (faction.rangs ?? []).map((rank: any) => ({ nom: String(rank.nom ?? ''), pointsRequis: Number(rank.pointsRequis ?? 0) })),
    },
    inventaireRecompensesFaction: (rawCharacter.inventaireRecompensesFaction ?? []).map((item: any) => ({
      nom: String(item.nom), effet: String(item.effet), faction: String(item.faction), grade: String(item.grade),
      id: item.id == null ? undefined : String(item.id),
      typeRecompense: item.typeRecompense === 'acces-armes-ex' ? 'acces-armes-ex' : item.typeRecompense === 'bon-reduction' ? 'bon-reduction' : null,
      pourcentageReduction: item.pourcentageReduction == null ? null : Number(item.pourcentageReduction),
      usage: ['arme-sol', 'arme-espace', 'module-espace'].includes(item.usage) ? item.usage : null,
    })),
  }
  const title = factionRewardsTitle(character.affiliation.nom)

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>{title}</span></nav>
        <h1>{title}</h1><p>Échangez vos points de faction, obtenez des récompenses et progressez dans votre organisation.</p>
      </div></section>
      <main className="ss-container shop-content"><FactionRewardsClient character={character} offers={offers} /></main>
    </div>
    <SiteFooter />
  </div>
}
