import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { ResetPasswordClient } from './ResetPasswordClient'
import '../../login/login.css'

export const metadata = {
  title: 'Réinitialiser le mot de passe — Space Squad',
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <div className="ss-root login-root">
      <SiteHeader />
      <main className="login-layout">
        <section className="login-box">
          <div className="login-header">
            <a href="/" className="login-logo-link" aria-label="Retour à l’accueil">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Space Squad" className="login-logo" />
            </a>
            <h1 className="login-title">Nouveau mot de passe</h1>
            <p className="login-subtitle">Choisissez un mot de passe d’au moins 12 caractères.</p>
          </div>
          <ResetPasswordClient token={token} />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
