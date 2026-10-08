import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import ChipsShopClient, { type ShopChip } from './ChipsShopClient'
import { shopScopes } from './shop-sections'
import './shop.css'

const categoryOrder: Record<string, number> = { active: 0, passive: 1 }

function compareFrench(left: string, right: string) {
  return left.localeCompare(right, 'fr', { sensitivity: 'base', numeric: true })
}

export default async function ChipsShopPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs: characters } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 1, limit: 1, overrideAccess: true })
  const character: any = characters[0]
  if (!character) redirect('/character')

  const chipDocs: any[] = []
  let page = 1
  while (true) {
    const result = await payload.find({ collection: 'chips', depth: 1, limit: 500, page, overrideAccess: true })
    chipDocs.push(...result.docs)
    if (!result.hasNextPage || !result.nextPage) break
    page = result.nextPage
  }
  const chips = chipDocs.map((chip): ShopChip => ({
    id: chip.id,
    nom: chip.nom ?? 'Puce sans nom',
    categorie: chip.categorie,
    restriction: chip.restriction ?? null,
    effet: chip.effet ?? '',
    cooldown: chip.cooldown ?? null,
    image: chip.image && typeof chip.image === 'object' && typeof chip.image.url === 'string'
      ? { url: chip.image.url, alt: chip.image.alt ?? chip.nom ?? 'Illustration de la puce' }
      : null,
  })).sort((left, right) =>
    (categoryOrder[left.categorie] ?? 99) - (categoryOrder[right.categorie] ?? 99)
    || compareFrench(left.restriction ?? '', right.restriction ?? '')
    || compareFrench(left.nom, right.nom),
  )
  const chipById = new Map(chips.map((chip) => [String(chip.id), chip]))
  const owned = (Array.isArray(character.inventairePuces) ? character.inventairePuces : [])
    .flatMap((value: any, index: number) => {
      const chip = chipById.get(String(value && typeof value === 'object' ? value.id : value))
      return chip ? [{ chip, index }] : []
    })

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>{shopScopes['sol-puces'].title}</span></nav>
        <h1>{shopScopes['sol-puces'].title}</h1><p>{shopScopes['sol-puces'].description}</p>
      </div></section>
      <div className="ss-container shop-content">
        <ChipsShopClient character={{ id: character.id, nom: character.nom ?? 'Personnage', konis: Number(character.konis) || 0 }} chips={chips} owned={owned} />
      </div>
    </div>
    <SiteFooter />
  </div>
}
