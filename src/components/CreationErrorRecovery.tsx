'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export function CreationErrorRecovery({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Character creation page failed to render', { digest: error.digest, error })
  }, [error])

  return <div className="ss-root char-root">
    <div className="char-content ss-container">
      <section className="char-card creation-panel creation-route-error" role="alert">
        <h1>Cette étape n’a pas pu être chargée</h1>
        <p>Les étapes déjà validées sont conservées. Réessayez de charger la fiche dans un instant.</p>
        {error.digest && <p className="creation-error-reference">Référence de l’erreur : {error.digest}</p>}
        <div className="creation-error-actions">
          <button className="creation-primary" type="button" onClick={reset}>Réessayer</button>
          <Link href="/" className="ss-btn ss-btn-outline">Retour à l’accueil</Link>
        </div>
      </section>
    </div>
  </div>
}
