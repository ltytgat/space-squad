import { headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { LoginClient } from '../login/LoginClient'
import '../login/login.css'

export const metadata = { title: 'Créer un compte — Space Squad' }

export default async function RegisterPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (user) redirect('/')

  return (
    <div className="ss-root login-root">
      <SiteHeader />
      <div className="login-layout">
        <div className="login-box">
          <div className="login-header">
            <a href="/" className="login-logo-link" aria-label="Retour à l'accueil">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Space Squad" className="login-logo" />
            </a>
            <h1 className="login-title">Créer un compte</h1>
            <p className="login-subtitle">Créez votre compte Space Squad.</p>
          </div>
          <LoginClient initialMode="register" />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
