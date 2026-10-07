import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { CharacterTransferClient, type TransferItem } from './TransferClient'
import '../shop.css'

const idOf = (value: any): number | null => {
  const id = value && typeof value === 'object' ? value.id : value
  return id === null || id === undefined ? null : Number(id)
}

function inventoryItems(character: any): TransferItem[] {
  const result: TransferItem[] = []
  const add = (field: string, rows: any[], relation: string | null, kind: string, label: string) => {
    rows.forEach((row, index) => {
      const entry = relation ? row?.[relation] : row
      const id = idOf(entry)
      if (!id || !entry || typeof entry !== 'object' || !entry.nom) return
      const quantity = field === 'inventaire' ? Number(row.quantite) : 1
      if (!Number.isSafeInteger(quantity) || quantity < 1) return
      result.push({ key: `${field}:${index}`, nom: entry.nom, kind, label, quantity })
    })
  }
  add('inventaireArmes', character.inventaireArmes ?? [], 'item', 'weapon', 'Arme en réserve')
  add('inventaireArmures', character.inventaireArmures ?? [], 'item', 'armor', 'Armure en réserve')
  add('inventaireMods', character.inventaireMods ?? [], null, 'mod', 'Mod en réserve')
  add('inventairePuces', character.inventairePuces ?? [], null, 'chip', 'Puce en réserve')
  add('inventaire', character.inventaire ?? [], 'consommable', 'consumable', 'Consommable')
  return result
}

export const metadata = { title: 'Transferts d’escouade — Space Squad' }

export default async function CharacterTransfersPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login')
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 2, limit: 1, overrideAccess: true })
  const character: any = docs[0]
  if (!character) redirect('/character')

  const groupId = idOf(character.groupe)
  const members = groupId
    ? await payload.find({ collection: 'characters', where: { and: [{ groupe: { equals: groupId } }, { id: { not_equals: character.id } }] }, depth: 0, limit: 200, sort: 'nom', overrideAccess: true })
    : { docs: [] as any[] }
  const recipients = (members.docs as any[]).map((member) => ({ id: member.id, nom: member.nom ?? `Personnage ${member.id}` }))

  return <div className="ss-root shop-root">
    <SiteHeader activePage="shop" />
    <div className="shop-layout">
      <section className="shop-heading"><div className="ss-container">
        <nav className="shop-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">›</span><Link href="/shop">Boutique</Link><span aria-hidden="true">›</span><span>Transferts d’escouade</span></nav>
        <h1>Transferts d’escouade</h1><p>Envoyez des objets de votre réserve ou des Konis à un autre membre de votre escouade.</p>
      </div></section>
      <main className="ss-container shop-content">
        <CharacterTransferClient character={{ id: character.id, nom: character.nom ?? 'Personnage', konis: Number(character.konis) || 0 }} recipients={recipients} items={inventoryItems(character)} />
      </main>
    </div>
    <SiteFooter />
  </div>
}
