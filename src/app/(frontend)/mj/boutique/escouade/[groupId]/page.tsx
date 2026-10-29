import { headers } from 'next/headers.js'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { isMJMode } from '@/lib/activeMode'
import { getMJGroupIds } from '@/lib/mjAccess'
import { getShopPolicyForGroup, loadShopPolicyCatalogs, shopPolicyTreeFromCatalogs } from '@/lib/groupShopPolicy'
import { GroupShopPolicyClient } from './GroupShopPolicyClient'
import '../../../../shop/shop.css'

export const metadata = { title: 'Tarifs boutique par escouade — Space Squad' }

export default async function GroupShopPolicyPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId: rawGroupId } = await params
  const groupId = Number(rawGroupId)
  if (!Number.isSafeInteger(groupId) || groupId <= 0) notFound()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  if (!(await isMJMode(user))) notFound()
  if (!(await getMJGroupIds(payload, user)).includes(groupId)) notFound()
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 0, overrideAccess: true }).catch(() => null) as any
  if (!group) notFound()
  const catalogs = await loadShopPolicyCatalogs(payload)
  const policy = await getShopPolicyForGroup(payload, groupId)

  return <div className="ss-root shop-root">
    <SiteHeader activePage="characters" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">›</span><a href="/characters">Personnages</a><span aria-hidden="true">›</span><span>Boutique · {group.nom}</span></nav>
        <h1>Boutique de l’escouade {group.nom}</h1>
        <p>Les modifications ne concernent que les membres de cette escouade.</p>
      </div></section>
      <main className="ss-container shop-content">
        <GroupShopPolicyClient groupId={groupId} initialPolicy={policy} tree={shopPolicyTreeFromCatalogs(catalogs)} />
      </main>
    </div>
    <SiteFooter />
  </div>
}
