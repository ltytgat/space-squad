import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import ChipsShopClient, { type ShopChip } from './ChipsShopClient'
import { shopScopes } from './shop-sections'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { getActiveCharacter } from '@/lib/activeCharacter'
import './shop.css'
import { adjustedShopPrice, getShopPolicyForCharacter, resolveShopPolicy, shopPolicyPaths } from '@/lib/groupShopPolicy'

const categoryOrder: Record<string, number> = { active: 0, passive: 1 }

function compareFrench(left: string, right: string) {
  return left.localeCompare(right, 'fr', { sensitivity: 'base', numeric: true })
}

export default async function ChipsShopPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const character: any = await getActiveCharacter(payload, user, { depth: 1 })
  if (!character) redirect('/character')
  if (!isCharacterCreationComplete(character)) redirect('/character')
  const policy = await getShopPolicyForCharacter(payload, character)

  const chipDocs: any[] = []
  let page = 1
  while (true) {
    const result = await payload.find({ collection: 'chips', depth: 1, limit: 500, page, overrideAccess: true })
    chipDocs.push(...result.docs)
    if (!result.hasNextPage || !result.nextPage) break
    page = result.nextPage
  }
  const allChips = chipDocs.map((chip): ShopChip => ({
    id: chip.id,
    nom: chip.nom ?? 'Puce sans nom',
    categorie: chip.categorie,
    available: resolveShopPolicy(policy, shopPolicyPaths('chips', chip)).available,
    policyPercentage: resolveShopPolicy(policy, shopPolicyPaths('chips', chip)).percentage,
    price: adjustedShopPrice(chip.categorie === 'active' ? 75_000 : 100_000, resolveShopPolicy(policy, shopPolicyPaths('chips', chip)).percentage) ?? 0,
    recyclePrice: adjustedShopPrice(10_000, resolveShopPolicy(policy, shopPolicyPaths('chips', chip)).percentage) ?? 10_000,
    restriction: chip.restriction ?? null,
    effet: chip.effet ?? '',
    cooldown: chip.cooldown ?? null,
    image: chip.image && typeof chip.image === 'object' && typeof chip.image.url === 'string'
      ? { url: chip.image.url, alt: chip.image.alt ?? chip.nom ?? 'Illustration de la puce' }
      : null,
    details: [
      { label: 'Catégorie', value: chip.categorie === 'active' ? 'Active' : 'Passive' },
      ...(chip.restriction ? [{ label: 'Restriction', value: String(chip.restriction) }] : []),
      ...(chip.effet ? [{ label: 'Effet', value: String(chip.effet) }] : []),
      ...(chip.categorie === 'active' && chip.cooldown != null ? [{ label: 'Cooldown', value: `${chip.cooldown} tour${chip.cooldown === 1 ? '' : 's'}` }] : []),
    ],
  })).sort((left, right) =>
    (categoryOrder[left.categorie] ?? 99) - (categoryOrder[right.categorie] ?? 99)
    || compareFrench(left.restriction ?? '', right.restriction ?? '')
    || compareFrench(left.nom, right.nom),
  )
  const chipById = new Map(allChips.map((chip) => [String(chip.id), chip]))
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
        <ChipsShopClient character={{ id: character.id, nom: character.nom ?? 'Personnage', konis: Number(character.konis) || 0 }} chips={allChips} owned={owned} drawPrices={{
          active: adjustedShopPrice(30_000, resolveShopPolicy(policy, ['sol', 'sol/puces', 'sol/puces/active']).percentage) ?? 0,
          passive: adjustedShopPrice(50_000, resolveShopPolicy(policy, ['sol', 'sol/puces', 'sol/puces/passive']).percentage) ?? 0,
        }} />
      </div>
    </div>
    <SiteFooter />
  </div>
}
