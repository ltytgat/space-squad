import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { AccountClient } from './AccountClient'
import './account.css'

export const metadata = {
  title: 'Mon compte — Space Squad',
}

export default async function AccountPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="ss-root account-root">
      <SiteHeader />

      <div className="account-layout">
        <div className="account-page-header">
          <div className="ss-container">
            <nav className="account-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Mon compte</span>
            </nav>
            <h1 className="account-page-title">Mon compte</h1>
          </div>
        </div>

        <AccountClient
          userId={String(user.id)}
          userEmail={user.email ?? ''}
          userRole={(user as { role?: string }).role ?? 'player'}
          userCreatedAt={user.createdAt ?? ''}
        />
      </div>

      <SiteFooter />
    </div>
  )
}
