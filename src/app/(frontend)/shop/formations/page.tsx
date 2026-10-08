import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { FormationsClient } from '../FormationsClient'
import type { FormationCharacterState, FormationOffer } from '../formation-pricing'
import type { SpecialRoleOffer } from '../special-role-pricing'
import '../shop.css'

export const metadata = { title: 'Formations — Space Squad' }

export default async function FormationsShopPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')

  const [{ docs: characters }, { docs: formationDocs }, { docs: roleDocs }] = await Promise.all([
    payload.find({
      collection: 'characters',
      where: { user: { equals: user.id } },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    }),
    payload.find({ collection: 'formations', depth: 1, pagination: false, sort: 'competence', overrideAccess: true }),
    payload.find({ collection: 'special-roles', depth: 0, pagination: false, sort: 'nom', overrideAccess: true }),
  ])
  const character: any = characters[0]
  if (!character) redirect('/character')

  const characterState: FormationCharacterState & { id: number; nom: string } = {
    id: character.id,
    nom: character.nom ?? 'Personnage',
    konis: character.konis ?? 0,
    pointsDeRang: character.pointsDeRang ?? 0,
    competences: (character.competences ?? []).map((entry: any) => ({
      competence: entry.competence,
      valeur: entry.valeur,
    })),
    reputation: (character.reputation ?? []).map((entry: any) => ({
      categorie: entry.categorie,
      valeur: entry.valeur,
    })),
    rolesSpeciaux: (character.rolesSpeciaux ?? []).map((entry: any) => ({
      id: Number(typeof entry === 'object' ? entry.id : entry),
      nom: String(typeof entry === 'object' ? entry.nom ?? '' : ''),
    })),
  }
  const formations: FormationOffer[] = (formationDocs as any[]).flatMap((formation) => {
    const faction = formation.organisationFormation
    if (!faction || typeof faction !== 'object' || faction.id == null || !faction.nom) return []
    return [{
      id: Number(formation.id),
      competence: String(formation.competence),
      organisationFormation: { id: Number(faction.id), nom: String(faction.nom) },
      coutKonis: formation.coutKonis ?? null,
      coutPointsDeRang: formation.coutPointsDeRang ?? null,
      coutRenommee: formation.coutRenommee ?? null,
    }]
  })
  const specialRoles: SpecialRoleOffer[] = (roleDocs as any[]).map((role) => ({
    id: Number(role.id),
    nom: String(role.nom ?? ''),
    description: String(role.description ?? ''),
    prix: role.prix ?? null,
  }))

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Formations</span></nav>
        <h1>Formations</h1><p>Développez les compétences de votre personnage auprès des différentes factions et acquérez des rôles spéciaux.</p>
      </div></section>
      <main className="ss-container shop-content">
        <FormationsClient character={characterState} formations={formations} specialRoles={specialRoles} />
      </main>
    </div>
    <SiteFooter />
  </div>
}
