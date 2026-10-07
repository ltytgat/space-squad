import { notFound } from 'next/navigation'
import ShopCatalogPage from '../ShopCatalogPage'
import { shopScopeByPath } from '../shop-sections'
import ChipsShopPage from '../ChipsShopPage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Boutique — Space Squad' }

export default async function ShopSectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params
  const scope = shopScopeByPath[section.join('/')]
  if (!scope) notFound()
  if (scope === 'sol-puces') return <ChipsShopPage />
  return <ShopCatalogPage scope={scope} />
}
