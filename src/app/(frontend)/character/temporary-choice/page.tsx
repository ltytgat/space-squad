import { headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getTemporaryCharacterOffer } from '@/lib/temporaryCharacterOffer'
import { chooseNewCharacter, resumeTemporaryCharacter } from './actions'
import './temporary-choice.css'

export const metadata = { title: 'Choisir une fiche — Space Squad' }

export default async function TemporaryCharacterChoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')

  const offer = await getTemporaryCharacterOffer(payload, user.id)
  if (!offer) redirect('/character')

  const characterName = typeof offer.character.nom === 'string' && offer.character.nom.trim()
    ? offer.character.nom
    : 'Fiche en cours de création'

  return (
    <div className="ss-root login-root temporary-choice-root">
      <SiteHeader activePage="character" />
      <div className="login-layout">
        <section className="login-box temporary-choice-box" aria-labelledby="temporary-choice-title">
          <h1 className="login-title" id="temporary-choice-title">Votre fiche temporaire est disponible</h1>
          <p className="login-subtitle">
            Vous pouvez reprendre « {characterName} » avec votre compte, ou commencer une nouvelle fiche.
          </p>

          {error === 'transfer' && <p className="login-feedback login-feedback-error" role="alert">
            Le transfert n’a pas abouti. Votre fiche temporaire est conservée ; vous pouvez réessayer.
          </p>}

          <form action={resumeTemporaryCharacter}>
            <button className="ss-btn ss-btn-primary login-submit" type="submit">Reprendre cette fiche</button>
          </form>
          <form action={chooseNewCharacter}>
            <button className="ss-btn ss-btn-outline login-submit" type="submit">Créer un nouveau personnage</button>
          </form>
        </section>
      </div>
      <SiteFooter />
    </div>
  )
}
