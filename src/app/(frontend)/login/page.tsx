import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LoginClient } from './LoginClient'
import './login.css'

export const metadata = {
  title: 'Connexion — Space Squad',
}

export default async function LoginPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Déjà connecté → redirige vers l'accueil (qui redirigera si besoin)
  if (user) {
    redirect('/')
  }

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
            <h1 className="login-title">Connexion</h1>
            <p className="login-subtitle">Accédez à votre espace Space Squad.</p>
          </div>

          <LoginClient />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
