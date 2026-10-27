'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { announceNavigationStart } from '@/components/NavigationFeedback'
import { startTemporaryCharacterWorkspace, type StartTemporaryWorkspaceState } from './actions'

const INITIAL_STATE: StartTemporaryWorkspaceState = { error: null, redirectTo: null }

export function TemporaryCharacterStartForm() {
  const router = useRouter()
  const pathname = usePathname()
  const hasNavigated = useRef(false)
  const [redirecting, setRedirecting] = useState(false)
  const [state, formAction, pending] = useActionState(startTemporaryCharacterWorkspace, INITIAL_STATE)

  useEffect(() => {
    if (pending || !state.redirectTo) return
    if (pathname === state.redirectTo) {
      setRedirecting(false)
      return
    }
    if (hasNavigated.current) {
      hasNavigated.current = false
      setRedirecting(false)
      return
    }

    hasNavigated.current = true
    setRedirecting(true)
    announceNavigationStart()
    router.push(state.redirectTo)
  }, [pathname, pending, router, state.redirectTo])

  return <form action={formAction} aria-busy={pending || redirecting}>
    <button type="submit" className="ss-btn ss-btn-outline" disabled={pending || redirecting}>
      {pending ? 'Création de la fiche…' : redirecting ? 'Ouverture de la fiche…' : 'Créer ma fiche temporaire'}
    </button>
    {(pending || redirecting) && <span className="ss-sr-only" role="status" aria-live="polite">
      {pending ? 'Création de votre fiche temporaire en cours.' : 'Ouverture de votre fiche temporaire.'}
    </span>}
    {state.error && <p className="temporary-character-form-error" role="alert">{state.error}</p>}
  </form>
}
