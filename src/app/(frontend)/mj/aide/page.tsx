import { headers } from 'next/headers.js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import '../../account/account.css'

export const metadata = {
  title: 'Aide MJ — Space Squad',
}

export default async function MJHelpPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  if (user.role !== 'admin' && user.isMJ !== true) redirect('/account')

  return (
    <div className="ss-root account-root">
      <SiteHeader />
      <div className="account-layout">
        <div className="account-page-header">
          <div className="ss-container">
            <nav className="account-breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">›</span>
              <Link href="/account">Mon compte</Link>
              <span aria-hidden="true">›</span>
              <span>Aide MJ</span>
            </nav>
            <h1 className="account-page-title">Aide MJ</h1>
          </div>
        </div>
        <div className="account-content ss-container">
          <div className="account-card">
            <div className="account-card-header">
              <p>Cette page présentera les outils et ressources disponibles pour les maîtres du jeu.</p>
            </div>
            <Link href="/account" className="ss-btn ss-btn-ghost">Retour à mon compte</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
